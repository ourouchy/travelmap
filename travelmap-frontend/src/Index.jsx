import React, { useState, useEffect, useRef } from 'react';

const Index = ({ onNavigateToLieu }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ lieux: [], pays: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);

  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults({ lieux: [], pays: [] });
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if ((data.lieux?.length || 0) > 0 || (data.pays?.length || 0) > 0) {
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) searchPlaces(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // clic extérieur
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowResults(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handlePlaceSelect = (place, type) => {
    if (type === 'lieu') {
      setSearchQuery(`${place.nom_ville}, ${place.pays.nom}`);
      if (onNavigateToLieu) onNavigateToLieu(place.id, place);
    } else if (type === 'pays') {
      setSearchQuery(place.nom);
    }
    setShowResults(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) {
      setShowResults(false);
      setSearchResults({ lieux: [], pays: [] });
    }
  };

  const handleKeyDown = (e) => {
    const allResults = [
      ...searchResults.lieux.map((item) => ({ ...item, type: 'lieu' })),
      ...searchResults.pays.map((item) => ({ ...item, type: 'pays' }))
    ];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handlePlaceSelect(allResults[activeIndex], allResults[activeIndex].type);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  const hasResults = searchResults.lieux.length > 0 || searchResults.pays.length > 0;

  return (
    <div className="search-container" ref={boxRef}>
      <h1>Ou partez-vous ?</h1>
  
      <div className="searchbox">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 
            16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 
            5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 
            4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 
            11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 
            11.99 14 9.5 14z"/>
        </svg>
        <input
          autoComplete="off"
          inputMode="search"
          placeholder="Paris,Kyoto,Dakar..."
          type="search"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => { if (hasResults) setShowResults(true); }}
          onKeyDown={handleKeyDown}
          aria-expanded={showResults}
          aria-activedescendant={activeIndex >= 0 ? `result-${activeIndex}` : undefined}
        />
        {showResults && hasResults && (
          <div className="results">
            {isLoading ? (
              <div className="loading">Recherche en cours...</div>
            ) : (
              <>
                {searchResults.lieux.length > 0 && (
                  <>
                    <div className="category">Villes</div>
                    {searchResults.lieux.map((lieu, index) => (
                      <div
                        id={`result-${index}`}
                        key={`lieu-${index}`}
                        className={`result ${activeIndex === index ? 'active' : ''}`}
                        onClick={() => handlePlaceSelect(lieu, 'lieu')}
                      >
                        <strong>{lieu.nom_ville}</strong>
                        <span>{lieu.pays.nom}</span>
                      </div>
                    ))}
                  </>
                )}
                {searchResults.pays.length > 0 && (
                  <>
                    <div className="category">Pays</div>
                    {searchResults.pays.map((pays, i) => {
                      const idx = searchResults.lieux.length + i;
                      return (
                        <div
                          id={`result-${idx}`}
                          key={`pays-${i}`}
                          className={`result ${activeIndex === idx ? 'active' : ''}`}
                          onClick={() => handlePlaceSelect(pays, 'pays')}
                        >
                          <strong>{pays.nom}</strong>
                          <span>Pays</span>
                        </div>
                      );
                    })}
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
