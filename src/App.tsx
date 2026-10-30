import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import PolesScreen from "./PolesScreen";
import AdhesionScreen from "./components/AdhesionScreen";
import AdminLoginScreen, { ADMIN_TOKEN_KEY } from "./components/AdminLoginScreen";
import NewsArticle from "./components/NewsArticle";

const discoveredImageEntries = Object.entries(
  import.meta.glob("/src/assets/img/*.{jpg,jpeg,png,webp,avif,gif}", {
    eager: true,
    import: "default",
  })
) as [string, string][];

const discoveredImages = discoveredImageEntries.map(([, url]) => url);

const TOTAL_IMAGES = 10;
const FAN_OFFSETS = [
  { x: 0, y: 0, r: 0 },
  { x: 10, y: -4, r: 7 },
  { x: -10, y: -8, r: -9 },
  { x: 14, y: -14, r: 12 },
  { x: -14, y: -16, r: -13 },
  { x: 6, y: -22, r: 4 },
  { x: -6, y: -24, r: -5 },
  { x: 18, y: -26, r: 15 },
  { x: -18, y: -28, r: -15 },
  { x: 0, y: -32, r: 0 },
];

const FALLBACK_PRELOAD_IMAGES = [
  "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
] as const;

const PRELOAD_IMAGES = discoveredImages.length > 0 ? discoveredImages : [...FALLBACK_PRELOAD_IMAGES];

const SESSION_META = [
  { id: "comedie", number: "01/05", icon: "🎭", title: "Comédie", description: "Sketchs, humour et scènes comiques." },
  { id: "interpretation", number: "02/05", icon: "🎬", title: "Interprétation", description: "Jeu d'acteur, rôles et expression scénique." },
  { id: "chorégraphie", number: "03/05", icon: "💃", title: "Chorégraphie", description: "Danse, rythme et création de mouvements." },
  { id: "folklorique", number: "04/05", icon: "🌿", title: "Groupe folklorique", description: "Traditions, danses et expressions culturelles." },
  { id: "slam", number: "05/05", icon: "🎤", title: "Slam", description: "Voix, poésie et l’inspiration dans des performances expressives." },

];

const SESSION_STORAGE_KEY = "ucae-site-loading-done";

