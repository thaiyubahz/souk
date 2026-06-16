import { Star } from "@phosphor-icons/react";
import { COLORS } from "./Theme"; // Ensure COLORS is imported

interface BadgeProps {
    text: string;
    type?: "gold" | "green" | "pink" | "purple";
}

export function Badge({ text, type = "gold" }: BadgeProps) {
    const colors = {
        gold: { bg: "rgba(212,168,83,0.12)", color: "#D4A853", border: "rgba(212,168,83,0.25)" },
        green: { bg: "rgba(123,158,137,0.12)", color: "#7BB39A", border: "rgba(123,158,137,0.25)" },
        pink: { bg: "rgba(168,85,247,0.12)", color: "#A855F7", border: "rgba(168,85,247,0.25)" },
        purple: { bg: "rgba(124,109,240,0.12)", color: "#7c6df0", border: "rgba(124,109,240,0.3)" },
    };
    const c = (type && colors[type]) || colors.gold;
    return (
        <span style={{
            background: c.bg,
            color: c.color,
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
        }}>
            {text}
        </span>
    );
}

export function StarRating({ rating }: { rating: number }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={12} weight={i <= Math.floor(rating) ? "fill" : "regular"} color={i <= Math.floor(rating) ? COLORS.gold : COLORS.textDim} />
            ))}
            <span style={{ color: COLORS.textMuted, marginLeft: 4, fontSize: 11 }}>{rating}</span>
        </div>
    );
}