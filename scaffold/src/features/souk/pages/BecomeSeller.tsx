import { useState, useEffect } from "react";
import {
    Buildings,
    CaretRight,
    X,
    ShieldCheck,
    Archive, HandPointing, HandCoins, Check, Image as ImageIcon
} from "@phosphor-icons/react";
import { isFirebaseConfigured } from "@/config/firebase.config";
import { SoukService } from "../services/soukService";
import { COLORS } from "../components/SoukCommon";

interface FormData {
    fullName: string;
    // Seller Details
    shopName: string;
    contactPhone: string;
    shopAddress: string;
    // Product Details
    productName: string;
    productDescription: string;
    productCategory: string;
    productPrice: string;
    mode: "sale" | "rent";
}

export default function BecomeSeller({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
    const [step, setStep] = useState(0);
    const [productFile, setProductFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => { if (typeof window !== 'undefined') setIsMobile(window.innerWidth <= 768); };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [form, setForm] = useState<FormData>({
        fullName: "",
        shopName: "",
        contactPhone: "",
        shopAddress: "",
        productName: "",
        productDescription: "",
        productCategory: "products",
        productPrice: "",
        mode: "sale",
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const inputStyle = {
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: isMobile ? "12px" : "14px 16px",
        color: COLORS.text,
        fontSize: 14,
        outline: "none",
        width: "100%",
        transition: "border-color 0.2s"
    };

    const labelStyle = {
        fontSize: 11,
        color: COLORS.textDim,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        fontWeight: 700,
        marginBottom: 8,
        display: "block"
    };

    const buttonStyle = {
        flex: 1,
        background: COLORS.gold,
        color: "#101a2a",
        border: "none",
        borderRadius: 12,
        padding: "16px",
        fontSize: 14,
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "opacity 0.2s"
    };

    return (
        <div style={{ maxWidth: 540, margin: "0 auto", padding: isMobile ? "20px 16px" : "40px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 24 : 40 }}>
                <div>
                    <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: COLORS.text }}>Join the Barakah Marketplace</h2>
                    <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>Register your shop with Amanah (Trust) and start selling ethically</p>
                </div>
                <button onClick={onCancel} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer" }}>
                    <X size={isMobile ? 20 : 24} />
                </button>
            </div>

            {/* Progress Bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: isMobile ? 32 : 48 }}>
                {[0, 1, 2].map(s => (
                    <div key={s} style={{
                        flex: 1,
                        height: isMobile ? 3 : 4,
                        borderRadius: 2,
                        background: step >= s ? COLORS.gold : COLORS.border,
                        transition: "background 0.3s ease"
                    }} />
                ))}
            </div>

            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: isMobile ? 20 : 24, padding: isMobile ? 20 : 32, position: "relative", overflow: "hidden" }}>
                {step === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isMobile ? 4 : 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.goldDim, color: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ShieldCheck size={24} weight="duotone" />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Step 1: Your Name</div>
                        </div>

                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input
                                style={inputStyle}
                                placeholder="Ex: Rania Ahmed"
                                value={form.fullName}
                                onChange={e => setForm({ ...form, fullName: e.target.value })}
                            />
                        </div>

                        <button style={buttonStyle} onClick={nextStep} disabled={!form.fullName}>
                            Continue <CaretRight size={18} weight="bold" />
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isMobile ? 4 : 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.goldDim, color: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Buildings size={24} weight="duotone" />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Step 2: Shop Information</div>
                        </div>

                        <div>
                            <label style={labelStyle}>Shop / Brand Name</label>
                            <input
                                style={inputStyle}
                                placeholder="Ex: Ammi's Kitchen"
                                value={form.shopName}
                                onChange={e => setForm({ ...form, shopName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Contact Phone Number</label>
                            <input
                                style={inputStyle}
                                placeholder="+91 98765 43210"
                                value={form.contactPhone}
                                onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Pickup Address</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: 100, resize: "none" }}
                                placeholder="Enter full address for logistics"
                                value={form.shopAddress}
                                onChange={e => setForm({ ...form, shopAddress: e.target.value })}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button style={{ ...buttonStyle, background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }} onClick={prevStep}>
                                Back
                            </button>
                            <button style={buttonStyle} onClick={nextStep} disabled={!form.shopName || !form.contactPhone}>
                                Continue <CaretRight size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isMobile ? 4 : 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.goldDim, color: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Archive size={24} weight="duotone" />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Step 3: First Listing</div>
                        </div>

                        <div>
                            <label style={labelStyle}>Product Name</label>
                            <input
                                style={inputStyle}
                                placeholder="Ex: Organic Honey"
                                value={form.productName}
                                onChange={e => setForm({ ...form, productName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: 100, resize: "none" }}
                                placeholder="Describe your product — what it is, condition, what makes it special"
                                value={form.productDescription}
                                onChange={e => setForm({ ...form, productDescription: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Product Photo</label>
                            <div
                                onClick={() => document.getElementById('product-upload')?.click()}
                                style={{ padding: "20px", border: `2px dashed ${productFile ? COLORS.gold : COLORS.border}`, borderRadius: 16, textAlign: "center", background: productFile ? COLORS.goldDim : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "all 0.2s" }}
                            >
                                <input
                                    id="product-upload"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file && file.size <= 5 * 1024 * 1024) setProductFile(file);
                                        else if (file) alert("Image must be under 5MB");
                                    }}
                                />
                                <ImageIcon size={32} color={COLORS.gold} style={{ marginBottom: 12 }} />
                                {productFile ? (
                                    <>
                                        <div style={{ fontSize: 13, color: COLORS.gold, fontWeight: 600 }}>{productFile.name}</div>
                                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Click to change photo</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>Upload Product Image</div>
                                        <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>PNG, JPG or WEBP (Max 5MB)</div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: isMobile ? 12 : 16, flexDirection: isMobile ? "column" : "row" }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Category</label>
                                <select
                                    style={{ ...inputStyle, appearance: "none" }}
                                    value={form.productCategory}
                                    onChange={e => setForm({ ...form, productCategory: e.target.value })}
                                >
                                    <option value="products">Products</option>
                                    <option value="services">Services</option>
                                    <option value="freelancers">Freelancers</option>
                                    <option value="jobs">Jobs</option>
                                    <option value="rentals">Rentals</option>
                                    <option value="giveaways">Giveaways</option>
                                    <option value="islamic">Islamic</option>
                                    <option value="local">Local</option>
                                    <option value="digital">Digital</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Base Price (₹)</label>
                                <input
                                    style={inputStyle}
                                    placeholder="0.00"
                                    value={form.productPrice}
                                    onChange={e => setForm({ ...form, productPrice: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Listing Mode</label>
                            <div style={{ display: "flex", gap: 12 }}>
                                {[
                                    { id: "sale", label: "Sell Permanently", icon: HandCoins, desc: "Direct sale of goods" },
                                    { id: "rent", label: "Rent Out", icon: HandPointing, desc: "Lease for a period" }
                                ].map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setForm({ ...form, mode: m.id as "sale" | "rent" })}
                                        style={{
                                            flex: 1,
                                            padding: isMobile ? "12px" : "16px",
                                            borderRadius: 16,
                                            border: `1px solid ${form.mode === m.id ? COLORS.gold : COLORS.border}`,
                                            background: form.mode === m.id ? COLORS.goldDim : "rgba(255,255,255,0.01)",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <m.icon size={24} color={form.mode === m.id ? COLORS.gold : COLORS.textDim} style={{ marginBottom: 8 }} />
                                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{m.label}</div>
                                        <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{m.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button style={{ ...buttonStyle, background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }} onClick={prevStep}>
                                Back
                            </button>
                            <button
                                style={{
                                    ...buttonStyle,
                                    opacity: (!form.productName || !form.productPrice || submitting) ? 0.5 : 1,
                                    cursor: (!form.productName || !form.productPrice || submitting) ? "not-allowed" : "pointer"
                                }}
                                onClick={async () => {
                                    if (!isFirebaseConfigured) {
                                        alert("Firebase is not configured. Please check your .env file.");
                                        return;
                                    }
                                    const parsedPrice = parseFloat(form.productPrice);
                                    if (isNaN(parsedPrice)) {
                                        alert("Please enter a valid numeric price.");
                                        return;
                                    }
                                    setSubmitting(true);
                                    try {
                                        await SoukService.establishShop(form, productFile);
                                        setTimeout(() => {
                                            setSubmitting(false);
                                            onComplete();
                                        }, 1000);
                                    } catch (error) {
                                        console.error("Error creating shop:", error);
                                        alert(error instanceof Error ? error.message : "Failed to establish shop.");
                                        setSubmitting(false);
                                    }
                                }}
                                disabled={!form.productName || !form.productPrice || submitting}
                            >
                                {submitting ? "Submitting..." : "Establish Ethical Shop"} {!submitting && <Check size={18} weight="bold" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
