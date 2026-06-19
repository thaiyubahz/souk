import { Storefront, MapPin, NavigationArrow, MagnifyingGlass, ChatCenteredText, Heart, User, House, Plus, List, Users, Coins } from "@phosphor-icons/react";
import { COLORS } from "./Theme"; 
import { getDeviceId } from "../services/identity";

export function Navbar({ isMobile, setPage, showToast, toggleSidebar, user }: any) {
    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, height: 60, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: isMobile ? "0 18px" : "0 26px",
            backdropFilter: "blur(14px)",
            background: "linear-gradient(to bottom, rgba(6, 8, 13, 0.85), transparent)",
            borderBottom: "1px solid rgba(245, 232, 199, 0.05)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                    onClick={toggleSidebar}
                    style={{
                        width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#C9C0A8", border: "1px solid rgba(245, 232, 199, 0.1)",
                        background: "rgba(245, 232, 199, 0.02)", cursor: "pointer"
                    }}
                >
                    <List size={18} weight="bold" />
                </button>
                <div
                    onClick={() => setPage("home")}
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 25, fontWeight: 500, color: "#F5E8C7", cursor: "pointer", letterSpacing: "0.3px" }}
                >
                    Zaryah<b style={{ color: COLORS.gold, fontWeight: 600 }}>+</b>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {!isMobile && (
                    <span style={{
                        display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#C9C0A8",
                        padding: "7px 12px", border: "1px solid rgba(245, 232, 199, 0.1)",
                        borderRadius: 100, background: "rgba(245, 232, 199, 0.02)", letterSpacing: "0.4px"
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2A9D6F", boxShadow: "0 0 8px #2A9D6F" }} />
                        Raya is awake
                    </span>
                )}
                
                <button
                    onClick={() => setPage("messages")}
                    style={{
                        width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#C9C0A8", border: "1px solid rgba(245, 232, 199, 0.1)",
                        background: "rgba(245, 232, 199, 0.02)", cursor: "pointer"
                    }}
                >
                    <Users size={20} />
                </button>

                <div
                    onClick={() => setPage("account")}
                    style={{
                        width: 38, height: 38, borderRadius: "50%", overflow: "hidden",
                        border: "1px solid rgba(212, 168, 83, 0.3)", cursor: "pointer",
                        background: "linear-gradient(135deg, #D4A853, #162235)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                >
                    <User size={20} color="#fff" />
                </div>
            </div>
        </nav>
    );
}

export function SoukSubHeader({ isMobile, userCity, setUserCity, setNearMeOnly, search, setSearch, showLocationList, setShowLocationList, detectLocation, setPage }: any) {
    return (
        <div style={{ padding: isMobile ? "80px 20px 20px" : "110px 48px 20px" }}>
            <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: 24,
                width: "100%",
                maxWidth: 1400,
                margin: "0 auto"
            }}>
                <div style={{ flexShrink: 0 }}>
                    <h1 style={{ 
                        fontSize: isMobile ? 28 : 42, 
                        fontWeight: 700, 
                        margin: 0, 
                        fontFamily: "'Cormorant Garamond', serif", 
                        letterSpacing: "1px",
                        background: "linear-gradient(135deg, #D4A853 0%, #F5E8C7 50%, #D4A853 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 2px 15px rgba(212,168,83,0.2)"
                    }}>Online Souk</h1>
                </div>

                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    flex: 1,
                    maxWidth: 1000,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(212, 168, 83, 0.2)`,
                    borderRadius: 16,
                    padding: "4px",
                    position: "relative",
                    backdropFilter: "blur(10px)"
                }}>
                    <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                        <span style={{ marginLeft: 16, color: "#8A8270", display: "flex" }}>
                            <MagnifyingGlass size={20} />
                        </span>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search marketplace..."
                            style={{
                                width: "100%", background: "transparent", border: "none",
                                padding: "14px 16px", color: "#F5E8C7", fontSize: 16, outline: "none"
                            }}
                        />
                    </div>
                    
                    <div style={{ height: 32, width: 1, background: "rgba(212, 168, 83, 0.2)", margin: "0 8px" }} />

                    <div style={{ position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", cursor: "pointer", borderRadius: 12, transition: "background 0.2s" }} onClick={() => setShowLocationList(!showLocationList)}>
                            <MapPin size={20} color={userCity ? COLORS.gold : "#8A8270"} weight={userCity ? "fill" : "regular"} />
                            <span style={{ fontSize: 14, color: userCity ? COLORS.gold : "#F5E8C7", fontWeight: 700, whiteSpace: "nowrap" }}>{userCity || "Location"}</span>
                        </div>
                        {showLocationList && (
                            <div style={{ position: "absolute", top: "130%", right: 0, background: "#111", border: `1px solid rgba(212,168,83,0.3)`, borderRadius: 12, padding: 8, width: 220, boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 1100 }}>
                                <div onClick={detectLocation} style={{ padding: "12px", color: COLORS.gold, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid rgba(212,168,83,0.1)`, marginBottom: 4 }}>
                                    <Plus size={14} weight="bold" /> Near Me
                                </div>
                                {["Chennai", "Bangalore", "Kashmir", "Madinah"].map(city => (
                                    <div key={city} onClick={() => { setUserCity(city); setNearMeOnly(true); setShowLocationList(false); }}
                                        style={{ padding: "10px 12px", color: COLORS.text, fontSize: 13, cursor: "pointer", borderRadius: 8 }}>
                                        {city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button 
                  onClick={() => setPage("become-seller")}
                  style={{
                    background: "linear-gradient(135deg, #D4A853 0%, #B8860B 100%)",
                    color: "#101a2a",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px 28px",
                    fontWeight: 900,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(212,168,83,0.25)",
                    marginLeft: isMobile ? 0 : "auto"
                  }}>
                    <Plus size={20} weight="bold" /> Sell
                </button>
            </div>
        </div>
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