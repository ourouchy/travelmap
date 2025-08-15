import React, { useState, useEffect } from 'react';

const Favoris = ({ onNavigateBack, setCurrentPage, onNavigateToLieu }) => {
  const [favoris, setFavoris] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavoris();
  }, []);

  const fetchFavoris = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Vous devez être connecté pour voir vos favoris');
        return;
      }

      const response = await fetch('http://localhost:8000/api/favoris/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavoris(data);
      } else {
        setError('Erreur lors du chargement des favoris');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/api/favoris/${favoriId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Retirer le favori de la liste locale
        setFavoris(favoris.filter(f => f.id !== favoriId));
      } else {
        setError('Erreur lors de la suppression du favori');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleLieuClick = (lieuId, lieuData) => {
    // Navigation vers la page du lieu en utilisant le même mécanisme que la barre de recherche
    if (onNavigateToLieu) {
      onNavigateToLieu(lieuId, lieuData);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Chargement de vos favoris...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>{error}</div>
        <button onClick={onNavigateBack} style={{ marginTop: '10px' }}>
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="button-group">
        <button className="cancel" onClick={onNavigateBack}>← Retour</button>
      </div>

      <div className="form-container" style={{ marginTop: '80px' }}>
        <h1>Mes Lieux Favoris</h1>
        
        {favoris.length === 0 ? (
          <div className="empty-section">
            <div>Vous n'avez pas encore de lieux favoris</div>
            <div className="form-hint">
              Ajoutez des lieux aux favoris depuis leurs pages de détail
            </div>
          </div>
        ) : (
          <div className="voyage-grid">
            {favoris.map((favori) => (
              <div key={favori.id} className="dashboard-card card-hover">
                <div className="dashboard-header">
                  <h3>{favori.lieu.nom_ville}</h3>
                  <div className="voyage-rating">
                    {favori.lieu.pays.nom}
                  </div>
                </div>

                <div className="voyage-comment">
                  Ajouté le {new Date(favori.date_ajout).toLocaleDateString('fr-FR')}
                </div>

                <div className="actions">
                  <button
                    onClick={() => handleLieuClick(favori.lieu.id, favori.lieu)}
                    className="button"
                  >
                    Voir le lieu
                  </button>
                  <button
                    onClick={() => handleRemoveFavorite(favori.id)}
                    className="delete"
                  >
                    Retirer des favoris
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favoris; 