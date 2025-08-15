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
  const [showVoyageForm, setShowVoyageForm] = useState(false);
  const [showActiviteForm, setShowActiviteForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreview, setFilePreview] = useState([]);
  const [hasVoyageAtThisLieu, setHasVoyageAtThisLieu] = useState(false);
  const [displayedVoyagesCount, setDisplayedVoyagesCount] = useState(3);
  const [displayedActivitesCount, setDisplayedActivitesCount] = useState(3);
  
  // Nouveau state pour les favoris
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  
  // États pour le formulaire de voyage
  const [voyageFormData, setVoyageFormData] = useState({
    lieu_id: '',
    lieu_nom: '',
    lieu_data: null,
    date_debut: '',
    date_fin: '',
    note: '',
    commentaire: ''
  });

  // États pour le formulaire d'activité
  const [activiteFormData, setActiviteFormData] = useState({
    titre: '',
    description: '',
    lieu_id: lieuId,
    prix_estime: '',
    age_minimum: '',
    type_activite: 'autre',
    adresse_precise: '',
    transport_public: false,
    reservation_requise: false,
    medias: []
  });

  // Charger les détails du lieu avec ses voyages
  useEffect(() => {
  const fetchLieuDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Préparer les headers avec le token si disponible
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8000/api/lieux/${lieuId}/detail/`, {
        headers: headers
      });
      
        if (response.ok) {
          const data = await response.json();
          setLieuDetails(data);
          
          // Synchroniser l'état des favoris avec la réponse de l'API
          setIsFavorite(data.is_favori === true);

        // Vérifier si l'utilisateur a déjà un voyage à ce lieu
        if (token && user.id) {
          const userVoyages = data.user_voyages || [];
          const hasVoyage = userVoyages.some(voyage => voyage.utilisateur?.id === user.id);
          setHasVoyageAtThisLieu(hasVoyage);
        }
          // Pré-remplir les données du lieu dans le formulaire de voyage
          setVoyageFormData(prev => ({
            ...prev,
            lieu_id: data.id,
            lieu_nom: `${data.nom_ville}, ${data.pays.nom}`,
            lieu_data: {
              nom_ville: data.nom_ville,
              pays_code: data.pays.code_iso,
              geoname_id: data.geoname_id,
              latitude: data.latitude,
              longitude: data.longitude,
              pays_nom: data.pays.nom
            }
          }));
          
          // Pré-remplir le lieu_id dans le formulaire d'activité
          setActiviteFormData(prev => ({
            ...prev,
            lieu_id: data.id
          }));
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

  // Gestion des fichiers pour les formulaires
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    const previews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return {
          file,
          preview: URL.createObjectURL(file),
          type: 'image'
        };
      } else if (file.type.startsWith('video/')) {
        return {
          file,
          preview: null,
          type: 'video'
        };
      }
      return null;
    }).filter(Boolean);
    
    setFilePreview(previews);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreview.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setFilePreview(newPreviews);
    
    if (filePreview[index]?.preview) {
      URL.revokeObjectURL(filePreview[index].preview);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    filePreview.forEach(preview => {
      if (preview?.preview) {
        URL.revokeObjectURL(preview.preview);
      }
    });
    setFilePreview([]);
  };

  // Création d'un voyage
  const handleCreateVoyage = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Vous devez être connecté pour créer un voyage');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('lieu_id', lieuId);
      formDataToSend.append('date_debut', voyageFormData.date_debut);
      if (voyageFormData.date_fin) formDataToSend.append('date_fin', voyageFormData.date_fin);
      if (voyageFormData.note) formDataToSend.append('note', voyageFormData.note);
      if (voyageFormData.commentaire) formDataToSend.append('commentaire', voyageFormData.commentaire);
      
      selectedFiles.forEach((file, index) => {
        formDataToSend.append('medias', file);
      });

      const response = await fetch('http://localhost:8000/api/voyages/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const newVoyage = await response.json();
        console.log('Voyage créé:', newVoyage);
        
        // Réinitialiser le formulaire
        setVoyageFormData({
          lieu_id: lieuId,
          lieu_nom: `${lieuDetails.nom_ville}, ${lieuDetails.pays.nom}`,
          lieu_data: {
            nom_ville: lieuDetails.nom_ville,
            pays_code: lieuDetails.pays.code_iso,
            geoname_id: lieuDetails.geoname_id,
            latitude: lieuDetails.latitude,
            longitude: lieuDetails.longitude,
            pays_nom: lieuDetails.pays.nom
          },
          date_debut: '',
          date_fin: '',
          note: '',
          commentaire: ''
        });
        clearFiles();
        setShowVoyageForm(false);
        setHasVoyageAtThisLieu(true);

        // Recharger les détails du lieu
        const detailsResponse = await fetch(`http://localhost:8000/api/lieux/${lieuId}/detail/`);
        if (detailsResponse.ok) {
          setLieuDetails(await detailsResponse.json());
        }
        
        alert('Voyage créé avec succès !');
      } else {
        const errorData = await response.json();
        console.error('Erreur création voyage:', errorData);
        setError(`Erreur lors de la création du voyage: ${errorData.detail || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion lors de la création du voyage');
    } finally {
      setIsLoading(false);
    }
  };

  // Création d'une activité
  const handleCreateActivite = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Vous devez être connecté pour créer une activité');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('titre', activiteFormData.titre.trim());
      formDataToSend.append('description', activiteFormData.description.trim());
      formDataToSend.append('lieu_id', lieuId);
      
      if (activiteFormData.prix_estime) {
        formDataToSend.append('prix_estime', activiteFormData.prix_estime);
      }
      if (activiteFormData.age_minimum !== '') {
        formDataToSend.append('age_minimum', activiteFormData.age_minimum);
      }
      if (activiteFormData.type_activite && activiteFormData.type_activite !== 'autre') {
        formDataToSend.append('type_activite', activiteFormData.type_activite);
      }
      if (activiteFormData.adresse_precise.trim()) {
        formDataToSend.append('adresse_precise', activiteFormData.adresse_precise.trim());
      }
      formDataToSend.append('transport_public', activiteFormData.transport_public);
      formDataToSend.append('reservation_requise', activiteFormData.reservation_requise);
      
      selectedFiles.forEach((file, index) => {
        formDataToSend.append('medias', file);
      });

      const response = await fetch('http://localhost:8000/api/activites/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const newActivite = await response.json();
        console.log('Activité créée:', newActivite);
        
        // Réinitialiser le formulaire
        setActiviteFormData({
          titre: '',
          description: '',
          lieu_id: lieuId,
          prix_estime: '',
          age_minimum: '',
          type_activite: 'autre',
          adresse_precise: '',
          transport_public: false,
          reservation_requise: false,
          medias: []
        });
        clearFiles();
        setShowActiviteForm(false);
        
        // Recharger les activités
        const activitesResponse = await fetch(`http://localhost:8000/api/activites/?lieu_id=${lieuId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (activitesResponse.ok) {
          setActivites(await activitesResponse.json());
        }
        
        alert('Activité créée avec succès !');
      } else {
        const errorData = await response.json();
        console.error('Erreur création activité:', errorData);
        setError(`Erreur lors de la création de l'activité: ${errorData.detail || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion lors de la création de l\'activité');
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion des changements dans les formulaires
  const handleVoyageInputChange = (e) => {
    const { name, value } = e.target;
    setVoyageFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActiviteInputChange = (e) => {
    const { name, value } = e.target;
    setActiviteFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Navigation entre les vues
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

  const showMoreVoyages = () => {
    setDisplayedVoyagesCount(prev => prev + 3);
  };

  const showLessVoyages = () => {
    setDisplayedVoyagesCount(prev => Math.max(3, prev - 3));
  };

  const showMoreActivites = () => {
    setDisplayedActivitesCount(prev => prev + 3);
  };

  const showLessActivites = () => {
    setDisplayedActivitesCount(prev => Math.max(3, prev - 3));
  };

const ArrowUpSVG = () => (
<svg className="SVG" width="30" height="30" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path fill="currentColor" stroke="currentColor" strokeWidth="1.5" d="M23.245 20l-11.245-14.374-11.219 14.374-.781-.619 12-15.381 12 15.391-.755.609z"/></svg>
);

const ArrowDownSVG = () => (
<svg className="SVG" width="30" height="30" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path fill="currentColor" stroke="currentColor" strokeWidth="1.5" d="M23.245 4l-11.245 14.374-11.219-14.374-.781.619 12 15.381 12-15.391-.755-.609z"/></svg>);

  // Nouvelles fonctions pour la gestion des favoris
  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Connectez-vous pour gérer vos favoris');
      return;
    }

    try {
      setIsFavoriteLoading(true);
      if (isFavorite) {
        await removeFavorite();
      } else {
        await addFavorite();
      }
    } catch (error) {
      setError('Erreur lors de la gestion du favori');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const addFavorite = async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:8000/api/favoris/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lieu_id: lieuId })
    });

    if (response.ok) {
      setIsFavorite(true);
      // Mettre à jour les détails du lieu pour refléter le changement
      const detailsResponse = await fetch(`http://localhost:8000/api/lieux/${lieuId}/detail/`);
      if (detailsResponse.ok) {
        const updatedDetails = await detailsResponse.json();
        setLieuDetails(updatedDetails);
      }
    } else {
      throw new Error('Erreur lors de l\'ajout aux favoris');
    }
  };

  const removeFavorite = async () => {
    const token = localStorage.getItem('authToken');
    
    // D'abord récupérer l'ID du favori
    const favorisResponse = await fetch('http://localhost:8000/api/favoris/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (favorisResponse.ok) {
      const favoris = await favorisResponse.json();
      const favori = favoris.find(f => f.lieu.id === lieuId);
      
      if (favori) {
        const deleteResponse = await fetch(`http://localhost:8000/api/favoris/${favori.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (deleteResponse.ok) {
          setIsFavorite(false);
          // Mettre à jour les détails du lieu pour refléter le changement
          const detailsResponse = await fetch(`http://localhost:8000/api/lieux/${lieuId}/detail/`);
          if (detailsResponse.ok) {
            const updatedDetails = await detailsResponse.json();
            setLieuDetails(updatedDetails);
          }
        } else {
          throw new Error('Erreur lors de la suppression du favori');
        }
      }
    } else {
      throw new Error('Erreur lors de la récupération des favoris');
    }
  };

  // Vues conditionnelles
  if (selectedVoyageId) {
    return (
      <VoyageDetail 
        voyageId={selectedVoyageId} 
        onNavigateBack={handleBackFromVoyage}
        setViewingUserId={setViewingUserId}
        setCurrentPage={setCurrentPage}
      />
    );
  }

  if (selectedActiviteId) {
    return (
      <ActiviteDetail 
        activiteId={selectedActiviteId} 
        onNavigateBack={handleBackFromActivite}
        setViewingUserId={setViewingUserId}
        setCurrentPage={setCurrentPage}
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
    <div>
      <div className="button-group">
        <button className="cancel" onClick={onNavigateBack}>← Retour</button>
        <button onClick={() => setShowVoyageForm(true)}>➕ Ajouter un voyage</button>
        <button 
          onClick={() => setShowActiviteForm(true)}
          disabled={!hasVoyageAtThisLieu}
          className={!hasVoyageAtThisLieu ? 'disabled' : ''}
          title={!hasVoyageAtThisLieu ? "Vous devez d'abord créer un voyage à ce lieu" : ""}
        >
          ➕ Ajouter une activité
        </button>
        {lieuDetails.is_favori !== undefined && (
          <button 
            className={`fav ${isFavoriteLoading ? 'loading' : ''}`}
            onClick={handleToggleFavorite}
            disabled={isFavoriteLoading}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isFavoriteLoading ? (
              <span>⏳</span>
            ) : isFavorite ? (
              <span>❤️</span>
            ) : (
              <span>🤍</span>
            )}
          </button>
        )}
      </div>

      {/* En-tête du lieu avec carte */}
      <div className="card" style={{ marginTop: '80px' }}>
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
        <div>
          <h1>{lieuDetails.nom_ville || 'Lieu'}</h1>
          <div>
            <div>
              {lieuDetails.pays && ( <p>{lieuDetails.pays.nom}</p>)}
            </div>
            <div>{lieuDetails.latitude && lieuDetails.longitude && (
              <p>📍 {lieuDetails.latitude}, {lieuDetails.longitude}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de voyage modal */}
      {showVoyageForm && (
        <div className="loading-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="section-title" style={{ margin: 0 }}>
                ✈️ Nouveau Voyage
              </h2>
              <button onClick={() => setShowVoyageForm(false)} className="close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoyage}>
              {/* Destination (read-only) */}
              <div className="form-group">
                <label className="form-label">🌍 Destination</label>
                <input
                  type="text"
                  className="input disabled-input"
                  value={`${lieuDetails.nom_ville}, ${lieuDetails.pays.nom}`}
                  readOnly
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">📅 Date de début *</label>
                  <input
                    type="date"
                    className="input"
                    name="date_debut"
                    value={voyageFormData.date_debut}
                    onChange={handleVoyageInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">📅 Date de fin (optionnel)</label>
                  <input
                    type="date"
                    className="input"
                    name="date_fin"
                    value={voyageFormData.date_fin}
                    onChange={handleVoyageInputChange}
                    min={voyageFormData.date_debut}
                  />
                </div>
              </div>

              {/* Note */}
              <div className="form-group">
                <label className="form-label">⭐ Note (optionnel)</label>
                <select
                  className="input"
                  name="note"
                  value={voyageFormData.note}
                  onChange={handleVoyageInputChange}
                >
                  <option value="">Sélectionner une note</option>
                  <option value="1">⭐ 1 - Très décevant</option>
                  <option value="2">⭐⭐ 2 - Décevant</option>
                  <option value="3">⭐⭐⭐ 3 - Moyen</option>
                  <option value="4">⭐⭐⭐⭐ 4 - Bien</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                </select>
              </div>

              {/* Commentaire */}
              <div className="form-group">
                <label className="form-label">📝 Commentaire (optionnel)</label>
                <textarea
                  className="input textarea"
                  name="commentaire"
                  value={voyageFormData.commentaire}
                  onChange={handleVoyageInputChange}
                  placeholder="Partagez vos impressions sur ce voyage..."
                  rows="4"
                />
              </div>

              {/* Médias */}
              <div className="form-group">
                <label className="form-label">📸 Photos et vidéos (optionnel)</label>
                <div className="file-upload-area"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    const files = Array.from(e.dataTransfer.files);
                    setSelectedFiles(prev => [...prev, ...files]);
                    handleFileSelect({ target: { files } });
                  }}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    📁 Cliquez pour sélectionner des fichiers
                  </label>
                  <p className="file-upload-hint">
                    ou glissez-déposez vos fichiers ici
                  </p>
                </div>

                {/* Prévisualisation des fichiers */}
                {filePreview.length > 0 && (
                  <div className="media-preview-section">
                    <div className="media-preview-grid">
                      {filePreview.map((preview, index) => (
                        <div key={index} className="media-preview-item">
                          {preview.type === 'image' && preview.preview ? (
                            <img
                              src={preview.preview}
                              alt={`Preview ${index + 1}`}
                              className="media-preview-image"
                            />
                          ) : (
                            <div className="media-preview-video-placeholder">
                              🎥 Vidéo
                            </div>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="media-preview-remove-button"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button" 
                      onClick={clearFiles} 
                      className="delete" 
                      style={{ marginTop: '10px' }}
                    >
                      Effacer tous les fichiers
                    </button>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowVoyageForm(false)} 
                  className="cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !voyageFormData.date_debut}
                  className={`auth-button ${isLoading ? 'disabled' : ''}`}
                >
                  {isLoading ? '⏳ Création...' : '✈️ Créer le voyage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire d'activité modal */}
      {showActiviteForm && (
        <div className="loading-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="section-title" style={{ margin: 0 }}>
                ✨ Nouvelle Activité
              </h2>
              <button onClick={() => setShowActiviteForm(false)} className="close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateActivite}>
              {/* Destination (read-only) */}
              <div className="form-group">
                <label className="form-label">🏙️ Destination</label>
                <input
                  type="text"
                  className="input disabled-input"
                  value={`${lieuDetails.nom_ville}, ${lieuDetails.pays.nom}`}
                  readOnly
                />
              </div>

              {/* Titre de l'activité */}
              <div className="form-group">
                <label className="form-label">🎯 Titre de l'activité *</label>
                <input
                  type="text"
                  className="input"
                  name="titre"
                  value={activiteFormData.titre}
                  onChange={handleActiviteInputChange}
                  required
                  placeholder="Ex: Visite du Louvre, Dégustation de vins..."
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">📝 Description *</label>
                <textarea
                  className="input textarea"
                  name="description"
                  value={activiteFormData.description}
                  onChange={handleActiviteInputChange}
                  required
                  rows="4"
                  placeholder="Décrivez votre activité, vos impressions, conseils..."
                />
              </div>

              {/* Prix estimé */}
              <div className="form-group">
                <label className="form-label">💰 Prix estimé (€)</label>
                <input
                  type="number"
                  className="input"
                  name="prix_estime"
                  value={activiteFormData.prix_estime}
                  onChange={handleActiviteInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              {/* Âge minimum */}
              <div className="form-group">
                <label className="form-label">👶 Âge minimum requis</label>
                <input
                  type="number"
                  className="input"
                  name="age_minimum"
                  value={activiteFormData.age_minimum}
                  onChange={handleActiviteInputChange}
                  min="0"
                  max="120"
                  placeholder="0"
                />
                <span className="form-hint">💡 Mettre 0 pour "Tous âges"</span>
              </div>

              {/* Type d'activité */}
              <div className="form-group">
                <label className="form-label">🏷️ Type d'activité</label>
                <select
                  className="input"
                  name="type_activite"
                  value={activiteFormData.type_activite}
                  onChange={handleActiviteInputChange}
                >
                  <option value="culture">Culture & Patrimoine</option>
                  <option value="nature">Nature & Plein air</option>
                  <option value="gastronomie">Gastronomie</option>
                  <option value="restauration_rapide">Restauration rapide</option>
                  <option value="sport">Sport & Aventure</option>
                  <option value="divertissement">Divertissement</option>
                  <option value="shopping">Shopping</option>
                  <option value="bien_etre">Bien-être & Spa</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Adresse précise */}
              <div className="form-group">
                <label className="form-label">📍 Adresse précise</label>
                <input
                  type="text"
                  className="input"
                  name="adresse_precise"
                  value={activiteFormData.adresse_precise}
                  onChange={handleActiviteInputChange}
                  placeholder="Rue, numéro, code postal..."
                />
              </div>

              {/* Options pratiques */}
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    name="transport_public"
                    checked={activiteFormData.transport_public}
                    onChange={(e) => setActiviteFormData(prev => ({
                      ...prev,
                      transport_public: e.target.checked
                    }))}
                  />
                  <span>🚌 Transport public</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    name="reservation_requise"
                    checked={activiteFormData.reservation_requise}
                    onChange={(e) => setActiviteFormData(prev => ({
                      ...prev,
                      reservation_requise: e.target.checked
                    }))}
                  />
                  <span>📅 Réservation requise</span>
                </label>
              </div>

              {/* Médias */}
              <div className="form-group">
                <label className="form-label">📸 Médias (images/vidéos)</label>
                <div className="file-upload-area"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    const files = Array.from(e.dataTransfer.files);
                    setSelectedFiles(prev => [...prev, ...files]);
                    handleFileSelect({ target: { files } });
                  }}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    📁 Cliquez pour sélectionner des fichiers
                  </label>
                  <p className="file-upload-hint">
                    ou glissez-déposez vos fichiers ici
                  </p>
                </div>

                {/* Prévisualisation des fichiers */}
                {filePreview.length > 0 && (
                  <div className="media-preview-section">
                    <div className="media-preview-grid">
                      {filePreview.map((preview, index) => (
                        <div key={index} className="media-preview-item">
                          {preview.type === 'image' && preview.preview ? (
                            <img
                              src={preview.preview}
                              alt={`Preview ${index + 1}`}
                              className="media-preview-image"
                            />
                          ) : (
                            <div className="media-preview-video-placeholder">
                              🎥 Vidéo
                            </div>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="media-preview-remove-button"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button" 
                      onClick={clearFiles} 
                      className="delete" 
                      style={{ marginTop: '10px' }}
                    >
                      Effacer tous les fichiers
                    </button>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowActiviteForm(false)} 
                  className="cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !activiteFormData.titre || !activiteFormData.description}
                  className={`auth-button ${isLoading ? 'disabled' : ''}`}
                >
                  {isLoading ? '⏳ Création...' : '✨ Créer l\'activité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="form-container">
        {/* Statistiques du lieu */}
        <div className="lieu-infos">
          <div className="lieu-info">
            <div className="lieu-note">{lieuDetails.note_moyenne ? lieuDetails.note_moyenne.toFixed(1) : 'N/A'}</div>
            <div className="form-hint">Note moyenne</div>
          </div>

          <div className="lieu-info">
            <div className="lieu-nb">{lieuDetails.total_voyages || voyages.length}</div>
            <div className="form-hint">Voyages</div>
          </div>
        </div>

        {/* Liste des voyages */}
        <div>
          <h2 className="section-header">
            {lieuDetails.total_voyages > 0 
              ? `Voyages enregistrés (${lieuDetails.total_voyages})`
              : 'Voyages des utilisateurs'
            }
          </h2>
          
          {voyages.length === 0 ? (
            <div className="empty-section">
              <div>Aucun voyage enregistré pour ce lieu pour le moment.</div>
              <div className="form-hint">
                Soyez le premier à partager votre expérience !
              </div>
            </div>
          ) : (
<>
      <div className="voyage-grid">
        {voyages
          .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
          .slice(0, displayedVoyagesCount)
          .map((voyage, index) => (
            <div
              key={voyage.id || index}
              className="dashboard-card card-hover"
            >
                  <div className="dashboard-header">
                    <div 
                      className="dashboard-title clickable-username"
                      onClick={() => {
                        if (voyage.utilisateur?.id) {
                          setViewingUserId(voyage.utilisateur.id);
                          setCurrentPage('UserPublicProfile');
                        }
                      }}
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#007bff' }}
                      title="Cliquer pour voir le profil"
                    >
                      {voyage.utilisateur?.username || 'Utilisateur'}
                    </div>
                    {voyage.note && (
                      <div className="voyage-rating">
                        ⭐ {voyage.note}/5
                      </div>
                    )}
                  </div>

                  {voyage.commentaire && (
                    <div className="voyage-comment">
                      "{voyage.commentaire.length > 100 
                        ? voyage.commentaire.substring(0, 100) + '...'
                        : voyage.commentaire
                      }"
                    </div>
                  )}

                  <div className="actions">
                    <button
                      onClick={() => handleVoyageClick(voyage.id)}
                      className="button"
                    >
                      Voir plus
                    </button>
                  </div>
                </div>
          ))}
      </div>
      
      {/* Contrôles de pagination */}
      {voyages.length > 3 && (
        <div className="pagination-controls">
          {displayedVoyagesCount > 3 && (
            <button 
              onClick={showLessVoyages}
              className="pagination-button"
            >
              <ArrowUpSVG />
            </button>
          )}
          {displayedVoyagesCount < voyages.length && (
            <button 
              onClick={showMoreVoyages}
              className="pagination-button"
            >
              <ArrowDownSVG />
            </button>
          )}
        </div>
      )}
    </>
  )}
</div>
        {/* Section des activités */}
        <div className="voyage-section">
          <h2 className="section-header">
            🎯 Activités disponibles ({activites.length})
          </h2>
          
          {isLoadingActivites ? (
            <div className="loading-message">
              <div>Chargement des activités...</div>
            </div>
          ) : activites.length === 0 ? (
            <div className="empty-section">
              <div>Aucune activité disponible pour ce lieu pour le moment.</div>
              <div className="form-hint">
                Soyez le premier à proposer une activité !
              </div>
            </div>
          ) : (
            <>
              <div className="voyage-grid">
                {activites
                  .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
                  .slice(0, displayedActivitesCount)
                  .map((activite) => (
                    <div
                      key={activite.id}
                      className="dashboard-card card-hover"
                      onClick={() => handleActiviteClick(activite.id)}
                    >
                  <div className="activity-header">
                    <h3>🎯 {activite.titre}</h3>
                    {activite.note_moyenne && (
                      <div className="voyage-rating">
                        ⭐ {activite.note_moyenne.toFixed(1)}/5
                      </div>
                    )}
                  </div>

                  <div className="activity-description">
                    {activite.description}
                  </div>

                  <div className="activity-details">
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
                          👶 {activite.age_minimum === 0 ? 'Tous âges' : `${activite.age_minimum}+ ans`}
                        </div>
                      )}
                    </div>
                    
                    <div className="activity-options">
                      {activite.transport_public && (
                        <span className="activity-option transport-option">
                          🚌 Transport public
                        </span>
                      )}
                      {activite.reservation_requise && (
                        <span className="activity-option reservation-option">
                          📅 Réservation requise
                        </span>
                      )}
                    </div>
                    
                    {activite.adresse_precise && (
                      <div className="activity-address">
                        📍 {activite.adresse_precise}
                      </div>
                    )}
                    {/* Médias */}
                      {activite.medias && activite.medias.length > 0 && (
                        <div className="media-block">
                          <div className="media-header">
                            📸 Médias ({activite.medias.length})
                          </div>
                          <div className="media-items">
                            {activite.medias.slice(0, 3).map((media, index) => (
                              <div key={index} className="media-item">
                                {media.type_media === 'image' ? '🖼️' : '🎥'} {media.titre || `Média ${index + 1}`}
                              </div>
                            ))}
                            {activite.medias.length > 3 && (
                              <div className="media-item">
                                +{activite.medias.length - 3} autres
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="activity-info">
                    <span 
                      className="clickable-username"
                      onClick={() => {
                        if (activite.cree_par?.id) {
                          setViewingUserId(activite.cree_par.id);
                          setCurrentPage('UserPublicProfile');
                        }
                      }}
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#007bff' }}
                      title="Cliquer pour voir le profil"
                    >
                      👤 Par {activite.cree_par?.username || 'Utilisateur'}
                    </span>
                    <span>📅 {new Date(activite.date_creation).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                ))}
            </div>
              
              {/* Contrôles de pagination */}
              {activites.length > 3 && (
                <div className="pagination-controls">
                  {displayedActivitesCount > 3 && (
                    <button 
                      onClick={showLessActivites}
                      className="pagination-button cSVG "
                    >
                      <ArrowUpSVG />
                    </button>
                  )}
                  {displayedActivitesCount < activites.length && (
                    <button 
                      onClick={showMoreActivites}
                      className="pagination-button"
                    >
                      <ArrowDownSVG />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lieu;