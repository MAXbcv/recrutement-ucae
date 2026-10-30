import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * PoleSection
 * ---------------------------------------------------------------
 * Un bloc "pôle" (Musique, Danse, Comédie, Théâtre) :
 * - à gauche (ou à droite si reverse=true) : les photos de la
 *   session se chargent réellement et s'empilent une par une,
 *   avec le pourcentage en dessous pendant ce temps ;
 * - une fois toutes chargées, une petite galerie finale s'affiche ;
 * - à droite : le titre, le texte, et le bouton "S'inscrire".
 *
 * Usage (dans la page qui liste les 4 pôles) :
 * <PoleSection
 *   title="Musique"
 *   description="Le pôle Musique rassemble..."
 *   images={["/uploads/musique1.jpg", "/uploads/musique2.jpg", "/uploads/musique3.jpg"]}
 *   reverse={false}
 * />
 */

type Props = {
  title: string;
  description: string;
  images: string[];
  reverse?: boolean; // true = image à droite, texte à gauche
};

const FAN_OFFSETS = [
  { x: 0, y: 0, r: 0 },
  { x: 10, y: -4, r: 7 },
  { x: -10, y: -8, r: -9 },
  { x: 14, y: -14, r: 12 },
];

export default function PoleSection({
  title,
  description,
  images,
  reverse = false,
}: Props) {
  // loadedUrls = liste des images qui ont fini de charger, dans l'ordre
  const [loadedUrls, setLoadedUrls] = useState<string[]>([]);

  // Au montage du composant : on démarre le chargement de chaque image,
  // et on ajoute son URL à loadedUrls dès qu'elle est prête.
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      const mark = () => {
        setLoadedUrls((prev) => (prev.includes(src) ? prev : [...prev, src]));
      };
      img.onload = mark;
      img.onerror = mark; // une image cassée ne bloque pas les autres
      img.src = src;
    });
  }, [images]);

  const total = images.length;
  const isDone = loadedUrls.length === total;
  const percent = total === 0 ? 100 : Math.round((loadedUrls.length / total) * 100);

  return (
    <section
      className={`flex flex-col md:flex-row ${
        reverse ? "md:flex-row-reverse" : ""
      } items-center gap-10 py-14 border-b border-neutral-800`}
    >
      {/* --- Colonne image --- */}
      <div className="flex-none w-56 flex flex-col items-center">
        {!isDone ? (
          <>
            <div className="relative w-16 h-16 mb-3">
              {loadedUrls.slice(-4).map((src, i) => {
                const off = FAN_OFFSETS[i] ?? FAN_OFFSETS[FAN_OFFSETS.length - 1];
                return (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="absolute top-0 left-0 w-12 h-12 rounded-md object-cover shadow-md"
                    style={{
                      transform: `translate(${off.x}px, ${off.y}px) rotate(${off.r}deg)`,
                      zIndex: i,
                    }}
                  />
                );
              })}
            </div>
            <div className="w-40 h-px bg-neutral-700 mb-2" />
            <span className="text-sm font-semibold tabular-nums text-neutral-400">
              {percent}%
            </span>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {images.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                className="w-full aspect-square object-cover rounded-md"
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Colonne texte --- */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <p className="text-neutral-400 mb-5">{description}</p>
        <Link
          to={`/adhesion?pole=${encodeURIComponent(title)}`}
          className="inline-block rounded-md px-5 py-2.5 font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
        </Link>
      </div>
    </section>
  );
}
