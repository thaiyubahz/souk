import { db, isFirebaseConfigured } from "@/config/firebase.config";
import {
    collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc,
    onSnapshot, query, where, orderBy, serverTimestamp,
    limit, updateDoc, type Unsubscribe,
} from "firebase/firestore";
import type { Product } from "../components/Types";
import { getDeviceId } from "./identity";
import { BACKEND_URL } from "@/lib/api";

export interface BecomeSellerData {
    fullName: string;
    shopName: string;
    contactPhone: string;
    shopAddress: string;
    productName: string;
    productDescription: string;
    productCategory: string;
    productPrice: string;
    mode: "sale" | "rent";
}

const mapMockProduct = (item: any): Product => ({
    id: item.id.toString(),
    name: item.title || item.name || "",
    seller: "Community Seller",
    category: item.category === "products" ? "clothes" : (item.category || "all"),
    price: item.price?.amount || item.price || 0,
    unit: item.unit || "per unit",
    rating: 4.8,
    reviews: item.interestCount || 0,
    badge: item.badge || null,
    img: item.images?.[0] || item.img || "sparkle",
    description: item.description || "",
    location: item.location || item.shopAddress || "Remote",
    type: item.isFreebie ? "rent" : "sale",
    tags: Array.isArray(item.tags) ? item.tags : [],
    sellerPhone: "",
    sellerId: item.sellerId || ""
});

// Halal guardrail (prototype): a basic prohibited-items list. A new listing
// whose name/category/shop mentions any of these is rejected before it can be
// saved. The Feature PDF (§10 Moderation, §11 Halal Principles) envisions a
// fuller pipeline — AI screening, community reporting, scholar escalation — and
// this is the first, simplest layer of that.
const PROHIBITED_TERMS = [
    "weapon", "weapons", "gun", "guns", "rifle", "pistol", "firearm", "ammo",
    "ammunition", "knife for attack", "explosive", "alcohol", "wine", "beer",
    "liquor", "whisky", "vodka", "drug", "drugs", "cocaine", "heroin", "cannabis",
    "weed", "marijuana", "pork", "bacon", "ham ", "gambling", "casino", "lottery",
    "betting", "riba", "interest loan", "cigarette", "tobacco", "vape", "porn",
];

/**
 * Read an image File and return a small JPEG data URL. The image is scaled down
 * (longest side ≤ 800px) and re-encoded at ~70% quality so the result stays
 * well under Firestore's 1 MB-per-document limit and the free-tier quota —
 * which means the picture can be stored *inside* the product document with no
 * paid Storage service. Browser-only (uses canvas); runs at create time.
 */
async function fileToCompressedDataUrl(
    file: File,
    maxDim = 800,
    quality = 0.7,
): Promise<string> {
    const rawDataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read the image file."));
        reader.readAsDataURL(file);
    });

    const image: HTMLImageElement = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load the image."));
        img.src = rawDataUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl; // very old browser — fall back to the raw image
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
}

// Work out the next tidy listing id (lst_1007, lst_1008, …) by finding the
// highest existing "lst_<number>" and adding one — so Firestore documents get
// readable ids instead of random strings. (Fine for a prototype; a production
// app would use a counter document + transaction to avoid two uploads racing
// for the same number.)
async function nextListingId(): Promise<string> {
    let max = 1000;
    if (db) {
        try {
            const snap = await getDocs(collection(db, "products"));
            snap.forEach((d) => {
                const m = d.id.match(/^lst_(\d+)$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    if (n > max) max = n;
                }
            });
        } catch {
            /* if the read fails, fall back to max+1 */
        }
    }
    return `lst_${max + 1}`;
}

