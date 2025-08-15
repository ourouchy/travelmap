import React, { useState, useEffect } from 'react';
import Map from './components/Map';

const ActiviteDetail = ({ activiteId, onNavigateBack, onNavigateToLieu, setViewingUserId, setCurrentPage }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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
        setError(null);
        
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
          
          if (token) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const existingNote = data.notes?.find(note => 
              note.utilisateur?.id === userData.id || note.utilisateur === userData.id
            );
            setUserNote(existingNote || null);
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
  }, [activiteId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre avis ?")) return;
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:8000/api/notes-activites/${noteId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setUserNote(null);
        // Recharger les détails de l'activité
        const refreshResponse = await fetch(`http://localhost:8000/api/activites/${activiteId}/`);
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          setActivite(refreshedData);
        }
        alert('Avis supprimé avec succès !');
      } else {
        alert('Erreur lors de la suppression de l\'avis');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = () => {
    if (!userNote) return;
    
    setNoteFormData({
      note: userNote.note,
      commentaire: userNote.commentaire
    });
    setShowNoteForm(true);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    
    if (!noteFormData.note || !noteFormData.commentaire.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('authToken');
      
      const method = userNote ? 'PUT' : 'POST';
      const url = userNote 
        ? `http://localhost:8000/api/notes-activites/${userNote.id}/` 
        : `http://localhost:8000/api/notes-activites/`;
      
      const response = await fetch(url, {
        method: method,
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
        const updatedNote = await response.json();
        setUserNote(updatedNote);
        setShowNoteForm(false);
        setNoteFormData({ note: 5, commentaire: '' });
        
        // Recharger les détails de l'activité
        const refreshResponse = await fetch(`http://localhost:8000/api/activites/${activiteId}/`);
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          setActivite(refreshedData);
        }
        
        alert(userNote ? 'Avis mis à jour avec succès !' : 'Note ajoutée avec succès !');
      } else {
        const errorData = await response.json();
        console.error('Erreur:', errorData);
        alert(errorData.non_field_errors?.[0] || 
             (userNote ? 'Erreur lors de la mise à jour de l\'avis' : 'Erreur lors de l\'ajout de la note'));
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserClick = (userId) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (userId === currentUser.id) {
      setCurrentPage('Profile');
    } else {
      setViewingUserId(userId);
      setCurrentPage('UserPublicProfile');
    }
  };

  const handleLieuClick = (lieuId, lieuData) => {
    if (onNavigateToLieu) {
      onNavigateToLieu(lieuId, lieuData);
    }
  };

  const canRate = isAuthenticated && activite?.can_rate === true;

  const openMediaModal = (media) => {
    const index = allMedias.findIndex(m => m.id === media.id);
    setSelectedMedia(media);
    setCurrentMediaIndex(index);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
    setCurrentMediaIndex(0);
  };

  const navigateMedia = (direction) => {
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentMediaIndex === 0 ? allMedias.length - 1 : currentMediaIndex - 1;
    } else {
      newIndex = currentMediaIndex === allMedias.length - 1 ? 0 : currentMediaIndex + 1;
    }
    setCurrentMediaIndex(newIndex);
    setSelectedMedia(allMedias[newIndex]);
  };

  if (isLoading) {
    return <div className="loading-message">Chargement des détails de l'activité...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!activite) {
    return <div className="error-message">Activité non trouvée</div>;
  }

  const images = activite.medias?.filter(m => m.type_media === 'image') || [];
  const videos = activite.medias?.filter(m => m.type_media === 'video') || [];
  const allMedias = [...images, ...videos];

  return (
    <div>
      <div className="button-group">
        <button onClick={onNavigateBack} className="cancel">
          ← Retour
        </button>
      </div>

      <div className="card">
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
        
        <div className="dashboard-header">
          <div>
            <h1>{activite.titre}</h1>
            <p className="clickable" onClick={() => handleLieuClick(activite.lieu.id, activite.lieu)}>
              {activite.lieu.nom_ville}, {activite.lieu.pays.nom}
            </p>
          </div>
          <div>
            {activite.note_moyenne && (
              <div className="dashboard-rating">
                ⭐ {activite.note_moyenne.toFixed(1)}/5
              </div>
            )}
            <h2>
              Activité de{' '}
              <span
                className="clickable"
                onClick={() => handleUserClick(activite.cree_par?.id)}
                title="Cliquer pour voir le profil"
              >
                {activite.cree_par?.username || 'Utilisateur'}
              </span>
            </h2>
            <p className="voyage-country">Créée le {formatDate(activite.date_creation)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Détails de l'activité</h2>
        <div className="activity-description">
          <p>{activite.description}</p>
        </div>

        <div className="activity-details">
          <h3>Informations pratiques</h3>
          <div className="activity-tags">
            {activite.type_activite && activite.type_activite !== 'autre' && (
              <div className="activity-tag type-tag">
                🏷️ {activite.type_activite_display}
              </div>
            )}
            {activite.prix_estime && (
              <div className="activity-tag price-tag">
                💰 {activite.prix_display}
              </div>
            )}
            {activite.age_minimum !== null && activite.age_minimum !== undefined && (
              <div className="activity-tag age-tag">
                👶 {activite.age_minimum === 0 ? 'Tous âges' : `${activite.age_minimum} ans et plus`}
              </div>
            )}
          </div>

          <div className="activity-options">
            {activite.transport_public && (
              <div className="activity-option transport-option">
                🚌 Transport public
              </div>
            )}
            {activite.reservation_requise && (
              <div className="activity-option reservation-option">
                📅 Réservation obligatoire
              </div>
            )}
          </div>

          {activite.adresse_precise && (
            <div className="activity-address">
              <strong>📍 Adresse :</strong> {activite.adresse_precise}
            </div>
          )}
        </div>

        <div className="lieu-infos">
          <div className="lieu-info">
            <div className="lieu-note">
              {activite.note_moyenne ? activite.note_moyenne.toFixed(1) : 'N/A'}
            </div>
            <div>Note moyenne</div>
          </div>
          <div className="lieu-info">
            <div className="lieu-nb">
              {activite.nombre_notes || 0}
            </div>
            <div>Avis</div>
          </div>
        </div>
      </div>

      {(images.length > 0 || videos.length > 0) && (
        <div className="card">
          <h2>Médias</h2>
          {images.length > 0 && (
            <div className="media-preview-section">
              <h3 className="section-header">Photos ({images.length})</h3>
              <div className="media-preview-grid">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="media-preview-item card-hover"
                    onClick={() => openMediaModal(image)}
                  >
                    <img
                      src={image.fichier_url}
                      alt={image.titre || `Image ${index + 1}`}
                      className="media-preview-image"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="media-preview-section">
              <h3 className="section-header">Vidéos ({videos.length})</h3>
              <div className="media-preview-grid">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="media-preview-item card-hover"
                    onClick={() => openMediaModal(video)}
                  >
                    <video
                      src={video.fichier_url}
                      className="media-preview-video-placeholder"
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

      <div className="card">
        <h2>💬 Avis et commentaires ({activite.notes?.length || 0})</h2>
        
        {isAuthenticated && (
          <div className="notation-section">
            {showNoteForm && (
              <div className="loading-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h2 className="section-title" style={{ margin: 0 }}>
                      {userNote ? '✏️ Modifier votre avis' : '⭐ Ajouter un avis'}
                    </h2>
                    <button onClick={() => setShowNoteForm(false)} className="close">
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleNoteSubmit}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label">⭐ Note *</label>
                      <select
                        name="note"
                        value={noteFormData.note}
                        onChange={(e) => setNoteFormData(prev => ({ ...prev, note: parseInt(e.target.value) }))}
                        required
                        className="input"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ 5 - Exceptionnel</option>
                        <option value={4}>⭐⭐⭐⭐ 4 - Très bien</option>
                        <option value={3}>⭐⭐⭐ 3 - Bien</option>
                        <option value={2}>⭐⭐ 2 - Moyen</option>
                        <option value={1}>⭐ 1 - Décevant</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '25px' }}>
                      <label className="form-label">📝 Commentaire *</label>
                      <textarea
                        name="commentaire"
                        value={noteFormData.commentaire}
                        onChange={(e) => setNoteFormData(prev => ({ ...prev, commentaire: e.target.value }))}
                        required
                        rows="4"
                        placeholder="Partagez votre expérience, vos impressions, conseils..."
                        className="input textarea"
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setShowNoteForm(false)}
                        className="cancel"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={isSubmitting ? "disabled" : ""}
                      >
                        {isSubmitting ? '⏳ Envoi...' : (userNote ? '✏️ Mettre à jour' : '⭐ Publier mon avis')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {!showNoteForm && isAuthenticated && (
              <div className="user-note-actions">
                {canRate && !userNote && (
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="button"
                  >
                    ⭐ Ajouter un avis
                  </button>
                )}
                {userNote && (
                  <>
                    <button
                      onClick={handleEditNote}
                      className="button"
                      style={{marginRight: '10px'}}
                    >
                      ✏️ Modifier mon avis
                    </button>
                    <button
                      onClick={() => handleDeleteNote(userNote.id)}
                      className="button cancel"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '⏳ Suppression...' : '🗑️ Supprimer mon avis'}
                    </button>
                  </>
                )}
              </div>
            )}

            {isAuthenticated && !canRate && !userNote && (
              <div className="info-message">
                <p>
                  <strong>ℹ️ Information :</strong> 
                  {JSON.parse(localStorage.getItem('user') || '{}').username === activite.cree_par?.username
                    ? " Vous ne pouvez pas noter votre propre activité."
                    : " Vous devez avoir visité ce lieu pour pouvoir noter ses activités."}
                </p>
              </div>
            )}
          </div>
        )}

        {activite.notes && activite.notes.length > 0 ? (
          <div className="voyage-list">
            {activite.notes.map((note, index) => (
              <div key={note.id || index} className="media-block">
                <div className="dashboard-header">
                  <div 
                    className="dashboard-title clickable"
                    onClick={() => note.utilisateur?.id && handleUserClick(note.utilisateur.id)}
                    title="Cliquer pour voir le profil"
                  >
                    {note.utilisateur?.username || 'Utilisateur'}
                  </div>
                  <div className="dashboard-rating">
                    ⭐ {note.note}/5
                  </div>
                </div>

                {note.commentaire && (
                  <p className="voyage-comment">
                    "{note.commentaire}"
                  </p>
                )}

                <div className="voyage-creation-date">
                  📅 {formatDate(note.date_creation)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-section">
            <p>Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
          </div>
        )}
      </div>

      {selectedMedia && (
        <div className="media-modal-overlay" onClick={closeMediaModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="media-modal-header">
              <button onClick={closeMediaModal} className="close">
                ✕
              </button>
            </div>
            
            <div className="media-modal-content">
              {allMedias.length > 1 && (
                <button 
                  className="media-modal-nav media-modal-nav-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMedia('prev');
                  }}
                >
                  <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
                    <path d="M20 .755l-14.374 11.245 14.374 11.219-.619.781-15.381-12 15.391-12 .609.755z" transform="scale(-1, 1)"/>
                  </svg>
                </button>
              )}
              
              <div className="media-modal-display">
                {selectedMedia.type_media === 'image' ? (
                  <img
                    src={selectedMedia.fichier_url}
                    alt={selectedMedia.titre || 'Image'}
                    className="media-modal-image"
                  />
                ) : (
                  <video
                    src={selectedMedia.fichier_url}
                    controls
                    autoPlay
                    className="media-modal-video"
                  />
                )}
              </div>
              
              {allMedias.length > 1 && (
                <button 
                  className="media-modal-nav media-modal-nav-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMedia('next');
                  }}
                >
                  <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
                    <path d="M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z"/>
                  </svg>
                </button>
              )}
            </div>
            
            {selectedMedia.titre && (
              <div className="media-modal-footer">
                {selectedMedia.titre} ({currentMediaIndex + 1}/{allMedias.length})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiviteDetail;