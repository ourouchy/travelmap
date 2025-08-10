import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import VoyageDetail from './VoyageDetail';

const Lieu = ({ lieuId, lieuData, onNavigateBack }) => {
  const [lieuDetails, setLieuDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVoyageId, setSelectedVoyageId] = useState(null);

  // Charger les détails du lieu avec ses voyages
  useEffect(() => {
    const fetchLieuDetails = async () => {
      try {
        setIsLoading(true);
        // Utiliser l'endpoint lieu-detail qui retourne les voyages
        const response = await fetch(`http://localhost:8000/api/lieux/${lieuId}/detail/`);
        
        if (response.ok) {
          const data = await response.json();
          setLieuDetails(data);
        } else {
          setError('Erreur lors du chargement des détails du lieu');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    if (lieuId) {
      fetchLieuDetails();
    }
  }, [lieuId]);

  const handleVoyageClick = (voyageId) => {
    setSelectedVoyageId(voyageId);
  };

  const handleBackFromVoyage = () => {
    setSelectedVoyageId(null);
  };

  if (selectedVoyageId) {
    return (
      <VoyageDetail 
        voyageId={selectedVoyageId} 
        onNavigateBack={handleBackFromVoyage}
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Chargement des détails du lieu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>{error}</div>
      </div>
    );
  }

  if (!lieuDetails) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>Lieu non trouvé</div>
      </div>
    );
  }

  const voyages = lieuDetails.user_voyages || [];

  return (
    <div style={{ padding: '0' }}>
      {/* Bouton de retour */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        zIndex: 1000 
      }}>
        <button
          onClick={onNavigateBack}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        >
          ← Retour à l'accueil
        </button>
      </div>

      {/* En-tête du lieu avec carte en arrière-plan */}
      <div style={{ 
        position: 'relative',
        height: '400px',
        marginBottom: '30px'
      }}>
        {/* Carte en arrière-plan */}
        <Map
          latitude={lieuDetails.latitude}
          longitude={lieuDetails.longitude}
          nom_ville={lieuDetails.nom_ville}
          pays_nom={lieuDetails.pays?.nom}
          height="400px"
          width="100%"
          zoom={12}
          showMarker={true}
        />
        
        {/* Overlay avec les informations du lieu */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          color: 'white',
          padding: '40px 20px 20px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '2.5em',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
          }}>
            {lieuDetails.nom_ville || 'Lieu'}
          </h1>
          {lieuDetails.pays && (
            <p style={{ 
              fontSize: '1.4em', 
              margin: '10px 0',
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              opacity: 0.9
            }}>
              {lieuDetails.pays.nom}
            </p>
          )}
          {lieuDetails.latitude && lieuDetails.longitude && (
            <p style={{ 
              fontSize: '1em', 
              opacity: 0.8,
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
            }}>
              📍 {lieuDetails.latitude}, {lieuDetails.longitude}
            </p>
          )}
          {lieuDetails.is_favori !== undefined && (
            <div style={{ marginTop: '15px' }}>
              {lieuDetails.is_favori ? (
                <span style={{ 
                  color: '#ff6b9d', 
                  fontSize: '1.1em',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                }}>
                  ❤️ Lieu favori
                </span>
              ) : (
                <span style={{ 
                  color: '#fff', 
                  fontSize: '1em',
                  opacity: 0.9,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                }}>
                  🤍 Ajouter aux favoris
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal avec padding */}
      <div style={{ padding: '0 20px' }}>
        {/* Statistiques du lieu */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '40px',
          marginBottom: '30px'
        }}>
          {/* Note moyenne */}
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ffd700' }}>
              {lieuDetails.note_moyenne ? lieuDetails.note_moyenne.toFixed(1) : 'N/A'}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Note moyenne</div>
          </div>

          {/* Nombre total de voyages */}
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1976d2' }}>
              {lieuDetails.total_voyages || voyages.length}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Voyages</div>
          </div>
        </div>

        {/* Liste des voyages */}
        <div>
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
            {lieuDetails.total_voyages > 0 
              ? `Voyages enregistrés (${lieuDetails.total_voyages})`
              : 'Voyages des utilisateurs'
            }
          </h2>
          
          {voyages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div>Aucun voyage enregistré pour ce lieu pour le moment.</div>
              <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                Soyez le premier à partager votre expérience !
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {voyages.map((voyage, index) => (
                <div
                  key={voyage.id || index}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* En-tête de la card avec nom et note */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#333' }}>
                      {voyage.utilisateur?.username || 'Utilisateur'}
                    </div>
                    {voyage.note && (
                      <div style={{ 
                        backgroundColor: '#ffd700', 
                        color: '#333',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        fontWeight: 'bold'
                      }}>
                        ⭐ {voyage.note}/5
                      </div>
                    )}
                  </div>

                  {/* Portion du commentaire */}
                  {voyage.commentaire && (
                    <div style={{ 
                      marginBottom: '20px',
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '0.95em',
                      color: '#495057',
                      lineHeight: '1.4',
                      maxHeight: '80px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      "{voyage.commentaire.length > 100 
                        ? voyage.commentaire.substring(0, 100) + '...'
                        : voyage.commentaire
                      }"
                    </div>
                  )}

                  {/* Bouton Voir plus */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleVoyageClick(voyage.id)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.95em',
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                      Voir plus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lieu; 