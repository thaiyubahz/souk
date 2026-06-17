import { db, isFirebaseConfigured } from "@/config/firebase.config";
import {
    collection, doc, setDoc, addDoc,
    onSnapshot, query, where, orderBy, serverTimestamp,
    limit, updateDoc, type Unsubscribe,
} from "firebase/firestore";
import type { Product } from "../components/Types";

export interface BecomeSellerData {
    fullName: string;
    idType: string;
    idNumber: string;
    shopName: string;
    contactPhone: string;
    shopAddress: string;
    productName: string;
    productCategory: string;
    productPrice: string;
    mode: "sale" | "rent";
}

const BACKEND_URL = "http://localhost:8000/api";

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

export const SoukService = {
    /**
     * Listens to the products collection in real-time.
     */
    subscribeToProducts: (callback: (products: Product[]) => void): Unsubscribe => {
        // Try to fetch from the Python Backend
        fetch(`${BACKEND_URL}/products`)
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
    establishShop: async (data: BecomeSellerData, _idFile: File | null, productFile: File | null) => {
        if (!isFirebaseConfigured || !db) {
            throw new Error("Firebase is not configured (.env). Cannot save the listing.");
        }

        // Halal guardrail — reject prohibited items before writing anything.
        const haystack = `${data.productName} ${data.productCategory} ${data.shopName}`.toLowerCase();
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
        const productRef = await addDoc(collection(db, "products"), {
            name: data.productName,
            category: data.productCategory,
            price: parsedPrice,
            type: data.mode,
            sellerId,
            seller: data.shopName,
            sellerPhone: data.contactPhone,
            location: data.shopAddress.split(",").pop()?.trim() || "Local",
            rating: 5,
            reviews: 0,
            unit: data.mode === "rent" ? "per day" : "per item",
            description: data.productName,
            img,
            tags: ["community", "ethical"],
            badge: "New Seller",
            createdAt,
        });

        return { sellerId, productId: productRef.id };
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
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", uid),
            orderBy("updatedAt", "desc")
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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