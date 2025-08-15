import React, { useState, useEffect } from 'react';
import Map from './components/Map';

const ActiviteDetail = ({ activiteId, onNavigateBack, setViewingUserId, setCurrentPage }) => {
  const [activite, setActivite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userNote, setUserNote] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteFormData, setNoteFormData] = useState({
    note: 5,
    commentaire: ''
  });
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const fetchActiviteDetails = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer le token JWT pour l'authentification
        const token = localStorage.getItem('authToken');
        const headers = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:8000/api/activites/${activiteId}/`, {
          headers: headers
        });
        
        if (response.ok) {
          const data = await response.json();
          setActivite(data);
          
          // Vérifier si l'utilisateur a déjà noté cette activité
          if (isAuthenticated) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const existingNote = data.notes?.find(note => 
              note.utilisateur?.id === userData.id || note.utilisateur === userData.id
            );
            if (existingNote) {
              setUserNote(existingNote);
            }
          }
        } else {
          setError('Erreur lors du chargement des détails de l\'activité');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    if (activiteId) {
      fetchActiviteDetails();
    }
  }, [activiteId, isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Chargement des détails de l'activité...</div>
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

  if (!activite) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>Activité non trouvée</div>
      </div>
    );
  }

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

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    
    if (!noteFormData.note || !noteFormData.commentaire.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Vérification de sécurité supplémentaire
    if (!canRate) {
      alert('Vous n\'avez pas les permissions pour noter cette activité');
      return;
    }

    try {
      setIsSubmittingNote(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:8000/api/notes-activites/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activite: activiteId,
          note: noteFormData.note,
          commentaire: noteFormData.commentaire.trim()
        })
      });

      if (response.ok) {
        const newNote = await response.json();
        setUserNote(newNote);
        setShowNoteForm(false);
        setNoteFormData({ note: 5, commentaire: '' });
        
        // Recharger les détails de l'activité pour mettre à jour les statistiques
        const refreshResponse = await fetch(`http://localhost:8000/api/activites/${activiteId}/`);
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          setActivite(refreshedData);
        }
        
        alert('Note ajoutée avec succès !');
      } else {
        const errorData = await response.json();
        console.error('Erreur création note:', errorData);
        alert('Erreur lors de l\'ajout de la note');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const canUserRate = activite.can_rate && isAuthenticated;

  // Vérifier si l'utilisateur peut noter cette activité
  const checkCanUserRate = () => {
    if (!isAuthenticated) return false;
    
    // Vérifier si l'utilisateur a déjà noté
    if (userNote) return false;
    
    // Utiliser la logique du backend via le champ can_rate
    console.log('🔍 DEBUG Frontend:', {
      activiteId: activiteId,
      can_rate: activite.can_rate,
      userNote: userNote,
      isAuthenticated: isAuthenticated,
      lieu: activite.lieu?.nom_ville
    });
    
    return activite.can_rate === true;
  };

  const canRate = checkCanUserRate();

  // Déterminer le type de message à afficher
  const getMessageType = () => {
    console.log('🔍 DEBUG Message Type:', {
      userNote: userNote,
      can_rate: activite.can_rate,
      canRate: canRate
    });
    
    if (userNote) return 'already_rated';
    if (activite.can_rate === false) return 'cannot_rate';
    if (activite.can_rate === true) return 'can_rate';
    return 'unknown';
  };

  const messageType = getMessageType();

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
          latitude={activite.lieu.latitude}
          longitude={activite.lieu.longitude}
          nom_ville={activite.lieu.nom_ville}
          pays_nom={activite.lieu.pays?.nom}
          height="400px"
          width="100%"
          zoom={12}
          showMarker={true}
        />
        
        {/* Overlay avec informations de l'activité */}
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
            {activite.titre}
          </h1>
          <p style={{ 
            fontSize: '1.2em', 
            margin: '10px 0',
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
            opacity: 0.9
          }}>
            à {activite.lieu.nom_ville}, {activite.lieu.pays.nom}
          </p>
          {activite.note_moyenne && (
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
              ⭐ {activite.note_moyenne.toFixed(1)}/5
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{ padding: '0 20px' }}>
        {/* Informations de l'activité */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Détails de l'activité</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px', color: '#495057' }}>Description</h3>
            <p style={{ 
              fontSize: '1.1em', 
              lineHeight: '1.6',
              color: '#495057',
              margin: 0,
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {activite.description}
            </p>
          </div>

          {/* Détails pratiques de l'activité */}
          {(activite.prix_estime || activite.age_minimum || activite.type_activite !== 'autre' || 
            activite.adresse_precise || activite.transport_public || activite.reservation_requise) && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Informations pratiques</h3>
              <div style={{ 
                padding: '20px',
                backgroundColor: '#e8f5e8',
                borderRadius: '8px',
                border: '1px solid #c3e6c3'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px'
                }}>
                  {/* Type d'activité */}
                  {activite.type_activite && activite.type_activite !== 'autre' && (
                    <div>
                      <strong style={{ color: '#0c5460' }}>🏷️ Type :</strong>
                      <div style={{ 
                        backgroundColor: '#d1ecf1',
                        color: '#0c5460',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginTop: '5px',
                        fontSize: '0.9em',
                        fontWeight: '500'
                      }}>
                        {activite.type_activite_display}
                      </div>
                    </div>
                  )}
                  
                  {/* Prix */}
                  {activite.prix_estime && (
                    <div>
                      <strong style={{ color: '#155724' }}>💰 Prix :</strong>
                      <div style={{ 
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginTop: '5px',
                        fontSize: '0.9em',
                        fontWeight: '500'
                      }}>
                        {activite.prix_display}
                      </div>
                    </div>
                  )}
                  
                  {/* Âge minimum */}
                  {activite.age_minimum !== null && activite.age_minimum !== undefined && (
                    <div>
                      <strong style={{ color: '#856404' }}>👶 Âge minimum :</strong>
                      <div style={{ 
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginTop: '5px',
                        fontSize: '0.9em',
                        fontWeight: '500'
                      }}>
                        {activite.age_minimum === 0 ? 'Tous âges' : `${activite.age_minimum} ans et plus`}
                      </div>
                    </div>
                  )}
                  
                  {/* Transport public */}
                  {activite.transport_public && (
                    <div>
                      <strong style={{ color: '#004085' }}>🚌 Accès :</strong>
                      <div style={{ 
                        backgroundColor: '#cce5ff',
                        color: '#004085',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginTop: '5px',
                        fontSize: '0.9em',
                        fontWeight: '500'
                      }}>
                        Transport public disponible
                      </div>
                    </div>
                  )}
                  
                  {/* Réservation requise */}
                  {activite.reservation_requise && (
                    <div>
                      <strong style={{ color: '#721c24' }}>📅 Réservation :</strong>
                      <div style={{ 
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginTop: '5px',
                        fontSize: '0.9em',
                        fontWeight: '500'
                      }}>
                        Obligatoire
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Adresse précise */}
                {activite.adresse_precise && (
                  <div style={{ marginTop: '15px' }}>
                    <strong style={{ color: '#007bff' }}>📍 Adresse précise :</strong>
                    <div style={{ 
                      marginTop: '5px',
                      padding: '10px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '0.9em',
                      color: '#6c757d',
                      borderLeft: '3px solid #007bff'
                    }}>
                      {activite.adresse_precise}
                    </div>
                  </div>
                )}
                
                {/* Médias */}
                {(activite.medias?.filter(m => m.type_media === 'image').length > 0 || 
                  activite.medias?.filter(m => m.type_media === 'video').length > 0) && (
                  <div style={{ 
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <h2 style={{ marginBottom: '20px', color: '#333' }}>Médias</h2>
                    
                    {/* Images */}
                    {activite.medias?.filter(m => m.type_media === 'image').length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ marginBottom: '15px', color: '#495057' }}>
                          Photos ({activite.medias.filter(m => m.type_media === 'image').length})
                        </h3>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                          gap: '15px' 
                        }}>
                          {activite.medias
                            .filter(m => m.type_media === 'image')
                            .map((image, index) => (
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
                    {activite.medias?.filter(m => m.type_media === 'video').length > 0 && (
                      <div>
                        <h3 style={{ marginBottom: '15px', color: '#495057' }}>
                          Vidéos ({activite.medias.filter(m => m.type_media === 'video').length})
                        </h3>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                          gap: '20px' 
                        }}>
                          {activite.medias
                            .filter(m => m.type_media === 'video')
                            .map((video, index) => (
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
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <strong>Créée par :</strong> {activite.cree_par?.username || 'Utilisateur'}
            </div>
            <div>
              <strong>Date de création :</strong> {formatDate(activite.date_creation)}
            </div>
            <div>
              <strong>Lieu :</strong> {activite.lieu.nom_ville}, {activite.lieu.pays.nom}
            </div>
            <div>
              <strong>Coordonnées :</strong> {activite.lieu.latitude}, {activite.lieu.longitude}
            </div>
          </div>

          {/* Statistiques */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '40px',
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ffd700' }}>
                {activite.note_moyenne ? activite.note_moyenne.toFixed(1) : 'N/A'}
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>Note moyenne</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1976d2' }}>
                {activite.nombre_notes || 0}
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>Avis</div>
            </div>
          </div>
        </div>

        {/* Section notation */}
        {isAuthenticated && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>
              {userNote ? 'Votre note' : 'Noter cette activité'}
            </h2>
            
            {userNote ? (
              <div style={{ 
                backgroundColor: '#e8f5e8',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #c3e6c3'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    backgroundColor: '#ffd700', 
                    color: '#333',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '1.1em',
                    fontWeight: 'bold'
                  }}>
                    ⭐ {userNote.note}/5
                  </div>
                  <span style={{ color: '#666', fontSize: '0.9em' }}>
                    {formatDate(userNote.date_creation)}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '1em', 
                  lineHeight: '1.5',
                  color: '#495057',
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  "{userNote.commentaire}"
                </p>
              </div>
            ) : canRate ? (
              <div>
                <p style={{ marginBottom: '20px', color: '#666' }}>
                  Partagez votre expérience en notant cette activité !
                </p>
                <button
                  onClick={() => setShowNoteForm(true)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  ⭐ Noter cette activité
                </button>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: '#fff3cd',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ffeaa7',
                color: '#856404'
              }}>
                <p style={{ margin: 0 }}>
                  <strong>ℹ️ Information :</strong> 
                  {messageType === 'already_rated' ? 
                    "Vous avez déjà noté cette activité." : 
                    messageType === 'cannot_rate' && isAuthenticated && JSON.parse(localStorage.getItem('user') || '{}').username === activite.cree_par?.username ?
                    "Vous ne pouvez pas noter votre propre activité." :
                    "Vous devez avoir visité ce lieu pour pouvoir noter ses activités."
                  }
                </p>
                {messageType === 'already_rated' && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', opacity: 0.8 }}>
                    Chaque utilisateur ne peut noter une activité qu'une seule fois.
                  </p>
                )}
                {messageType === 'cannot_rate' && isAuthenticated && JSON.parse(localStorage.getItem('user') || '{}').username === activite.cree_par?.username && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', opacity: 0.8 }}>
                    Les créateurs ne peuvent pas noter leurs propres activités.
                  </p>
                )}
                {messageType === 'cannot_rate' && (!isAuthenticated || JSON.parse(localStorage.getItem('user') || '{}').username !== activite.cree_par?.username) && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', opacity: 0.8 }}>
                    Créez d'abord un voyage dans ce lieu pour pouvoir noter ses activités.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Liste des notes et commentaires */}
        {activite.notes && activite.notes.length > 0 && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>
              💬 Avis et commentaires ({activite.notes.length})
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gap: '20px' 
            }}>
              {activite.notes.map((note, index) => (
                <div
                  key={note.id || index}
                  style={{
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    position: 'relative'
                  }}
                >
                  {/* Indicateur si c'est la note de l'utilisateur connecté */}
                  {isAuthenticated && userNote && note.id === userNote.id && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8em',
                      fontWeight: 'bold'
                    }}>
                      Votre avis
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <div 
                      style={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.1em', 
                        color: '#007bff',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      onClick={() => {
                        if (note.utilisateur?.id) {
                          setViewingUserId(note.utilisateur.id);
                          setCurrentPage('UserPublicProfile');
                        }
                      }}
                      title="Cliquer pour voir le profil"
                    >
                      {note.utilisateur?.username || 'Utilisateur'}
                    </div>
                    <div style={{ 
                      backgroundColor: '#ffd700', 
                      color: '#333',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.9em',
                      fontWeight: 'bold'
                    }}>
                      ⭐ {note.note}/5
                    </div>
                  </div>

                  {note.commentaire && (
                    <div style={{ 
                      fontSize: '1em', 
                      lineHeight: '1.5',
                      color: '#495057',
                      margin: '0 0 15px 0',
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      fontStyle: 'italic'
                    }}>
                      "{note.commentaire}"
                    </div>
                  )}

                  <div style={{ 
                    fontSize: '0.9em',
                    color: '#6c757d',
                    textAlign: 'right'
                  }}>
                    📅 {formatDate(note.date_creation)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si aucune note */}
        {(!activite.notes || activite.notes.length === 0) && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>
              💬 Avis et commentaires
            </h2>
            <div style={{ 
              color: '#6c757d',
              fontSize: '1.1em',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              Aucun avis pour le moment. Soyez le premier à partager votre expérience !
            </div>
          </div>
        )}
      </div>

      {/* Modal pour ajouter une note */}
      {showNoteForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>
                ⭐ Noter cette activité
              </h2>
              <button
                onClick={() => setShowNoteForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5em',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNoteSubmit}>
              {/* Note */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  ⭐ Note *
                </label>
                <select
                  name="note"
                  value={noteFormData.note}
                  onChange={(e) => setNoteFormData(prev => ({ ...prev, note: parseInt(e.target.value) }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ 5 - Exceptionnel</option>
                  <option value={4}>⭐⭐⭐⭐ 4 - Très bien</option>
                  <option value={3}>⭐⭐⭐ 3 - Bien</option>
                  <option value={2}>⭐⭐ 2 - Moyen</option>
                  <option value={1}>⭐ 1 - Décevant</option>
                </select>
              </div>

              {/* Commentaire */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  📝 Commentaire *
                </label>
                <textarea
                  name="commentaire"
                  value={noteFormData.commentaire}
                  onChange={(e) => setNoteFormData(prev => ({ ...prev, commentaire: e.target.value }))}
                  required
                  rows="4"
                  placeholder="Partagez votre expérience, vos impressions, conseils..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Boutons d'action */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowNoteForm(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1em'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSubmittingNote ? 'not-allowed' : 'pointer',
                    fontSize: '1em',
                    opacity: isSubmittingNote ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmittingNote) e.target.style.backgroundColor = '#218838';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmittingNote) e.target.style.backgroundColor = '#28a745';
                  }}
                >
                  {isSubmittingNote ? '⏳ Envoi...' : '⭐ Envoyer la note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default ActiviteDetail; 