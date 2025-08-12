import React, { useState, useEffect } from 'react';

const Index = ({ onNavigateToLieu }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ lieux: [], pays: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // --- Historique (objets: {label, type?, id?, payload?}) avec fallback strings ---
  const [recent, setRecent] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('recent') || '[]');
      // compat : si c’est un string, on l’enveloppe en {label}
      return Array.isArray(raw)
        ? raw.map((it) => (typeof it === 'string' ? { label: it } : it))
        : [];
    } catch {
      return [];
    }
  });

  const persistRecent = (items) => {
    localStorage.setItem('recent', JSON.stringify(items));
  };

  const saveRecent = (entry) => {
    // entry attendu: {label, type?, id?, payload?}
    if (!entry?.label?.trim()) return;
    const dedup = (arr) => {
      const seen = new Set();
      const out = [];
      for (const it of arr) {
        const key = it.id ? `${it.type || ''}:${it.id}` : it.label;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(it);
        }
      }
      return out;
    };
    const next = dedup([entry, ...recent]).slice(0, 6);
    setRecent(next);
    persistRecent(next);
  };

  // --- Détection thème sombre ---
  const isDark = (() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark';
  })();

  // --- Recherche backend ---
  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults({ lieux: [], pays: [] });
      setShowResults(false);
      return;
    }

    setIsLoading(true);

    const MOCK = false;
    if (MOCK) {
      const data = {
        lieux: [
          { id: 1, nom_ville: 'Paris', pays: { nom: 'France' } },
          { id: 2, nom_ville: 'Paraty', pays: { nom: 'Brésil' } }
        ],
        pays: [{ nom: 'Paraguay' }]
      };
      setTimeout(() => {
        setSearchResults(data);
        setShowResults(true);
        setIsLoading(false);
      }, 200);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('API /search =>', data);
        if ((data.lieux && data.lieux.length > 0) || (data.pays && data.pays.length > 0)) {
          setSearchResults(data);
          setShowResults(true);
        } else {
          setSearchResults({ lieux: [], pays: [] });
          setShowResults(false);
        }
      } else {
        console.error('Erreur lors de la recherche');
        setSearchResults({ lieux: [], pays: [] });
        setShowResults(false);
      }
    } catch (error) {
      console.error("Erreur de connexion à l'API:", error);
      setSearchResults({ lieux: [], pays: [] });
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Auto-complétion fantôme ---
  const ghostText = (() => {
    if (!searchQuery) return '';
    const q = searchQuery.toLowerCase();
    const firstCity = searchResults.lieux[0]?.nom_ville || '';
    const firstCountry = searchResults.pays[0]?.nom || '';
    const first = firstCity || firstCountry;
    if (first && first.toLowerCase().startsWith(q) && first.length > searchQuery.length) {
      return searchQuery + first.slice(searchQuery.length);
    }
    return '';
  })();

  const handleKeyDown = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghostText) {
      e.preventDefault();
      setSearchQuery(ghostText);
    }
  };

  // --- Saisie avec debounce ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // --- Sélection d'un résultat (API) ---
  const handlePlaceSelect = (place, type) => {
    console.log(`${type} sélectionné:`, place);

    if (type === 'lieu') {
      const label = `${place.nom_ville}, ${place.pays.nom}`;
      setSearchQuery(label);
      // on garde id/type/payload pour naviguer depuis l’historique
      saveRecent({ label, type: 'lieu', id: place.id, payload: place });
      if (onNavigateToLieu && place.id) {
        onNavigateToLieu(place.id, place);
      }
    } else if (type === 'pays') {
      const label = place.nom;
      setSearchQuery(label);
      // pas de navigation pays pour l’instant
      saveRecent({ label, type: 'pays', payload: place });
      console.log('Pays sélectionné, navigation non implémentée pour le moment');
    }

    setShowResults(false);
  };

  // --- Click sur un item d’historique ---
  const handleRecentClick = async (item) => {
    // item = {label, type?, id?, payload?} ou {label} (ancien format)
    setSearchQuery(item.label);

    if (item.type === 'lieu' && item.id && onNavigateToLieu) {
      // navigation directe si on a l’id
      return onNavigateToLieu(item.id, item.payload || null);
    }

    // fallback : si ancien format (juste label) on re-questionne l’API
    try {
      const response = await fetch(
        `http://localhost:8000/api/search/?q=${encodeURIComponent(item.label)}`
      );
      if (response.ok) {
        const data = await response.json();
        const first = data?.lieux?.[0];
        if (first?.id && onNavigateToLieu) {
          // on en profite pour upgrader l’historique avec id/type
          saveRecent({
            label: `${first.nom_ville}, ${first.pays?.nom || ''}`.trim(),
            type: 'lieu',
            id: first.id,
            payload: first
          });
          return onNavigateToLieu(first.id, first);
        }
      }
    } catch (e) {
      console.warn('Recherche de fallback depuis historique échouée:', e);
    }
    // sinon : on laisse juste le texte dans la barre
  };

  // --- Gestion saisie ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value) {
      setShowResults(false);
      setSearchResults({ lieux: [], pays: [] });
    }
  };

  const handleInputFocus = () => {
    if (searchResults.lieux.length > 0 || searchResults.pays.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  const hasResults = searchResults.lieux.length > 0 || searchResults.pays.length > 0;

  // Styles communs pour aligner l’input et le ghost
  const inputPadding = '8px 12px 8px 36px';

  return (
    <div>
      <h1 style={{ fontFamily: 'cursive' }}>Où partez-vous ?</h1>

      <div className="searchbox" style={{ position: 'relative' }}>
        {/* Loupe */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          style={{
            position: 'absolute',
            left: 12,
            top: 10,
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 2
          }}
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Fantôme d'autocomplétion */}
        {ghostText && (
          <input
            value={ghostText}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              padding: inputPadding,
              border: '1px solid transparent',
              borderRadius: 4,
              color: isDark ? '#b7b7b7' : '#999',
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}

        {/* Input */}
        <input
          autoComplete="off"
          inputMode="search"
          placeholder="Entrez une destination"
          type="search"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          style={{
            position: 'relative',
            zIndex: 1,
            padding: inputPadding,
            background: 'transparent'
          }}
        />

        {/* Historique */}
        {!searchQuery && recent.length > 0 && (
          <div
            className="tm-dropdown"
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: isDark ? '#1f1f1f' : 'white',
              color: isDark ? '#eaeaea' : 'inherit',
              border: `1px solid ${isDark ? '#333' : '#ddd'}`,
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000, maxHeight: '300px', overflowY: 'auto'
            }}
          >
            <div
              className="tm-header"
              style={{
                padding: '8px 15px',
                background: isDark ? '#242424' : '#f8f9fa',
                fontWeight: 'bold',
                fontSize: '0.9em',
                color: isDark ? '#cfcfcf' : '#666',
                borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`
              }}
            >
              Recherches récentes
            </div>

            {recent.map((item, i) => (
              <div
                key={`r-${i}`}
                onClick={() => handleRecentClick(item)}
                className="tm-item"
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#eee'}`
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#2a2a2a' : '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 'bold' }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Résultats API */}
        {showResults && hasResults && (
          <div
            className="tm-dropdown"
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: isDark ? '#1f1f1f' : 'white',
              color: isDark ? '#eaeaea' : 'inherit',
              border: `1px solid ${isDark ? '#333' : '#ddd'}`,
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000, maxHeight: '300px', overflowY: 'auto'
            }}
          >
            {isLoading ? (
              <div style={{ padding: '10px', textAlign: 'center' }}>Recherche en cours...</div>
            ) : (
              <>
                {searchResults.lieux.length > 0 && (
                  <>
                    <div
                      className="tm-header"
                      style={{
                        padding: '8px 15px',
                        background: isDark ? '#242424' : '#f8f9fa',
                        fontWeight: 'bold',
                        fontSize: '0.9em',
                        color: isDark ? '#cfcfcf' : '#666',
                        borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`
                      }}
                    >
                      Villes
                    </div>
                    {searchResults.lieux.map((lieu, index) => (
                      <div
                        key={`lieu-${index}`}
                        onClick={() => handlePlaceSelect(lieu, 'lieu')}
                        className="tm-item"
                        style={{
                          padding: '10px 15px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#eee'}`,
                          display: 'flex', flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#2a2a2a' : '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 'bold' }}>{lieu.nom_ville}</div>
                        <div style={{ fontSize: '0.9em', color: isDark ? '#b8b8b8' : '#666' }}>
                          {lieu.pays.nom}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {searchResults.pays.length > 0 && (
                  <>
                    <div
                      className="tm-header"
                      style={{
                        padding: '8px 15px',
                        background: isDark ? '#242424' : '#f8f9fa',
                        fontWeight: 'bold',
                        fontSize: '0.9em',
                        color: isDark ? '#cfcfcf' : '#666',
                        borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`
                      }}
                    >
                      Pays
                    </div>
                    {searchResults.pays.map((pays, index) => (
                      <div
                        key={`pays-${index}`}
                        onClick={() => handlePlaceSelect(pays, 'pays')}
                        className="tm-item"
                        style={{
                          padding: '10px 15px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#eee'}`,
                          display: 'flex', flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#2a2a2a' : '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 'bold' }}>{pays.nom}</div>
                        <div style={{ fontSize: '0.9em', color: isDark ? '#b8b8b8' : '#666' }}>Pays</div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;