export const SoukService = {
    /**
     * Listens to the products collection in real-time.
     */
    subscribeToProducts: (callback: (products: Product[]) => void): Unsubscribe => {
        // Try to fetch from the Python Backend
        fetch(`${BACKEND_URL}/api/products`)
            .then(async r => {
                if (!r.ok) throw new Error("Backend offline");
                return r.json();
            })
            .then(data => {
                if (Array.isArray(data)) callback(data.map(mapMockProduct));
            })
            .catch(() => console.log("Python backend unavailable, falling back..."));

        if (!isFirebaseConfigured || !db) {
            console.warn("Firebase not configured. Product subscription inactive.");
            // Load mock data from public directory as fallback
            fetch('/mock-data/listings.json')
                .then(r => r.json())
                .then(data => {
                    callback(data.map(mapMockProduct));
                })
                .catch(e => console.error("Failed to load mock products", e));
            return () => { };
        }

        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            const prods: Product[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                prods.push({
                    id: docSnap.id,
                    name: data.name || "",
                    seller: data.seller || "Unknown Seller",
                    category: data.category || "all",
                    price: data.price || 0,
                    unit: data.unit || "unit",
                    rating: data.rating || 0,
                    reviews: data.reviews || 0,
                    badge: data.badge || null,
                    type: data.type || "sale",
                    location: data.location || "Remote",
                    img: data.img || "sparkle",
                    tags: data.tags || [],
                    description: data.description || "",
                    sellerPhone: data.sellerPhone || "",
                    sellerId: data.sellerId || "",
                    ownerDeviceId: data.ownerDeviceId || "",
                } as Product);
            });
            callback(prods);
        });
    },

    /**
     * Create a new listing (prototype).
     *
     * No login required. The product photo is shrunk and stored *inline* in the
     * Firestore document (free — no paid Storage service), and a basic halal /
     * prohibited-items check runs before anything is written.
     */
    establishShop: async (data: BecomeSellerData, productFile: File | null) => {
        if (!isFirebaseConfigured || !db) {
            throw new Error("Firebase is not configured (.env). Cannot save the listing.");
        }

        // Halal guardrail — reject prohibited items before writing anything.
        const haystack = `${data.productName} ${data.productDescription} ${data.productCategory} ${data.shopName}`.toLowerCase();
        const banned = PROHIBITED_TERMS.find((term) => haystack.includes(term));
        if (banned) {
            throw new Error(
                `This listing mentions "${banned.trim()}", which isn't allowed on the Souk. ` +
                `Only halal, ethical items can be listed.`,
            );
        }

        // Shrink the photo to a small data URL so it fits inside the document
        // (well under Firestore's 1 MB limit) — no paid Storage needed.
        let img = "sparkle";
        if (productFile) {
            img = await fileToCompressedDataUrl(productFile);
        }

        const parsedPrice = parseFloat(data.productPrice) || 0;
        const createdAt = new Date().toISOString();

        // Best-effort seller profile (doesn't block the listing if it fails).
        const sellerId = `seller_${createdAt}`;
        try {
            await setDoc(doc(db, "sellers", sellerId), {
                shopName: data.shopName,
                name: data.shopName,
                phone: data.contactPhone,
                address: data.shopAddress,
                rating: 5,
                isVerified: false,
                createdAt,
            });
        } catch (e) {
            console.warn("Could not write seller profile (continuing):", e);
        }

        // The listing itself — shaped to match what the Souk product feed reads.
        // Use a tidy sequential id (lst_1007, …) instead of a random string.
        const newId = await nextListingId();
        await setDoc(doc(db, "products", newId), {
            name: data.productName,
            category: data.productCategory,
            price: parsedPrice,
            type: data.mode,
            sellerId,
            ownerDeviceId: getDeviceId(),
            seller: data.shopName,
            sellerPhone: data.contactPhone,
            location: data.shopAddress.split(",").pop()?.trim() || "Local",
            rating: 5,
            reviews: 0,
            unit: data.mode === "rent" ? "per day" : "per item",
            description: data.productDescription?.trim() || data.productName,
            img,
            tags: ["community", "ethical"],
            badge: "New Seller",
            createdAt,
        });

        return { sellerId, productId: newId };
    },

    /** Delete a listing by id. (Prototype: open; production restricts to the owner.) */
    deleteListing: async (id: string) => {
        if (!isFirebaseConfigured || !db) return;
        await deleteDoc(doc(db, "products", id));
    },

    /** Update a listing's editable fields (name / price). */
    updateListing: async (id: string, patch: { name?: string; price?: number }) => {
        if (!isFirebaseConfigured || !db) return;
        await updateDoc(doc(db, "products", id), patch);
    },

    /**
     * Rate a product (1–5 stars) and return the new average.
     *
     * Prototype-simple: we DON'T store who rated. We just keep the product's
     * average (`rating`) and count (`reviews`) and adjust those two numbers.
     * "One rating per device" is enforced in the browser (localStorage) by the
     * caller — nothing extra is saved in Firebase.
     *
     * `previousStars` lets a device CHANGE its mind: pass the stars it gave
     * before (0 if this is a first rating). When changing, the count stays the
     * same and we just swap the old stars for the new ones in the average.
     */
    rateProduct: async (productId: string, stars: number, previousStars = 0) => {
        if (!isFirebaseConfigured || !db) return null;
        const ref = doc(db, "products", productId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        const data = snap.data();
        const oldAvg = typeof data.rating === "number" ? data.rating : 0;
        const oldCount = typeof data.reviews === "number" ? data.reviews : 0;

        let newCount: number;
        let newAvg: number;
        if (previousStars > 0 && oldCount > 0) {
            // CHANGING an existing rating: count is unchanged; remove the old
            // stars from the total and add the new ones.
            newCount = oldCount;
            newAvg = (oldAvg * oldCount - previousStars + stars) / newCount;
        } else {
            // FIRST rating from this device: one more vote in the average.
            newCount = oldCount + 1;
            newAvg = (oldAvg * oldCount + stars) / newCount;
        }
        newAvg = Math.round(newAvg * 10) / 10; // keep 1 decimal place
        await updateDoc(ref, { rating: newAvg, reviews: newCount });
        return { rating: newAvg, reviews: newCount };
    },

    /**
     * Remove a device's rating from a product and return the new average.
     *
     * `previousStars` is the stars this device gave before (we know it from the
     * browser's localStorage). We take that vote back out: the count drops by
     * one and the stars are removed from the average. If it was the only rating,
     * the product goes back to 0 / no ratings.
     */
    removeRating: async (productId: string, previousStars: number) => {
        if (!isFirebaseConfigured || !db) return null;
        const ref = doc(db, "products", productId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        const data = snap.data();
        const oldAvg = typeof data.rating === "number" ? data.rating : 0;
        const oldCount = typeof data.reviews === "number" ? data.reviews : 0;
        if (previousStars <= 0 || oldCount <= 0) {
            return { rating: oldAvg, reviews: oldCount }; // nothing to remove
        }
        const newCount = oldCount - 1;
        // If no ratings remain, reset to 0; otherwise re-average without this vote.
        const newAvg = newCount > 0
            ? Math.round(((oldAvg * oldCount - previousStars) / newCount) * 10) / 10
            : 0;
        await updateDoc(ref, { rating: newAvg, reviews: newCount });
        return { rating: newAvg, reviews: newCount };
    },

    /** Fetch a single seller's profile by id. */
    getSeller: async (id: string) => {
        if (!isFirebaseConfigured || !db) return null;
        const snap = await getDoc(doc(db, "sellers", id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    /**
     * Listens for KYC status updates for a user in real-time.
     */
    subscribeToKycStatus: (uid: string, callback: (status: any) => void): Unsubscribe => {
        if (!isFirebaseConfigured || !db) return () => { };
        return onSnapshot(doc(db, "kyc", uid), (docSnap) => {
            callback(docSnap.exists() ? docSnap.data() : null);
        });
    },

    /**
     * Listens to chats for a specific user.
     */
    subscribeToChats: (uid: string, callback: (chats: any[]) => void): Unsubscribe => {
        if (!isFirebaseConfigured || !db) return () => { };
        // No orderBy here on purpose: combining array-contains with orderBy needs
        // a composite index in Firestore. We sort newest-first on the client.
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", uid)
        );
        return onSnapshot(q, (snap) => {
            const chats = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
            chats.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            callback(chats);
        });
    },

    /**
     * Listens to messages in a specific chat.
     */
    subscribeToMessages: (chatId: string, callback: (messages: any[]) => void): Unsubscribe => {
        if (!isFirebaseConfigured || !db) return () => { };
        const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(50));
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

    /**
     * Sends a message and updates the chat metadata for the conversation list.
     */
    sendMessage: async (chatId: string, senderId: string, text: string) => {
        if (!isFirebaseConfigured || !db) return;
        await addDoc(collection(db, "chats", chatId, "messages"), {
            senderId, text, createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "chats", chatId), {
            lastMessage: text, updatedAt: serverTimestamp()
        });
    }
};