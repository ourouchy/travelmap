import React, { useState, useEffect } from 'react';
import Suggestions from './components/Suggestions';

const Index = ({ onNavigateToLieu }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ lieux: [], pays: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [token, setToken] = useState(null);

  // Récupérer le token au chargement
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setToken(authToken);
    }
  }, []);

  // Fonction pour rechercher avec notre API backend
  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults({ lieux: [], pays: [] });
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      // Utilisation de notre API backend Django
      const response = await fetch(
        `http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`
      );
      
      if (response.ok) {
        const data = await response.json();
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
      console.error('Erreur de connexion à l\'API:', error);
      setSearchResults({ lieux: [], pays: [] });
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la saisie avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Gestion de la sélection d'un lieu
  const handlePlaceSelect = (place, type) => {
    console.log(`${type} sélectionné:`, place);
    
    if (type === 'lieu') {
      setSearchQuery(`${place.nom_ville}, ${place.pays.nom}`);
      // Naviguer vers la page du lieu
      if (onNavigateToLieu) {
        onNavigateToLieu(place.id, place);
      }
    } else if (type === 'pays') {
      setSearchQuery(place.nom);
      // Pour les pays, on pourrait naviguer vers une page pays ou rester sur la recherche
      console.log('Pays sélectionné, navigation non implémentée pour le moment');
    }
    
    setShowResults(false);
  };

  // Gestion de la saisie
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value) {
      setShowResults(false);
      setSearchResults({ lieux: [], pays: [] });
    }
  };

  // Gestion du focus/blur
  const handleInputFocus = () => {
    if (searchResults.lieux.length > 0 || searchResults.pays.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur un résultat
    setTimeout(() => setShowResults(false), 200);
  };

  // Vérifier s'il y a des résultats
  const hasResults = searchResults.lieux.length > 0 || searchResults.pays.length > 0;

  return (
    <div>
      <h1>Ou partez-vous ?</h1>
      <div className="searchbox" style={{ position: 'relative' }}>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input 
          autocomplete="off" 
          inputmode="search" 
          placeholder="Entrez une destination" 
          type="search"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        
        {/* Résultats de recherche */}
        {showResults && hasResults && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {isLoading ? (
              <div style={{ padding: '10px', textAlign: 'center' }}>Recherche en cours...</div>
            ) : (
              <>
                {/* Affichage des lieux */}
                {searchResults.lieux.length > 0 && (
                  <>
                    <div style={{ 
                      padding: '8px 15px', 
                      backgroundColor: '#f8f9fa', 
                      fontWeight: 'bold',
                      fontSize: '0.9em',
                      color: '#666',
                      borderBottom: '1px solid #eee'
                    }}>
                      Villes
                    </div>
                    {searchResults.lieux.map((lieu, index) => (
                      <div
                        key={`lieu-${index}`}
                        onClick={() => handlePlaceSelect(lieu, 'lieu')}
                        style={{
                          padding: '10px 15px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: 'bold' }}>{lieu.nom_ville}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          {lieu.pays.nom}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Affichage des pays */}
                {searchResults.pays.length > 0 && (
                  <>
                    <div style={{ 
                      padding: '8px 15px', 
                      backgroundColor: '#f8f9fa', 
                      fontWeight: 'bold',
                      fontSize: '0.9em',
                      color: '#666',
                      borderBottom: '1px solid #eee'
                    }}>
                      Pays
                    </div>
                    {searchResults.pays.map((pays, index) => (
                      <div
                        key={`pays-${index}`}
                        onClick={() => handlePlaceSelect(pays, 'pays')}
                        style={{
                          padding: '10px 15px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: 'bold' }}>{pays.nom}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          Pays
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* NOUVEAU : Section Suggestions */}
      {token && (
        <Suggestions 
          token={token} 
          onRefresh={() => {
            // Recharger les suggestions si nécessaire
            console.log('Suggestions actualisées');
          }}
          onNavigateToLieu={onNavigateToLieu}
        />
      )}
    </div>
  );
};

export default Index;