import { auth, db, storage, isFirebaseConfigured } from "@/config/firebase.config";
import {
    collection, doc, setDoc, addDoc, getDoc,
    onSnapshot, query, where, orderBy, serverTimestamp,
    limit, Unsubscribe, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
     * Handles the complex multi-step process of establishing a new shop.
     */
    establishShop: async (data: BecomeSellerData, idFile: File | null, productFile: File | null) => {
        // Use local backend if Firebase is not configured or as a preference
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => formData.append(key, value));
            if (idFile) formData.append("idFile", idFile);
            if (productFile) formData.append("productFile", productFile);

            const response = await fetch(`${BACKEND_URL}/establish-shop`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn("Local backend failed, attempting Firebase...");
        }

        if (!isFirebaseConfigured) throw new Error("No backend available (Local or Firebase).");
        if (!auth.currentUser) throw new Error("Authentication required for Firebase.");

        const uid = auth.currentUser.uid;
        const timestamp = serverTimestamp();

        // 1. Upload files to Storage
        let idUrl = "";
        if (idFile) {
            const idRef = ref(storage, `kyc/${uid}/${Date.now()}_${idFile.name}`);
            const snapshot = await uploadBytes(idRef, idFile);
            idUrl = await getDownloadURL(snapshot.ref);
        }

        let productUrl = "sparkle";
        if (productFile) {
            const prodRef = ref(storage, `products/${uid}/${Date.now()}_${productFile.name}`);
            const snapshot = await uploadBytes(prodRef, productFile);
            productUrl = await getDownloadURL(snapshot.ref);
        }

        // 2. Atomic-like updates (simplified for prototype)
        // KYC
        await setDoc(doc(db, "kyc", uid), {
            userId: uid,
            fullName: data.fullName,
            idType: data.idType,
            idNumber: data.idNumber,
            idDocumentUrl: idUrl,
            status: "pending",
            updatedAt: timestamp
        });

        // Seller Profile
        await setDoc(doc(db, "sellers", uid), {
            userId: uid,
            shopName: data.shopName,
            phone: data.contactPhone,
            address: data.shopAddress,
            rating: 0,
            isVerified: false,
            createdAt: timestamp
        });

        // First Listing
        const productRef = doc(collection(db, "products"));
        const parsedPrice = parseFloat(data.productPrice) || 0;

        await setDoc(productRef, {
            name: data.productName,
            category: data.productCategory,
            price: parsedPrice,
            type: data.mode,
            sellerId: uid,
            seller: data.shopName,
            sellerPhone: data.contactPhone,
            location: data.shopAddress.split(',').pop()?.trim() || "Local",
            rating: 5,
            reviews: 1,
            unit: data.mode === "rent" ? "per day" : "per unit",
            description: data.productName,
            img: productUrl,
            tags: ["community", "ethical"],
            badge: "New Seller",
            createdAt: timestamp
        });

        return { uid, productId: productRef.id };
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