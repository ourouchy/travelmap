import React, { useState, useEffect } from 'react';
import Map from './components/Map';

const VoyageDetail = ({ voyageId, onNavigateBack }) => {
  const [voyage, setVoyage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchVoyageDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/api/voyages/${voyageId}/detail_public/`);
        
        if (response.ok) {
          const data = await response.json();
          setVoyage(data);
        } else {
          setError('Erreur lors du chargement des détails du voyage');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    if (voyageId) {
      fetchVoyageDetails();
    }
  }, [voyageId]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Chargement des détails du voyage...</div>
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

  if (!voyage) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>Voyage non trouvé</div>
      </div>
    );
  }

  const images = voyage.medias?.filter(m => m.type_media === 'image') || [];
  const videos = voyage.medias?.filter(m => m.type_media === 'video') || [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openMediaModal = (media) => {
    setSelectedMedia(media);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

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
          ← Retour
        </button>
      </div>

      {/* En-tête avec carte */}
      <div style={{ 
        position: 'relative',
        height: '400px',
        marginBottom: '30px'
      }}>
        <Map
          latitude={voyage.lieu.latitude}
          longitude={voyage.lieu.longitude}
          nom_ville={voyage.lieu.nom_ville}
          pays_nom={voyage.lieu.pays?.nom}
          height="400px"
          width="100%"
          zoom={12}
          showMarker={true}
        />
        
        {/* Overlay avec informations du voyage */}
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
            Voyage à {voyage.lieu.nom_ville}
          </h1>
          <p style={{ 
            fontSize: '1.2em', 
            margin: '10px 0',
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
            opacity: 0.9
          }}>
            par {voyage.utilisateur.username}
          </p>
          {voyage.note && (
            <div style={{ 
              backgroundColor: '#ffd700', 
              color: '#333',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '1.1em',
              fontWeight: 'bold',
              display: 'inline-block',
              marginTop: '10px'
            }}>
              ⭐ {voyage.note}/5
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{ padding: '0 20px' }}>
        {/* Informations du voyage */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Détails du voyage</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <strong>Date de début :</strong> {formatDate(voyage.date_debut)}
            </div>
            <div>
              <strong>Date de fin :</strong> {voyage.date_fin ? formatDate(voyage.date_fin) : 'Non spécifiée'}
            </div>
          </div>

          {voyage.commentaire && (
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Commentaire</h3>
              <p style={{ 
                fontSize: '1.1em', 
                lineHeight: '1.6',
                color: '#495057',
                margin: 0
              }}>
                "{voyage.commentaire}"
              </p>
            </div>
          )}
        </div>

        {/* Médias */}
        {(images.length > 0 || videos.length > 0) && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Médias</h2>
            
            {/* Images */}
            {images.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#495057' }}>Photos ({images.length})</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '15px' 
                }}>
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s'
                      }}
                      onClick={() => openMediaModal(image)}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <img
                        src={image.fichier_url}
                        alt={image.titre || `Image ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vidéos */}
            {videos.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '15px', color: '#495057' }}>Vidéos ({videos.length})</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '20px' 
                }}>
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s'
                      }}
                      onClick={() => openMediaModal(video)}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <video
                        src={video.fichier_url}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                        controls
                        preload="metadata"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informations du lieu */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Lieu visité</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px' 
          }}>
            <div>
              <strong>Ville :</strong> {voyage.lieu.nom_ville}
            </div>
            <div>
              <strong>Pays :</strong> {voyage.lieu.pays.nom}
            </div>
            <div>
              <strong>Coordonnées :</strong> {voyage.lieu.latitude}, {voyage.lieu.longitude}
            </div>
            <div>
              <strong>Date de création :</strong> {formatDate(voyage.lieu.date_creation)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour afficher les médias en grand */}
      {selectedMedia && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={closeMediaModal}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button
              onClick={closeMediaModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 2001
              }}
            >
              ✕
            </button>
            
            {selectedMedia.type_media === 'image' ? (
              <img
                src={selectedMedia.fichier_url}
                alt={selectedMedia.titre || 'Image'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <video
                src={selectedMedia.fichier_url}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            )}
            
            {selectedMedia.titre && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '0',
                color: 'white',
                fontSize: '1.1em',
                fontWeight: 'bold'
              }}>
                {selectedMedia.titre}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoyageDetail; 