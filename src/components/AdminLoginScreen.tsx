import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const ADMIN_TOKEN_KEY = "ucae-admin-token";

export default function AdminLoginScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Mot de passe incorrect.");
        return;
      }

      // Le token est gardé dans sessionStorage : il disparaît quand
      // l'onglet se ferme, donc pas besoin de se "déconnecter" à la main.
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      navigate("/admin");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-shell" style={{ maxWidth: 360, margin: "0 auto" }}>
        <header className="admin-header">
          <div>
            <p className="section-kicker">ADMINISTRATION</p>
            <h1>Connexion</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </label>
          <button type="submit" className="admin-download-btn" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </div>
    </main>
  );
}
