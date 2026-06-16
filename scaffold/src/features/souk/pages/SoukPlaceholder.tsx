import { useEffect, useState } from "react";
import {
  Storefront, User, MagnifyingGlass, MapPin, Check, Heart, CaretRight, Sparkle, Dress, Monitor, Key, Palette, NavigationArrow, Buildings, Car, BookOpen, Users, Couch, FirstAid, Briefcase, ChatCenteredText, ShieldCheck, PaperPlaneTilt, Envelope, Lock, House
} from "@phosphor-icons/react";
import BecomeSeller from "./BecomeSeller";
import { COLORS, type Product, ProductCard, ProductDetail, Navbar, BottomNav, Footer } from "../components/SoukCommon";
import { auth, db, isFirebaseConfigured } from "@/config/firebase.config";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { collection, query, onSnapshot, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { SoukService } from "../services/soukService";

const CATEGORIES = [
  { id: "all", label: "All", icon: Storefront },
  { id: "clothes", label: "Modest Wear", icon: Dress },
  { id: "electronics", label: "Ethical Tech", icon: Monitor },
  { id: "rent", label: "Amanah Rentals", icon: Key },
  { id: "handmade", label: "Artisan Crafts", icon: Palette },
  { id: "property", label: "Halal Property", icon: Buildings },
  { id: "vehicles", label: "Ethical Rides", icon: Car },
  { id: "books", label: "Islamic Books", icon: BookOpen },
  { id: "community", label: "Meeting Areas", icon: Users },
  { id: "furniture", label: "Modest Home", icon: Couch },
  { id: "health", label: "Wellness & Tibb", icon: FirstAid },
  { id: "services", label: "Community Services", icon: Briefcase },
];

const TESTIMONIALS = [
  { name: "Rania Ahmed", city: "Chennai", text: "Found local homemade meals easily. The quality is exceptional.", avatar: "R" },
  { name: "Karthik S", city: "Bangalore", text: "Professional rental service. Smooth process from start to finish.", avatar: "K" },
  { name: "Fatima Noor", city: "Chennai", text: "Helping my small business reach more customers every day.", avatar: "F" },
];

function Hero({ isMobile, search, setSearch }: { isMobile: boolean, search: string, setSearch: (s: string) => void }) {
  return (
    <div style={{ padding: "64px 24px 48px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
      {isMobile && (
        <div style={{ position: "relative", marginBottom: 32 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.textDim, display: "flex" }}>
            <MagnifyingGlass size={16} />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search community..."
            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 16px 12px 42px", color: COLORS.text, fontSize: 13 }}
          />
        </div>
      )}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: COLORS.goldDim, border: `1px solid ${COLORS.border}`, borderRadius: 100, padding: "6px 16px", fontSize: 10, color: COLORS.gold, marginBottom: 24, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Ethical & Halal Commerce
      </div>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-1px", color: COLORS.text }}>
        Empowering community with <span style={{ color: COLORS.gold }}>Barakah.</span>
      </h1>
      <p style={{ color: COLORS.textMuted, fontSize: 15, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 40px" }}>
        Discover Halal dining, Modest fashion, and Ethical rentals from your trusted neighbours.
      </p>
    </div>
  );
}

function CategoryBar({ activeCategory, setActiveCategory }: any) {
  return (
    <div style={{ padding: "0 24px 32px", display: "flex", gap: 10, overflowX: "auto", maxWidth: 1100, margin: "0 auto", scrollbarWidth: "none" }}>
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        return (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            style={{
              flexShrink: 0,
              background: activeCategory === cat.id ? COLORS.gold : "transparent",
              color: activeCategory === cat.id ? "#000" : COLORS.textMuted,
              border: `1px solid ${activeCategory === cat.id ? COLORS.gold : COLORS.border}`,
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
            <Icon size={16} weight={activeCategory === cat.id ? "bold" : "regular"} /> {cat.label}
          </button>
        );
      })}
    </div>
  );
}

function ProductGrid({ filtered, setSelectedProduct, setPage, toggleLike, likedIds, setSearch, setActiveCategory }: any) {
  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.textMuted }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ marginTop: 12 }}>No products found</div>
        <button onClick={() => { setSearch(""); setActiveCategory("all"); }} style={{ marginTop: 12, background: COLORS.goldDim, color: COLORS.gold, border: `0.5px solid ${COLORS.gold}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Clear filters</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {filtered.map((p: Product) => (
          <ProductCard
            key={p.id}
            product={p}
            onView={(p) => { setSelectedProduct(p); setPage("product-detail"); window.scrollTo(0, 0); }}
            onLike={toggleLike}
            isLiked={likedIds.has(p.id.toString())}
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <div style={{ background: COLORS.bgCard, borderTop: `0.5px solid ${COLORS.border}`, borderBottom: `0.5px solid ${COLORS.border}`, padding: "48px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: COLORS.gold, letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Tayyib Experiences</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Amanah & Community Trust</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: COLORS.bgGlass, border: `0.5px solid ${COLORS.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ color: COLORS.gold, fontSize: 14, marginBottom: 10 }}>★★★★★</div>
              <div style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>"{t.text}"</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#000" }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>📍 {t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SavedView({ likedIds, allProducts, toggleLike, setSelectedProduct, setPage }: any) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Your Saved Finds</h2>
      {likedIds.size === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: COLORS.textDim }}>
          <Heart size={48} weight="thin" style={{ marginBottom: 16 }} />
          <div>No products saved yet. Explore the market to find treasures.</div>
          <button onClick={() => setPage("home")} style={{ marginTop: 16, background: COLORS.gold, color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Back to Home</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {allProducts.filter((p: Product) => likedIds.has(p.id.toString())).map((p: Product) => (
            <ProductCard
              key={p.id}
              product={p}
              onLike={toggleLike}
              isLiked={true}
              onView={(p) => { setSelectedProduct(p); setPage("product-detail"); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesView({ user, selectedChatId, setSelectedChatId, isMobile }: { user: any, selectedChatId: string | null, setSelectedChatId: (id: string | null) => void, isMobile: boolean }) {
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!user) return;
    return SoukService.subscribeToChats(user.uid, setChats);
  }, [user, setChats]);

  useEffect(() => {
    if (!selectedChatId) return;
    return SoukService.subscribeToMessages(selectedChatId, setMessages);
  }, [selectedChatId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedChatId || !user) return;
    const text = inputText;
    setInputText("");
    try {
      await SoukService.sendMessage(selectedChatId, user.uid, text);
    } catch (e) { console.error(e); }
  };

  if (!user) return <div style={{ textAlign: "center", padding: "64px 24px", color: COLORS.textMuted }}>Please sign in to view messages.</div>;

  const selectedChat = chats.find(c => c.id === selectedChatId);
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", height: "calc(100vh - 160px)", display: "flex", gap: 24 }}>
      <div style={{ width: selectedChatId ? "320px" : "100%", borderRight: selectedChatId ? `1px solid ${COLORS.border}` : "none", display: selectedChatId && isMobile ? "none" : "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Messages</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {chats.length === 0 ? (
            <div style={{ color: COLORS.textDim, textAlign: "center", padding: 40 }}>No conversations yet.</div>
          ) : (
            chats.map(chat => (
              <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} style={{ padding: 16, borderRadius: 16, background: selectedChatId === chat.id ? COLORS.goldDim : COLORS.bgCard, border: `1px solid ${selectedChatId === chat.id ? COLORS.gold : COLORS.border}`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontWeight: 700, color: COLORS.text }}>{user.uid === chat.participants?.[0] ? chat.sellerName : chat.userName}</div>
                <div style={{ fontSize: 11, color: COLORS.gold, marginTop: 2 }}>{chat.productName}</div>
                {chat.lastMessage && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.lastMessage}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedChatId && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: COLORS.bgCard, borderRadius: 24, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSelectedChatId(null)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", display: isMobile ? "block" : "none" }}>Back</button>
            <div>
              <div style={{ fontWeight: 700, color: COLORS.text }}>{user.uid === selectedChat?.participants?.[0] ? selectedChat?.sellerName : selectedChat?.userName}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>{selectedChat?.productName}</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.senderId === user.uid ? "flex-end" : "flex-start", maxWidth: "80%", padding: "12px 16px", borderRadius: 20, borderBottomRightRadius: m.senderId === user.uid ? 4 : 20, borderBottomLeftRadius: m.senderId === user.uid ? 20 : 4, background: m.senderId === user.uid ? COLORS.gold : "rgba(255,255,255,0.05)", color: m.senderId === user.uid ? "#101a2a" : COLORS.text, fontSize: 14, fontWeight: 500 }}>
                {m.text}
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 12 }}>
            <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Write your message..." style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 16px", color: COLORS.text, outline: "none", fontSize: 14 }} />
            <button onClick={sendMessage} style={{ background: COLORS.gold, border: "none", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#101a2a" }}>
              <PaperPlaneTilt size={24} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {!selectedChatId && !isMobile && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: COLORS.textDim, gap: 16 }}>
          <ChatCenteredText size={64} weight="thin" />
          <div style={{ fontSize: 15 }}>Select a conversation to start chatting</div>
        </div>
      )}
    </div>
  );
}

function AccountView({ user, kycStatus, setPage, showToast }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAuth = async () => {
    if (!isFirebaseConfigured) {
      setLoginError("Firebase SDK not configured in .env");
      return;
    }
    if (!email || !password) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        showToast("Account created! Please verify your email.");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          showToast("Please verify your email to access all features.");
        } else {
          showToast("Signed in successfully!");
        }
      }
    } catch (err: any) {
      setLoginError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px" }}>
      <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: 11, marginBottom: 32, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
        Home
      </button>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #D4A853, #162235)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.text }}>
          <User size={40} weight="thin" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.text }}>{user ? (user.displayName || user.email || "Souk Member") : "Guest"}</h2>
        {user && (
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
            background: kycStatus?.status === "approved" ? "rgba(123,158,137,0.12)" : "rgba(255,255,255,0.03)", color: kycStatus?.status === "approved" ? COLORS.success : COLORS.textDim, border: `1px solid ${COLORS.border}`
          }}>
            <Check size={12} weight="bold" /> {kycStatus?.status === "approved" ? "Amanah Verified" : "Guest"}
          </div>
        )}
      </div>

      <div onClick={() => setPage("become-seller")} style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.gold}`, borderRadius: 16, padding: "20px", marginBottom: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Storefront size={24} color={COLORS.gold} weight="duotone" />
          <div style={{ fontSize: 14, fontWeight: 800 }}>Become a Seller</div>
        </div>
        <CaretRight size={16} color={COLORS.gold} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { icon: ChatCenteredText, title: "Connect", desc: "Recent inquiries", action: () => setPage("messages") },
          { icon: Sparkle, title: "Saved Finds", desc: "Your curated list", action: () => setPage("saved") },
        ].map((item) => (
          <div key={item.title} onClick={item.action} style={{ display: "flex", gap: 16, padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.01)", border: `1px solid ${COLORS.border}`, cursor: "pointer", alignItems: "center" }}>
            <item.icon size={24} weight="thin" color={COLORS.gold} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <div style={{ color: COLORS.textDim, fontSize: 11 }}>{item.desc}</div>
            </div>
            <CaretRight size={16} color={COLORS.textDim} />
          </div>
        ))}
      </div>

      {user ? (
        <button onClick={() => auth.signOut()} style={{ marginTop: 32, width: "100%", background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 12, padding: "16px", fontSize: 13, fontWeight: 700 }}>
          Sign out
        </button>
      ) : (
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Envelope size={20} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.textDim }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "14px 16px 14px 44px", color: COLORS.text, fontSize: 14, outline: "none" }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={20} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.textDim }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "14px 16px 14px 44px", color: COLORS.text, fontSize: 14, outline: "none" }}
            />
          </div>
          {loginError && (
            <div style={{ color: "#ff4d4f", fontSize: 12, textAlign: "center", fontWeight: 600, background: "rgba(255,77,79,0.05)", padding: "8px", borderRadius: 8 }}>
              {loginError}
            </div>
          )}
          <button
            onClick={handleAuth}
            disabled={isLoggingIn || !email || !password}
            style={{
              width: "100%",
              background: COLORS.gold,
              color: "#101a2a",
              border: "none",
              borderRadius: 12,
              padding: "16px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              opacity: (isLoggingIn || !email || !password) ? 0.6 : 1
            }}
          >
            {isLoggingIn ? (isSignUp ? "Creating..." : "Signing in...") : (isSignUp ? "Join Souk Community" : "Sign in to Souk")}
          </button>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setLoginError(null); }}
            style={{ background: "none", border: "none", color: COLORS.gold, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function SoukMarketplace() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState("home"); // home | seller | account | product-detail | saved | messages
  const [userCity, setUserCity] = useState<string | null>(null);
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Default to false for safe initial render
  const [user, setUser] = useState<any>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const detectLocation = () => { // Implementation Note: In a production Firebase environment,
    // move the Geocoding logic to a Cloud Function to protect your API Key.
    // Then call it via: const getCity = httpsCallable(functions, 'getCityFromCoords');

    setShowLocationList(false);
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      return;
    }

    showToast("Detecting your location..."); // Show a toast message to the user
    navigator.geolocation?.getCurrentPosition( // Use optional chaining for navigator.geolocation
      async (position) => {
        const { latitude, longitude } = position.coords;

        // IMPORTANT: Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual API key.
        const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
          console.warn("Maps API Key missing in .env (VITE_GOOGLE_MAPS_API_KEY)");
          showToast("Maps API Key not configured.");
          return;
        }

        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
        try {
          const response = await fetch(geocodingUrl);
          const data = await response.json();

          if (data.status === "OK" && data.results.length > 0) {
            // Find the city component from the geocoding results
            const cityComponent = data.results[0]?.address_components?.find(
              (component: any) => component.types.includes("locality") || component.types.includes("administrative_area_level_2")
            );
            const detectedCity = cityComponent ? cityComponent.long_name : "Unknown City";

            setUserCity(detectedCity);
            setNearMeOnly(true); // Automatically filter by the detected city
            showToast(`Located in ${detectedCity}`);
          } else {
            showToast("Could not determine city from location.");
          }
        } catch (error) {
          console.error("Error during reverse geocoding:", error);
          showToast("Failed to get location details. Please try again.");
        }
      },
      () => {
        showToast("Location access denied or unavailable. Please select manually.");
      }
    );
  };

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth <= 768);
    };
    handleResize(); // Set correctly on mount
    window.addEventListener("resize", handleResize); // Add event listener for window resize

    let unsubKyc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (unsubKyc) unsubKyc();
      if (u) {
        unsubKyc = SoukService.subscribeToKycStatus(u.uid, setKycStatus);
      } else {
        setKycStatus(null);
      }
    });

    const unsubProducts = SoukService.subscribeToProducts((products) => {
      setDbProducts(products);
      setLoading(false);
    });

    return () => {
      unsubAuth(); unsubProducts(); if (unsubKyc) unsubKyc(); window.removeEventListener("resize", handleResize);
    };
  }, []);

  const allProducts = dbProducts;

  const toggleLike = (product: Product) => {
    const next = new Set(Array.from(likedIds));
    next.has(product.id.toString()) ? next.delete(product.id.toString()) : next.add(product.id.toString());
    setLikedIds(next);
    showToast(next.has(product.id.toString()) ? "Added to Saved Finds" : "Removed from Saved");
  };

  const filtered = allProducts // Use allProducts from Firebase, not the local PRODUCTS mock data
    .filter(p =>
      (activeCategory === "all" || p?.category === activeCategory) &&
      (search === "" || p?.name?.toLowerCase().includes(search.toLowerCase()) || (p?.seller && p?.seller?.toLowerCase().includes(search.toLowerCase()))) &&
      (!nearMeOnly || !userCity || p.location?.toLowerCase() === userCity.toLowerCase())
    )
    .sort((a, b) => {
      if (userCity && a?.location?.toLowerCase() === userCity.toLowerCase() && b?.location?.toLowerCase() !== userCity.toLowerCase()) return -1;
      if (userCity && b?.location?.toLowerCase() === userCity.toLowerCase() && a?.location?.toLowerCase() !== userCity.toLowerCase()) return 1;
      return 0;
    });

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif", color: COLORS.text }}>
      <style>
        {`
          @keyframes pageEnter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .page-transition-wrapper {
            animation: pageEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          body {
            padding-bottom: ${isMobile ? '64px' : '0'};
          }
        `}
      </style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 80 : 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a26", border: `0.5px solid ${COLORS.gold}`, color: COLORS.text, padding: "10px 20px", borderRadius: 100, fontSize: 13, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <Navbar {...{ isMobile, userCity, setUserCity, setNearMeOnly, search, setSearch, setPage, showLocationList, setShowLocationList, detectLocation, likedIds }} />

      <div key={page} className="page-transition-wrapper" style={{ paddingBottom: isMobile ? 80 : 0 }}>
        {page === "home" && (
          <>
            <Hero isMobile={isMobile} search={search} setSearch={setSearch} />
            <CategoryBar {...{ activeCategory, setActiveCategory }} />
            <ProductGrid {...{ filtered, setSelectedProduct, setPage, toggleLike, likedIds, setSearch, setActiveCategory }} />
            <TestimonialsSection />
          </>
        )}

        {page === "product-detail" && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setPage("home")}
            user={user}
            setPage={setPage}
            showToast={showToast}
            setSelectedChatId={setSelectedChatId}
            isMobile={isMobile}
          />
        )}

        {page === "become-seller" && (
          <BecomeSeller
            onComplete={() => {
              setPage("home");
              showToast("✓ Merchant shop created successfully!");
            }}
            onCancel={() => setPage("home")}
          />
        )}

        {page === "saved" && (
          <SavedView {...{ likedIds, allProducts, toggleLike, setSelectedProduct, setPage }} />
        )}

        {page === "messages" && (
          <MessagesView user={user} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} isMobile={isMobile} />
        )}

        {page === "seller-hub" && (
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
            <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: 11, marginBottom: 32, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              Home
            </button>
            {/* ... Rest of seller-hub content ... */}
          </div>
        )}

        {page === "account" && (
          <AccountView {...{ user, kycStatus, setPage, showToast }} />
        )}
      </div>

      {isMobile && (
        <BottomNav page={page} setPage={setPage} likedCount={likedIds.size} />
      )}

      <Footer />
    </div>
  );
}
// --- Router compatibility exports ---
export function SoukHomePage() { return <SoukMarketplace />; }
export function SoukCategoryPage() { return <SoukMarketplace />; }
export function SoukListingDetailPage() { return <SoukMarketplace />; }
export function SoukCreateListingPage() { return <SoukMarketplace />; }
export function SoukMyListingsPage() { return <SoukMarketplace />; }
export function SoukSellerProfilePage() { return <SoukMarketplace />; }
export function SoukSavedPage() { return <SoukMarketplace />; }
