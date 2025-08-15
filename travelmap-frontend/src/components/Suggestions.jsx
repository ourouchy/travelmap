import React, { useState, useEffect } from 'react';

const Suggestions = ({ token, onRefresh, onNavigateToLieu }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchSuggestions();
    }
  }, [token]);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/suggestions/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setMessage(data.message);
      } else if (response.status === 401) {
        setError('Veuillez vous reconnecter pour voir vos suggestions');
      } else {
        setError('Erreur lors du chargement des suggestions');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (lieu) => {
    if (onNavigateToLieu) {
      onNavigateToLieu(lieu.id, lieu);
    }
  };

  const handleRefresh = async () => {
    await fetchSuggestions();
    onRefresh?.(); // Callback pour notifier le parent
  };

  if (isLoading) {
    return (
      <div className="suggestions-container">
        <div className="suggestions-loading">
          Chargement des suggestions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suggestions-container">
        <div className="suggestions-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-container">
        <div className="suggestions-empty">
          <h4>💡 Aucune suggestion pour le moment</h4>
          <p>Ajoutez des lieux à vos favoris pour recevoir des suggestions personnalisées</p>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-container">
      <div className="suggestions-header">
        <h3>💡 Suggestions pour vous</h3>
        <button 
          className="btn-refresh" 
          onClick={fetchSuggestions}
          disabled={isLoading}
        >
          🔄 Actualiser
        </button>
      </div>
      
      <div className="suggestions-grid">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id} 
            className="suggestion-card"
            onClick={() => onNavigateToLieu(suggestion.id)}
          >
            <div className="suggestion-info">
              <div className="suggestion-city">{suggestion.nom_ville}</div>
              <div className="suggestion-country">{suggestion.pays.nom}</div>
            </div>
            <div className="suggestion-arrow">→</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions; 