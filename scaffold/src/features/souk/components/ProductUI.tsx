import { useState } from "react";
import { Heart, Sparkle, MapPin, ChatCenteredText, X, ShieldCheck, Storefront, Star, Phone } from "@phosphor-icons/react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { COLORS } from "./Theme";
import type { Product } from "./Types";
import { Badge, StarRating } from "./UIAtoms";
import { SoukService } from "../services/soukService";
import { MapPlaceholder } from "./LayoutUI"; // MapPlaceholder is more of a layout/section component

interface ProductCardProps { // This interface is specific to ProductCard, keep it here
    product: Product;
    onView: (p: Product) => void;
    onLike: (p: Product) => void;
    isLiked: boolean;
}

export function ProductCard({ product, onView, onLike, isLiked }: ProductCardProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={() => onView(product)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? COLORS.bgCardHover : COLORS.bgCard,
                border: `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
                borderRadius: 16,
                padding: 0,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: hovered ? "translateY(-8px) scale(1.02)" : "none",
                boxShadow: hovered ? `0 20px 40px rgba(0,0,0,0.6), 0 0 20px ${COLORS.goldDim}` : "none",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onLike(product); }}
                style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 10,
                    background: "rgba(12,15,21,0.5)",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", color: isLiked ? COLORS.accent : COLORS.textMuted
                }}>
                <Heart size={20} weight={isLiked ? "fill" : "regular"} />
            </button>

            <div style={{
                background: "linear-gradient(135deg, rgba(212,168,83,0.03), rgba(0,0,0,0.1))",
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                borderBottom: `1px solid ${COLORS.border}`
            }}>
                {product.img && (product.img.startsWith('http') || product.img.startsWith('data:')) ? (
                    <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ opacity: 0.2, transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)", transform: hovered ? "scale(1.2) rotate(8deg)" : "scale(1)" }}>
                        <Sparkle size={64} weight="thin" color={COLORS.gold} />
                    </div>
                )}
                {product.badge && (
                    <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <Badge text={product.badge} type={product.type === "rent" ? "purple" : "gold"} />
                    </div>
                )}
            </div>

            <div style={{ padding: "16px" }}>
                <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={10} /> {product.location} · {product.seller}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8, lineHeight: 1.3 }}>{product.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                    <StarRating rating={product.rating} />
                    <span style={{ fontSize: 11, color: COLORS.textDim }}>({product.reviews})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.goldLight }}>₹{product.price.toLocaleString()}</div>
                    </div>
                    <div style={{ background: COLORS.bgGlass, color: COLORS.gold, border: `1px solid ${COLORS.border}`, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChatCenteredText size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ProductDetailProps {
    product: Product;
    onBack: () => void;
    user: any;
    setPage: (p: string) => void;
    showToast: (m: string) => void;
    setSelectedChatId: (id: string | null) => void;
    isMobile: boolean;
    onViewSeller?: (sellerId: string) => void;
}

export function ProductDetail({ product, onBack, user, setPage, showToast, setSelectedChatId, isMobile, onViewSeller }: ProductDetailProps) {
    // "Rate once per device" — remembered ONLY in the browser (localStorage),
    // so nothing extra is stored in Firebase. We just bump the product's
    // average on screen + in Firestore.
    const RATED_KEY = "souk_rated";
    const readRated = (): Record<string, number> => {
        try { return JSON.parse(localStorage.getItem(RATED_KEY) || "{}"); } catch { return {}; }
    };

    const [myRating, setMyRating] = useState<number>(() => readRated()[String(product.id)] || 0);
    const [hoverStar, setHoverStar] = useState(0);
    const [avg, setAvg] = useState(product.rating);
    const [count, setCount] = useState(product.reviews);

    const handleRate = async (stars: number) => {
        if (stars === myRating) return; // tapped the same star — nothing to change
        try {
            // Pass the device's previous stars so a re-tap CHANGES the rating
            // (instead of counting as a brand-new vote).
            const res = await SoukService.rateProduct(String(product.id), stars, myRating);
            if (res) { setAvg(res.rating); setCount(res.reviews); }
            const map = readRated();
            map[String(product.id)] = stars;
            localStorage.setItem(RATED_KEY, JSON.stringify(map));
            const changed = myRating > 0;
            setMyRating(stars);
            showToast(
                changed
                    ? `Updated — you now rate this ${stars} ${stars === 1 ? "star" : "stars"}.`
                    : `Thanks! You rated this ${stars} ${stars === 1 ? "star" : "stars"}.`
            );
        } catch (e) {
            console.error(e);
            showToast("Sorry — could not save your rating.");
        }
    };

    const handleRemoveRating = async () => {
        if (!myRating) return;
        try {
            const res = await SoukService.removeRating(String(product.id), myRating);
            if (res) { setAvg(res.rating); setCount(res.reviews); }
            const map = readRated();
            delete map[String(product.id)]; // forget this device's rating
            localStorage.setItem(RATED_KEY, JSON.stringify(map));
            setMyRating(0);
            setHoverStar(0);
            showToast("Your rating was removed.");
        } catch (e) {
            console.error(e);
            showToast("Sorry — could not remove your rating.");
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px" : "40px 24px" }}>
            <button
                onClick={onBack}
                style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 20 : 32, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}
            >
                <X size={16} /> {isMobile ? "Back" : "Close Product View"}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr", gap: isMobile ? 32 : 64, alignItems: "start" }}>
                {/* Left: Product Media */}
                <div style={{ position: isMobile ? "static" : "sticky", top: 100 }}>
                    <div style={{
                        background: COLORS.bgCard,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 32,
                        height: isMobile ? 300 : 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24,
                        overflow: "hidden"
                    }}>
                        {product.img && (product.img.startsWith('http') || product.img.startsWith('data:')) ? (
                            <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Sparkle size={160} weight="thin" color={COLORS.gold} style={{ opacity: 0.15 }} />
                        )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: isMobile ? 12 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(123,158,137,0.08)", border: `1px solid ${COLORS.success}`, borderRadius: 12, padding: "12px 16px", color: COLORS.success, fontSize: 12 }}>
                            <ShieldCheck size={18} weight="duotone" /> Encrypted Community Messaging Enabled
                        </div>
                        <button
                            onClick={async () => {
                                if (!user) {
                                    setPage("account");
                                    showToast("Please sign in to message sellers");
                                    return;
                                }
                                const sellerId = product.sellerId || "mock-seller-id";

                                try {
                                    const participants = [user.uid, sellerId].sort();
                                    const chatId = participants.join('_');

                                    await setDoc(doc(db, "chats", chatId), {
                                        participants,
                                        productName: product.name,
                                        productId: product.id,
                                        sellerName: product.seller,
                                        userName: user.displayName || user.email || "User",
                                        updatedAt: serverTimestamp(),
                                    }, { merge: true });

                                    setSelectedChatId(chatId);
                                    setPage("messages");
                                } catch (e) {
                                    console.error(e);
                                    showToast("Messaging requires Firebase setup.");
                                }
                            }}
                            style={{
                                width: "100%",
                                background: COLORS.gold,
                                color: "#101a2a",
                                border: "none",
                                borderRadius: 16,
                                padding: isMobile ? "16px" : "20px",
                                fontSize: isMobile ? 14 : 16,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 12
                            }}
                        >
                            <ChatCenteredText size={isMobile ? 20 : 24} weight="bold" /> INQUIRE & MESSAGE
                        </button>
                    </div>
                </div>

                {/* Right: Product Info */}
                <div>
                    <div style={{ marginBottom: 8 }}>
                        <Badge text={product.seller} type="gold" />
                    </div>
                    <h1 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: COLORS.text, marginBottom: 12, lineHeight: 1.2 }}>
                        {product.name}
                    </h1>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: isMobile ? 16 : 24 }}>
                        <div style={{ background: COLORS.success, color: "#fff", padding: "4px 8px", borderRadius: 6, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            {avg} <Star size={14} weight="fill" />
                        </div>
                        <span style={{ color: COLORS.textDim, fontSize: 13 }}>{count.toLocaleString()} Ratings & Reviews</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: isMobile ? 24 : 32 }}>
                        <span style={{ fontSize: isMobile ? 32 : 48, fontWeight: 800, color: COLORS.goldLight }}>₹{product.price.toLocaleString()}</span>
                        <span style={{ fontSize: 14, color: COLORS.textMuted }}>{product.unit}</span>
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: isMobile ? 24 : 32, marginBottom: 32 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>Description</h3>
                        <p style={{ color: COLORS.textMuted, fontSize: 15, lineHeight: 1.7 }}>
                            {product.description}
                        </p>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24, marginBottom: 32 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                            <Storefront size={20} color={COLORS.gold} /> Seller Information
                        </h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontWeight: 700, color: COLORS.goldLight }}>{product.seller}</div>
                                <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>{product.location}</div>
                            </div>
                            <button
                                onClick={() => product.sellerId && onViewSeller?.(product.sellerId)}
                                style={{ background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                View Store
                            </button>
                        </div>
                    </div>

                    {/* Tap the stars to rate (once per device). */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                            {myRating ? "Your Rating (tap a star to change)" : "Rate this product"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {[1, 2, 3, 4, 5].map((s) => {
                                const active = (hoverStar || myRating) >= s;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => handleRate(s)}
                                        onMouseEnter={() => setHoverStar(s)}
                                        onMouseLeave={() => setHoverStar(0)}
                                        title={`Rate ${s} star${s === 1 ? "" : "s"}`}
                                        style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer" }}
                                    >
                                        <Star size={28} weight={active ? "fill" : "regular"} color={active ? COLORS.gold : COLORS.textDim} />
                                    </button>
                                );
                            })}
                            {myRating ? (
                                <>
                                    <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 8 }}>You rated this {myRating}/5 ✓</span>
                                    <button
                                        onClick={handleRemoveRating}
                                        title="Remove your rating"
                                        style={{ background: "none", border: "none", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: 4, textDecoration: "underline", padding: 0 }}
                                    >
                                        Remove
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {product.type === "rent" && (
                        <div style={{ margin: "32px 0", background: COLORS.accentDim, border: `1px solid ${COLORS.accent}`, borderRadius: 16, padding: "20px", display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                                <Phone size={20} weight="bold" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Verify Availability (Amanah)</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{product.sellerPhone}</div>
                            </div>
                        </div>
                    )}

                    {product.type === "rent" && (
                        <div style={{ marginTop: 40 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                <MapPin size={20} color={COLORS.gold} /> Pickup Location
                            </h3>
                            <MapPlaceholder location={product.location} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}