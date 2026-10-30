import PoleSection from "./components/PoleSection";

/**
 * PolesScreen
 * ---------------------------------------------------------------
 * Liste les 4 pôles de l'UCAE. Les images de chaque session sont
 * détectées automatiquement depuis src/assets/img/ (ex. musique_1.jpg,
 * musique_2.jpg... sont regroupées sous la clé "musique").
 *
 * Si aucune image n'est trouvée dans ce dossier, les images Unsplash
 * de secours (FALLBACK_SESSION_IMAGES) sont utilisées à la place.
 *
 * Pour l'afficher, importe ce composant dans ta page d'accueil
 * ou donne-lui sa propre route dans App.tsx :
 *   <Route path="/poles" element={<PolesScreen />} />
 */

const titleMap: Record<string, string> = {
  comedie: "Comédie",
  slam: "Slam",
  choregraphie: "Chorégraphie",
  interpretation: "Interprétation",
  folklorique: "Groupe folklorique",
};

const descriptionMap: Record<string, string> = {
  comedie:
    "Le pôle Comédie accueille les étudiants attirés par l'humour, l'improvisation et les sketchs. Ateliers d'écriture et scènes ouvertes.",
  slam: "Le pôle Slam met en avant la voix, la poésie et l'inspiration dans des performances expressives.",
  choregraphie:
    "Le pôle Chorégraphie explore le rythme, la danse et la création de mouvements à travers des ateliers réguliers.",
  interpretation:
    "Le pôle Interprétation développe le jeu d'acteur, les rôles et l'expression scénique des étudiants.",
  folklorique:
    "Le pôle Folklorique rassemble les talents attachés aux traditions, aux rythmes et aux danses populaires.",
};

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
  chorégraphie: [
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1549834146-1d9af392b7d8?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  ],
  folklore: [
    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1501679681995-5d820148f0b2?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
  ],
  slam: [
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
  ],
};

// import.meta.glob ne peut cibler que src/ (pas public/), car seuls les
// fichiers de src/ passent par le système de modules de Vite.
// `import: "default"` renvoie directement l'URL finale de chaque image.
const globResult = import.meta.glob(
  "/src/assets/img/*.{jpg,jpeg,png,webp,avif,gif}",
  { eager: true, import: "default" }
) as Record<string, string>;

// Chaque entrée : chemin du fichier source -> URL utilisable dans <img src>
const discoveredSessionImages = Object.entries(globResult).map(
  ([path, url]) => ({ path, url })
);

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const groupedImages = new Map<string, string[]>();

for (const { path, url } of discoveredSessionImages) {
  const fileName = path.split("/").pop() ?? "";
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  // "musique_1.jpg" -> clé "musique" (tout avant le dernier "_")
  const key = withoutExtension.split("_").slice(0, -1).join("_") || withoutExtension;
  const normalizedKey = normalizeKey(key);
  const entry = groupedImages.get(normalizedKey) ?? [];
  entry.push(url);
  groupedImages.set(normalizedKey, entry);
}

const POLES = (
  discoveredSessionImages.length > 0
    ? Array.from(groupedImages.entries())
    : Object.entries(FALLBACK_SESSION_IMAGES)
).map(([key, images]) => {
  const lookupKey = normalizeKey(key);
  return {
    title: titleMap[lookupKey] ?? titleMap[key] ?? key,
    description:
      descriptionMap[lookupKey] ?? descriptionMap[key] ?? "Session découverte.",
    images: discoveredSessionImages.length > 0
      ? [...images].sort((a, b) => a.localeCompare(b))
      : images,
  };
}).sort((a, b) => a.title.localeCompare(b.title));

export default function PolesScreen() {
  return (
    <main className="max-w-4xl mx-auto px-6">
      {POLES.map((pole, index) => (
        <PoleSection
          key={pole.title}
          title={pole.title}
          description={pole.description}
          images={pole.images}
          reverse={index % 2 === 1}
        />
      ))}
    </main>
  );
}