const FALLBACK_SESSION_IMAGES: Record<string, string[]> = {
  comedie: [
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  ],
  interpretation: [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80",
  ],
  folklorique: [
    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1501679681995-5d820148f0b2?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
  ],
  chorégraphie: [
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1549834146-1d9af392b7d8?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  ],
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function getGroupedImages() {
  const map = new Map<string, string[]>();

  for (const [path, url] of discoveredImageEntries) {
    const fileName = path.split("/").pop() ?? "";
    const withoutExtension = fileName.replace(/\.[^.]+$/, "");
    const key = withoutExtension.split("_").slice(0, -1).join("_") || withoutExtension;
    const normalizedKey = normalizeKey(key);
    const current = map.get(normalizedKey) ?? [];
    current.push(url);
    map.set(normalizedKey, current);
  }

  return map;
}

const sessionCards = SESSION_META.map((session) => {
  const map = getGroupedImages();
  const dynamic = map.get(normalizeKey(session.id)) ?? [];
  const images = dynamic.length > 0 ? dynamic : FALLBACK_SESSION_IMAGES[session.id] ?? [];

  return {
    ...session,
    image: images[0] ?? FALLBACK_PRELOAD_IMAGES[0],
    gallery: images.slice(0, 3),
  };
});

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const timers: number[] = [];

    for (let index = 0; index < TOTAL_IMAGES; index += 1) {
      const delay = 300 + index * (300 + Math.random() * 500);
      const timer = window.setTimeout(() => {
        setLoaded((current) => {
          const next = Math.min(current + 1, TOTAL_IMAGES);
          if (next === TOTAL_IMAGES) {
            window.setTimeout(() => onComplete(), 350);
          }
          return next;
        });
      }, delay);
      timers.push(timer);
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onComplete]);

  const percent = Math.round((loaded / TOTAL_IMAGES) * 100);

  return (
    <div className="loading-screen">
      <div className="loading-stage">
        <div className="loading-thumbs" aria-live="polite">
          {Array.from({ length: loaded }).map((_, index) => {
            const src = PRELOAD_IMAGES[index % PRELOAD_IMAGES.length];
            const offset = FAN_OFFSETS[index] ?? FAN_OFFSETS[FAN_OFFSETS.length - 1];

            return (
              <img
                key={`${src}-${index}`}
                className="loading-thumb loaded"
                src={src}
                alt=""
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.r}deg)`,
                  zIndex: index,
                }}
              />
            );
          })}
        </div>

        <div className="loading-line" />
        <div className="loading-percent">{percent}%</div>
      </div>

      <div className="loading-status">
        {loaded === TOTAL_IMAGES ? "Terminé — 10/10 images chargées" : "Chargement en cours…"}
      </div>
    </div>
  );
}

function AdhesionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="adhesion-modal-backdrop" onClick={onClose}>
      <div className="adhesion-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="adhesion-modal-close" onClick={onClose} aria-label="Fermer le formulaire">
          ×
        </button>
        <AdhesionScreen />
      </div>
    </div>
  );
}

function HomeScreen() {
  const [isAdhesionOpen, setIsAdhesionOpen] = useState(false);
  const heroImage = PRELOAD_IMAGES[0] ?? "";

  return (
    <div className="site-shell">
      <main
        className="home-hero"
        style={{
          backgroundImage: heroImage
            ? `linear-gradient(90deg, rgba(5, 10, 19, 0.82) 0%, rgba(5, 10, 19, 0.58) 38%, rgba(5, 10, 19, 0.4) 100%), url(${heroImage})`
            : "linear-gradient(90deg, rgba(5, 10, 19, 0.82) 0%, rgba(5, 10, 19, 0.58) 38%, rgba(5, 10, 19, 0.4) 100%)",
        }}
      >
        <header className="home-topbar">

          <div>
            <img className="icon-federation" src="/feua.jpg" alt="" />

          </div>
          <div className="home-brand">
            <div>
              <div className="home-brand-name">UCAE</div>
              <div className="home-brand-sub">Arts &amp; Culture</div>
            </div>
            <img className="icon-federation" src="/ucae.jpg" alt="" />
          </div>

        </header>
        <nav>
          <a href="#sessions">Nos sessions</a>
          <a href="#actu">Actualiter</a>
        </nav>
        <section className="home-content">
          <div className="home-copy">
            <p className="home-kicker">DÉCOUVRE • EXPRIME • RÉVÈLE TON TALENT</p>
            <h1>
              Rejoins notre troupe
              <span>artistique !</span>
            </h1>
            <p className="home-text">
              Nous recrutons de nouveaux talents pour enrichir notre troupe. Choisis tes disciplines et viens vivre l'aventure avec nous.
            </p>

            <div className="home-actions">
              <a href="/sessions" className="home-primary-btn">Découvrir les sessions →</a>
              <button type="button" className="home-secondary-btn" onClick={() => setIsAdhesionOpen(true)}>Je postule</button>
            </div>
          </div>

          <div className="home-badge">Les candidatures sont ouvertes</div>
        </section>
      </main>

      <section id="actu">
        <NewsArticle
          imageSrc="/bureau.jpg"
          imageAlt="Le bureau entrant 2026-2027"
        />
      </section>

      <section id="sessions" className="page-section sessions-section">
        <div className="section-heading">
          <p className="section-kicker">TROUVE TA SCÈNE</p>
          <h2>Nos sessions artistiques</h2>
          <p className="section-subtitle">
            Choisis une session pour commencer la candidature. Tu pourras ajouter d’autres talents lors de ta demande.
          </p>
        </div>

        <div className="sessions-grid">
          {sessionCards.map((session) => (
            <article className="session-card" key={session.id}>
              <div className="session-visual" style={{ backgroundImage: `url(${session.image})` }}>
                <span className="session-number">{session.number}</span>
              </div>
              <div className="session-body">
                <h3>{session.title}</h3>
                <p>{session.description}</p>
                <button type="button" className="session-link" onClick={() => setIsAdhesionOpen(true)}>
                  <span>Postuler à cette session</span>
                  <span>↗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isAdhesionOpen && <AdhesionModal onClose={() => setIsAdhesionOpen(false)} />}

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-brand">
            <img className="icon-federation" src="/ucae.jpg" alt="" />
            <span>UCAE</span>
          </div>
          <span>© 2026 UCAE. Tous les droits sont réservés.</span>
          <a href="/">Retour en haut ↑</a>
        </div>
      </footer>
    </div>
  );
}

function AdminScreen() {
  const [entries, setEntries] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadEntries() {
      const token = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);

      if (!token) {
        navigate("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/inscriptions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          navigate("/admin/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Impossible de charger les inscriptions.");
        }

        const data = await response.json();
        setEntries(Array.isArray(data?.data) ? data.data : []);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    }

    void loadEntries();
  }, [navigate]);

  function handleLogout() {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate("/admin/login");
  }

  const downloadEntries = () => {
    if (!entries.length) {
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("UCAE - Liste des candidatures", 14, 18);

    let y = 32;
    entries.forEach((entry, index) => {
      const nom = String(entry.nom ?? "—");
      const tel = String(entry.tel ?? "—");
      const sessions = Array.isArray(entry.sessions) ? entry.sessions.join(", ") : "—";
      const message = String(entry.message ?? "—").replace(/\n/g, " ");

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${nom}`, 14, y);
      y += 8;
      doc.text(`Tél: ${tel}`, 14, y);
      y += 8;
      doc.text(`Sessions: ${sessions}`, 14, y);
      y += 8;
      const wrappedMessage = doc.splitTextToSize(`Message: ${message}`, 180);
      doc.text(wrappedMessage, 14, y);
      y += wrappedMessage.length * 7 + 10;

      if (y > 260) {
        doc.addPage();
        y = 18;
      }
    });

    doc.save("inscriptions.pdf");
  };

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-kicker">ADMINISTRATION</p>
            <h1>Candidatures reçues</h1>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" className="admin-download-btn" onClick={downloadEntries} disabled={entries.length === 0}>
              Télécharger la liste
            </button>
            <button type="button" className="admin-download-btn" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </header>

        {loading && <p className="admin-state">Chargement des inscriptions…</p>}
        {!loading && error && <p className="admin-error">{error}</p>}

        {!loading && !error && entries.length === 0 && (
          <div className="admin-empty">
            <p>Aucune inscription pour le moment.</p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Sessions</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={String(entry.id ?? entry.nom ?? Math.random())}>
                    <td>{String(entry.nom ?? "—")}</td>
                    <td>{String(entry.tel ?? "—")}</td>
                    <td>{Array.isArray(entry.sessions) ? entry.sessions.join(", ") : "—"}</td>
                    <td>{String(entry.message ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function getInitialLoadingState() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export default function App() {
  const [isReady, setIsReady] = useState<boolean>(() => getInitialLoadingState());

  const handleComplete = useCallback(() => {
    setIsReady(true);

    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    } catch {
      // ignore storage errors in restricted browsers
    }
  }, []);

  if (!isReady) {
    return <LoadingScreen onComplete={handleComplete} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/sessions" element={<PolesScreen />} />
        <Route path="/poles" element={<PolesScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="/admin/login" element={<AdminLoginScreen />} />
        <Route path="/adhesion" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
