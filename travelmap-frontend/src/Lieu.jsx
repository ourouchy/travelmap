import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import VoyageDetail from './VoyageDetail';
import ActiviteDetail from './ActiviteDetail';

const Lieu = ({ lieuId, lieuData, onNavigateBack, setViewingUserId, setCurrentPage }) => {
  const [lieuDetails, setLieuDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVoyageId, setSelectedVoyageId] = useState(null);
  const [selectedActiviteId, setSelectedActiviteId] = useState(null);
  const [activites, setActivites] = useState([]);
  const [isLoadingActivites, setIsLoadingActivites] = useState(false);

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

  // Charger les activités du lieu
  useEffect(() => {
    const fetchActivites = async () => {
      if (!lieuId) return;
      
      try {
        setIsLoadingActivites(true);
        
        // Récupérer le token JWT pour l'authentification
        const token = localStorage.getItem('authToken');
        const headers = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:8000/api/activites/?lieu_id=${lieuId}`, {
          headers: headers
        });
        
        if (response.ok) {
          const data = await response.json();
          setActivites(data);
        } else {
          console.error('Erreur lors du chargement des activités');
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setIsLoadingActivites(false);
      }
    };

    if (lieuId) {
      fetchActivites();
    }
  }, [lieuId]);

  const handleVoyageClick = (voyageId) => {
    setSelectedVoyageId(voyageId);
  };

  const handleBackFromVoyage = () => {
    setSelectedVoyageId(null);
  };

  const handleActiviteClick = (activiteId) => {
    setSelectedActiviteId(activiteId);
  };

  const handleBackFromActivite = () => {
    setSelectedActiviteId(null);
  };

  if (selectedVoyageId) {
    return (
      <VoyageDetail 
        voyageId={selectedVoyageId} 
        onNavigateBack={handleBackFromVoyage}
      />
    );
  }

  if (selectedActiviteId) {
    return (
      <ActiviteDetail 
        activiteId={selectedActiviteId} 
        onNavigateBack={handleBackFromActivite}
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
                  <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#333', cursor: 'pointer', textDecoration: 'underline'}}
                    onClick={() => {
                      if (voyage.utilisateur?.id) {
                        setViewingUserId(voyage.utilisateur.id);
                        setCurrentPage('Profile');
                      }
                    }}
                  >
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

        {/* Section des activités */}
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
            🎯 Activités disponibles ({activites.length})
          </h2>
          
          {isLoadingActivites ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div>Chargement des activités...</div>
            </div>
          ) : activites.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div>Aucune activité disponible pour ce lieu pour le moment.</div>
              <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                Soyez le premier à proposer une activité !
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {activites.map((activite) => (
                <div
                  key={activite.id}
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
                  {/* En-tête de la card avec titre et note moyenne */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ 
                      margin: '0', 
                      color: '#333',
                      fontSize: '1.2em',
                      flex: 1,
                      marginRight: '15px'
                    }}>
                      🎯 {activite.titre}
                    </h3>
                    {activite.note_moyenne && (
                      <div style={{ 
                        backgroundColor: '#ffd700', 
                        color: '#333',
                        padding: '6px 10px',
                        borderRadius: '20px',
                        fontSize: '0.9em',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap'
                      }}>
                        ⭐ {activite.note_moyenne.toFixed(1)}/5
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{ 
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '0.95em',
                    color: '#495057',
                    lineHeight: '1.4',
                    minHeight: '60px'
                  }}>
                    {activite.description}
                  </div>

                  {/* Détails pratiques de l'activité */}
                  <div style={{ 
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '6px',
                    fontSize: '0.9em'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '8px'
                    }}>
                      {/* Type d'activité */}
                      {activite.type_activite && activite.type_activite !== 'autre' && (
                        <div style={{ 
                          backgroundColor: '#d1ecf1',
                          color: '#0c5460',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          textAlign: 'center',
                          fontSize: '0.8em',
                          fontWeight: '500'
                        }}>
                          🏷️ {activite.type_activite_display}
                        </div>
                      )}
                      
                      {/* Prix */}
                      {activite.prix_estime && (
                        <div style={{ 
                          backgroundColor: '#d4edda',
                          color: '#155724',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          textAlign: 'center',
                          fontSize: '0.8em',
                          fontWeight: '500'
                        }}>
                          💰 {activite.prix_display}
                        </div>
                      )}
                      
                      {/* Âge minimum */}
                      {activite.age_minimum !== null && activite.age_minimum !== undefined && (
                        <div style={{ 
                          backgroundColor: '#fff3cd',
                          color: '#856404',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          textAlign: 'center',
                          fontSize: '0.8em',
                          fontWeight: '500'
                        }}>
                          👶 {activite.age_minimum === 0 ? 'Tous âges' : `${activite.age_minimum}+ ans`}
                        </div>
                      )}
                    </div>
                    
                    {/* Options pratiques */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '10px',
                      marginTop: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {activite.transport_public && (
                        <span style={{ 
                          backgroundColor: '#cce5ff',
                          color: '#004085',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '0.75em'
                        }}>
                          🚌 Transport public
                        </span>
                      )}
                      {activite.reservation_requise && (
                        <span style={{ 
                          backgroundColor: '#f8d7da',
                          color: '#721c24',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '0.75em'
                        }}>
                          📅 Réservation requise
                        </span>
                      )}
                    </div>
                    
                    {/* Adresse précise */}
                    {activite.adresse_precise && (
                      <div style={{ 
                        marginTop: '8px',
                        padding: '6px 8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '0.8em',
                        color: '#6c757d',
                        borderLeft: '3px solid #007bff'
                      }}>
                        📍 {activite.adresse_precise}
                      </div>
                    )}
                    
                    {/* Médias */}
                    {activite.medias && activite.medias.length > 0 && (
                      <div style={{ 
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '6px',
                        border: '1px solid #bbdefb'
                      }}>
                        <div style={{ 
                          fontSize: '0.8em',
                          fontWeight: '500',
                          marginBottom: '6px',
                          color: '#1976d2'
                        }}>
                          📸 Médias ({activite.medias.length})
                        </div>
                        <div style={{ 
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          {activite.medias.slice(0, 3).map((media, index) => (
                            <div key={index} style={{ 
                              fontSize: '0.75em',
                              color: '#1976d2',
                              padding: '2px 6px',
                              backgroundColor: '#bbdefb',
                              borderRadius: '4px'
                            }}>
                              {media.type_media === 'image' ? '🖼️' : '🎥'} {media.titre || `Média ${index + 1}`}
                            </div>
                          ))}
                          {activite.medias.length > 3 && (
                            <div style={{ 
                              fontSize: '0.75em',
                              color: '#1976d2',
                              padding: '2px 6px',
                              backgroundColor: '#bbdefb',
                              borderRadius: '4px'
                            }}>
                              +{activite.medias.length - 3} autres
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informations de l'activité */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    fontSize: '0.9em',
                    color: '#6c757d'
                  }}>
                    <span>👤 Par {activite.cree_par?.username || 'Utilisateur'}</span>
                    <span>📅 {new Date(activite.date_creation).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {/* Statistiques des notes */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    fontSize: '0.9em',
                    color: '#6c757d'
                  }}>
                    <span>
                      📊 {activite.nombre_notes || 0} avis
                    </span>
                    {activite.note_moyenne && (
                      <span style={{ 
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        Note moyenne: {activite.note_moyenne.toFixed(1)}/5
                      </span>
                    )}
                  </div>

                  {/* Bouton pour noter l'activité */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleActiviteClick(activite.id)}
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