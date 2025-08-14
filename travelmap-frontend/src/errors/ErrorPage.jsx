import React from "react";

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent", // Pas de fond
    color: "var(--text-color)", // Dynamique selon le thème
    textAlign: "center",
    padding: 20,
    fontFamily:
      'system-ui,-apple-system,Segoe UI,Roboto,Arial,"Noto Sans",sans-serif',
  },
  h1: {
    margin: "0 0 10px",
    fontSize: "clamp(24px, 5vw, 42px)",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)", // léger contraste
  },
  p: {
    margin: "6px 0",
    color: "var(--text-color)", // Dynamique selon le thème
    lineHeight: 1.6,
    textShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  mini: {
    marginTop: 14,
    fontSize: 13,
    color: "var(--text-color)", // Dynamique
    opacity: 0.8,
  },
};

export default function ErrorPage({ code = 404, title, hint }) {
  const defaults = {
    400: "Requête invalide",
    401: "Authentification requise",
    403: "Accès refusé",
    404: "Page introuvable",
    500: "Erreur interne",
    503: "Service indisponible",
  };
  const computedTitle = title || defaults[code] || "Problème inattendu";

  return (
    <main style={styles.page} role="main" aria-labelledby="page-title">
      <div style={{ fontSize: 52, marginBottom: 8 }}>🗺️</div>

      <h1 id="page-title" style={styles.h1}>
        {code} — {computedTitle}
      </h1>

      <p style={styles.p}>
        Oups… On a perdu la route. Essayons un autre chemin.
      </p>

      {hint && <p style={styles.p}>{hint}</p>}

      <div style={styles.mini} aria-live="polite">
        {new Date().toLocaleString()}
      </div>

      <meta name="robots" content="noindex" />
    </main>
  );
}

