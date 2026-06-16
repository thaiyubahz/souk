import { Storefront, MapPin } from "@phosphor-icons/react";
import { COLORS } from "./Theme";

export function MapPlaceholder({ location }: { location: string }) {
    return (
        <div style={{ width: "100%", height: 300, background: "#1a2233", borderRadius: 20, border: `1px solid ${COLORS.border}`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${COLORS.border} 1px, transparent 1px)`, backgroundSize: "20px 20px", opacity: 0.3 }} />
            <div style={{ position: "absolute", width: "150%", height: "150%", border: `1px solid ${COLORS.border}`, borderRadius: "50%", opacity: 0.1 }} />
            <div style={{ position: "relative", textAlign: "center", zIndex: 1 }}>
                <div style={{
                    background: COLORS.gold, width: 48, height: 48, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", margin: "0 auto 16px",
                    display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${COLORS.goldDim}`
                }}>
                    <MapPin size={24} weight="bold" color="#000" style={{ transform: "rotate(45deg)" }} />
                </div>
                <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>{location}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>Verified Rental Zone</div>
            </div>
        </div>
    );
}

export function Footer() {
    return (
        <footer style={{ borderTop: `1px solid ${COLORS.border}`, padding: "48px 24px 64px", textAlign: "center", color: COLORS.textDim }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.gold, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Storefront size={20} /> Souk
            </div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}> Barakah-Driven Marketplace · {new Date().getFullYear()}</div>
        </footer>
    );
}