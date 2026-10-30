import { useState } from "react";

const sessionChoices = [
  { id: "comedie", label: "Comédie", icon: "🎭", description: "Sketches, humour et scènes comiques." },
  { id: "interpretation", label: "Interprétation", icon: "🎬", description: "Jeu d’acteur, rôles et expression scénique." },
  { id: "chorégraphie", label: "Chorégraphie", icon: "💃", description: "Danse, rythme et création de mouvements." },
  { id: "folklorique", label: "Groupe folklorique", icon: "🌿", description: "Obligatoire pour tous les candidats" },
  { id: "slam", label: "Slam", icon: "🎤", description: "Voix, poésie et l’inspiration dans des performances expressives." },

];

export default function AdhesionScreen() {
  const [status, setStatus] = useState("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>(["folklorique"]);

  const toggleSession = (id: string) => {
    if (id === "folklorique") return;

    setSelectedSessions((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("Envoi en cours…");

    const form = e.currentTarget;
    const data = {
      nom: (form.elements.namedItem("nom") as HTMLInputElement).value,
      tel: (form.elements.namedItem("telephone") as HTMLInputElement)?.value ?? "",
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)?.value ?? "",
      sessions: selectedSessions,
    };

    try {
      const res = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("Inscription envoyée avec succès !");
      form.reset();
    } catch {
      setStatus("Erreur lors de l'envoi. Réessaie plus tard.");
    }
  }

  return (
    <main className="adhesion-page">
      <a href="/">Retou</a>
      <div className="adhesion-layout">
        <aside className="info-card">
          <div className="mini-avatars">
            <span>🎤</span>
            <span>🎭</span>
            <span>🎵</span>
          </div>

          <p className="eyebrow">TA PROCHAINE AVENTURE COMMENCE ICI</p>
          <h1>Formulaire de candidature</h1>
          <p className="info-copy">
            Une seule candidature suffit, même si tu choisis plusieurs sessions.
          </p>

          <ul className="check-list">
            <li>Choix de plusieurs disciplines</li>
            <li>Folklorique inclus par défaut</li>
          </ul>
        </aside>

        <section className="form-panel">
          <form onSubmit={handleSubmit} className="candidate-form">
            <div className="form-header-row">
              <span className="section-kicker">CANDIDATURE</span>
              <span className="helper">* Champs obligatoires</span>
            </div>

            <h2>Parle-nous de toi</h2>

            <div className="field-grid">
              <label className="field">
                <span>Nom complet *</span>
                <input name="nom" type="text" placeholder="Ex.: Aicha Kossi" required />
              </label>

              <label className="field">
                <span>Téléphone *</span>
                <input name="telephone" type="tel" placeholder="+229 ..." required />
              </label>
            </div>

            <label className="field full-width">
              <span>Présente-toi en quelques mots</span>
              <textarea name="message" placeholder="Ton expérience, tes motivations, tes talents..." required />
            </label>

            <div className="session-section">
              <div className="session-header">
                <h3>Quelles sessions t’intéressent ?</h3>
                <span className="chip">
                  {selectedSessions.length} session{selectedSessions.length > 1 ? "s" : ""}
                </span>
              </div>

              <p>Tu peux en choisir plusieurs. Le folklore reste obligatoire.</p>

              <div className="session-grid">
                {sessionChoices.map((choice) => {
                  const isChecked = choice.id === "folklorique" || selectedSessions.includes(choice.id);

                  return (
                    <div
                      key={choice.id}
                      className={`session-option ${isChecked ? "selected" : ""} ${choice.id === "folklorique" ? "green" : ""}`}
                      onClick={() => {
                        if (choice.id !== "folklorique") {
                          toggleSession(choice.id);
                        }
                      }}
                      onKeyDown={(event) => {
                        if ((event.key === "Enter" || event.key === " ") && choice.id !== "folklorique") {
                          event.preventDefault();
                          toggleSession(choice.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isChecked}
                      aria-disabled={choice.id === "folklorique"}
                    >
                      <div className="session-left">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSession(choice.id)}
                          onClick={(event) => event.stopPropagation()}
                          disabled={choice.id === "folklorique"}
                        />
                        <span className="session-emoji">{choice.icon}</span>
                        <div>
                          <strong>{choice.label}</strong>
                          <small>{choice.description}</small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="submit-button">
              Envoyer ma candidature
            </button>
            {status && <p className="status-message">{status}</p>}
          </form>
        </section>
      </div>
    </main>
  );
}
