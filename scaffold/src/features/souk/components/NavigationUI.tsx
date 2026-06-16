import { Storefront, MapPin, NavigationArrow, MagnifyingGlass, ChatCenteredText, Heart, User, House } from "@phosphor-icons/react";
import { COLORS } from "./Theme"; // Ensure COLORS is imported

export function Navbar({ isMobile, userCity, setUserCity, setNearMeOnly, search, setSearch, setPage, showLocationList, setShowLocationList, detectLocation, likedIds }: any) {
    return (
        <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(12,15,21,0.8)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", height: isMobile ? 56 : 64, display: "flex", alignItems: "center", gap: 16, justifyContent: isMobile ? "center" : "flex-start" }}>
            <div onClick={() => setPage("home")} style={{ fontWeight: 800, fontSize: 20, color: COLORS.gold, cursor: "pointer", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
                <Storefront size={24} weight="duotone" /> Souk
            </div>

            {!isMobile && (
                <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "6px 12px", cursor: "pointer" }} onClick={() => setShowLocationList(!showLocationList)}>
                        <MapPin size={16} color={userCity ? COLORS.gold : COLORS.textDim} weight={userCity ? "fill" : "regular"} />
                        <span style={{ fontSize: 12, color: userCity ? COLORS.gold : COLORS.text, fontWeight: 600 }}>{userCity || "Global Market"}</span>
                    </div>
                    {showLocationList && (
                        <div style={{ position: "absolute", top: "110%", left: 0, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 8, width: 200, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 1000 }}>
                            <div onClick={detectLocation} style={{ padding: "10px", color: COLORS.gold, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 4 }}>
                                <NavigationArrow size={14} weight="fill" /> Near Me (Use GPS)
                            </div>
                            {["Chennai", "Bangalore", "Kashmir", "Madinah"].map(city => (
                                <div key={city} onClick={() => { setUserCity(city); setNearMeOnly(true); setShowLocationList(false); }}
                                    style={{ padding: "8px 10px", color: COLORS.text, fontSize: 13, cursor: "pointer", borderRadius: 6 }}>
                                    {city}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!isMobile && (
                <div style={{ flex: 1, position: "relative", maxWidth: 400 }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.textDim, display: "flex" }}>
                        <MagnifyingGlass size={16} />
                    </span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search community connections..."
                        style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "10px 16px 10px 42px", color: COLORS.text, fontSize: 13, outline: "none" }}
                    />
                </div>
            )}

            <div style={{ marginLeft: "auto", display: isMobile ? "none" : "flex", gap: 12, alignItems: "center" }}>
                <button onClick={() => setPage("messages")} style={{ background: COLORS.bgGlass, border: `1px solid ${COLORS.border}`, color: COLORS.gold, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <ChatCenteredText size={20} />
                </button>
                <button onClick={() => setPage("saved")} style={{ position: "relative", background: COLORS.bgGlass, border: `1px solid ${COLORS.border}`, color: COLORS.gold, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Heart size={20} weight={likedIds?.size > 0 ? "fill" : "regular"} />
                    {likedIds?.size > 0 && (
                        <span style={{ position: "absolute", top: -4, right: -4, background: COLORS.accent, color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>
                            {likedIds.size}
                        </span>
                    )}
                </button>
                <button onClick={() => setPage("account")} style={{ background: COLORS.bgGlass, border: `1px solid ${COLORS.border}`, color: COLORS.gold, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <User size={20} />
                </button>
            </div>
        </nav>
    );
}

export function BottomNav({ page, setPage, likedCount }: { page: string, setPage: (p: string) => void, likedCount: number }) {
    const navItems = [
        { id: "home", icon: House, label: "Home" },
        { id: "saved", icon: Heart, label: "Saved", count: likedCount },
        { id: "messages", icon: ChatCenteredText, label: "Messages" },
        { id: "account", icon: User, label: "Profile" },
    ];

    return (
        <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: "rgba(16, 26, 42, 0.98)", backdropFilter: "blur(20px)",
            borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 1000,
            paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,0.4)"
        }}>
            {navItems.map(item => {
                const Icon = item.icon;
                const isActive = page === item.id || (item.id === 'home' && page === 'product-detail');
                return (
                    <button key={item.id} onClick={() => { setPage(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{ background: "none", border: "none", color: isActive ? COLORS.gold : COLORS.textDim, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", flex: 1, transition: "transform 0.2s ease, color 0.2s ease", transform: isActive ? "scale(1.1)" : "scale(1)", height: "100%" }}>
                        <Icon size={24} weight={isActive ? "fill" : "regular"} />
                        {item.count !== undefined && item.count > 0 && <span style={{ position: "absolute", top: 12, right: "25%", background: COLORS.accent, color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${COLORS.bgCard}` }}>{item.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}