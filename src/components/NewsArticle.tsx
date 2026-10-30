type Props = {
  imageSrc: string;
  imageAlt?: string;
};

/**
 * NewsArticle
 * ---------------------------------------------------------------
 * Affiche l'image "flottante" à gauche, avec le texte qui s'enroule
 * autour — comme dans un article de journal. Les styles sont dans
 * index.css (classes .news-article, .news-image).
 */
export default function NewsArticle({ imageSrc, imageAlt = "" }: Props) {
  return (
    <article className="news-article">
      <img src={imageSrc} alt={imageAlt} className="news-image" />

      <p>
        L'Union Culturelle et Artistique des Étudiants (UCAE) de Natitingou,
        sous la tutelle de la FEUA, vient de dévoiler son nouveau bureau
        entrant pour le compte de l'année académique 2026-2027.
      </p>

      <p>
        Conduit par son nouveau Dirigeant <strong>Géraud AHOUANSE</strong> (PCT-3/ENS NATI),
        le bureau composé de 11 membres s'engage à porter haut les couleurs
        de la culture universitaire à travers le <span className="slam">slam</span>, la <span className="choregraphie">chorégraphie</span>, le
        folklore, la <span className="comedie">comédie</span> et bien d'autres.
      </p>
      <div className="news-clear" />
    </article>
  );
}