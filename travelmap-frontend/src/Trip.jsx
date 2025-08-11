import React, { useState, useEffect } from 'react';
import './App.css'; // Importer le fichier CSS pour les styles

const Trip = () => {
  const [selectedLieu, setSelectedLieu] = useState(null);
  const [voyages, setVoyages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreview, setFilePreview] = useState([]);

  // États de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // États du formulaire
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    lieu_id: '',
    lieu_nom: '',
    lieu_data: null, // Stocke les données complètes du lieu GeoNames
    date_debut: '',
    date_fin: '',
    note: '',
    commentaire: ''
  });

  // États des champs du formulaire (pour la compatibilité)
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [note, setNote] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      try {
        const userData = JSON.parse(user);
        console.log('Utilisateur connecté:', userData);
      } catch (e) {
        console.error('Erreur parsing user data:', e);
      }
    }
    setIsLoadingAuth(false);
  }, []);

  // Rediriger vers login si pas authentifié
  useEffect(() => {
    if (!isAuthenticated && !isLoadingAuth) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoadingAuth]);

  // Charger les voyages de l'utilisateur
  useEffect(() => {
    if (isAuthenticated) {
      fetchVoyages();
    }
  }, [isAuthenticated]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    // Créer des previews pour les images
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
    
    // Libérer les URLs des previews
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

  // Charger les voyages de l'utilisateur
  const fetchVoyages = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Vous devez être connecté pour voir vos voyages');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/voyages/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVoyages(data);
      } else if (response.status === 401) {
        console.error('❌ Erreur 401: Token invalide ou expiré');
        setIsAuthenticated(false);
      } else {
        const errorText = await response.text();
        console.error('❌ Détails de l\'erreur:', errorText);
        setError('Erreur lors du chargement des voyages');
      }
    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // Recherche de lieux via GeoNames
  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Utilisation de l'API GeoNames avec votre username
      const response = await fetch(
        `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=10&username=ourouchy&featureClass=P&featureClass=A&featureClass=T&orderby=relevance`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.geonames && data.geonames.length > 0) {
          // Filtrer les résultats pour s'assurer qu'ils ont toutes les données requises
          const validPlaces = data.geonames.filter(place => 
            place.name && 
            place.countryName && 
            place.countryCode && 
            place.lat && 
            place.lng
          );
          
          if (validPlaces.length > 0) {
            setSearchResults(validPlaces);
            setShowSearchResults(true);
          } else {
            setSearchResults([]);
            setShowSearchResults(false);
          }
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } else {
        console.warn('Erreur lors de la recherche GeoNames:', response.status);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Erreur de recherche GeoNames:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Gestion de la saisie de recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Ne lancer la recherche que si :
      // 1. Il y a une requête
      // 2. Pas de lieu déjà sélectionné
      // 3. La requête est différente du lieu sélectionné
      if (searchQuery && !formData.lieu_data) {
        searchPlaces(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, formData.lieu_data]);

  // Sélection d'un lieu dans la recherche GeoNames
  const handlePlaceSelect = (place) => {
    // Convention de nommage : "NomVille, Pays" (ex: "Paris, France")
    const lieuNom = `${place.name}, ${place.countryName}`;
    
    setFormData({
      ...formData,
      lieu_id: '', // Sera défini après vérification/création
      lieu_nom: lieuNom,
      lieu_data: {
        nom_ville: place.name,
        pays_code: place.countryCode,
        geoname_id: place.geonameId,
        latitude: place.lat,
        longitude: place.lng,
        pays_nom: place.countryName
      }
    });
    
    // Vider la barre de recherche et masquer les résultats
    setSearchQuery(lieuNom);
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Gestion des changements du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si on modifie la barre de recherche, réinitialiser la sélection
    if (name === 'searchQuery') {
      if (formData.lieu_data) {
        // L'utilisateur modifie la recherche, on efface la sélection précédente
        setFormData(prev => ({
          ...prev,
          lieu_id: '',
          lieu_nom: '',
          lieu_data: null
        }));
      }
      setSearchQuery(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Gestion des changements de la barre de recherche
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Si on efface complètement la recherche, réinitialiser la sélection
    if (!value.trim()) {
      setFormData(prev => ({
        ...prev,
        lieu_id: '',
        lieu_nom: '',
        lieu_data: null
      }));
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  // Effacer la sélection de lieu
  const clearLieuSelection = () => {
    setFormData(prev => ({
      ...prev,
      lieu_id: '',
      lieu_nom: '',
      lieu_data: null
    }));
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Vérifier si un lieu existe déjà, sinon le créer
  const ensureLieuExists = async (lieuData) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // D'abord, essayer de trouver le lieu existant
      const searchResponse = await fetch(
        `http://localhost:8000/api/search/?q=${encodeURIComponent(lieuData.nom_ville)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        // Chercher une correspondance exacte par nom de ville et pays
        const existingLieu = searchData.lieux?.find(lieu => 
          lieu.nom_ville.toLowerCase().trim() === lieuData.nom_ville.toLowerCase().trim() &&
          lieu.pays.code_iso.toLowerCase() === lieuData.pays_code.toLowerCase()
        );

        if (existingLieu) {
          console.log('Lieu existant trouvé:', existingLieu);
          return existingLieu.id;
        }
      } else {
        console.warn('Erreur lors de la recherche de lieu existant:', searchResponse.status);
      }

      // Si le lieu n'existe pas, le créer
      console.log('Création d\'un nouveau lieu:', lieuData);
      
      // Vérifier que toutes les données requises sont présentes
      if (!lieuData.nom_ville || !lieuData.pays_code || !lieuData.latitude || !lieuData.longitude) {
        throw new Error('Données de lieu incomplètes pour la création');
      }

      const createResponse = await fetch('http://localhost:8000/api/lieux/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom_ville: lieuData.nom_ville.trim(),
          pays_code: lieuData.pays_code.toUpperCase(),
          geoname_id: lieuData.geoname_id || null,
          latitude: parseFloat(lieuData.latitude),
          longitude: parseFloat(lieuData.longitude)
        })
      });

      if (createResponse.ok) {
        const newLieu = await createResponse.json();
        console.log('Nouveau lieu créé:', newLieu);
        return newLieu.id;
      } else {
        const errorData = await createResponse.json();
        console.error('Erreur lors de la création du lieu:', errorData);
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la création du lieu');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification/création du lieu:', error);
      throw error;
    }
  };

  // Création d'un nouveau voyage
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Vérifier que le lieu existe ou le créer
      const lieuId = await ensureLieuExists(formData.lieu_data);
      if (!lieuId) {
        setError('Erreur lors de la création/validation du lieu');
        return;
      }

      // Préparer les données du voyage
      const voyageData = {
        lieu_id: lieuId,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        note: formData.note || null,
        commentaire: formData.commentaire || ''
      };

      // Créer le FormData pour inclure les fichiers
      const formDataToSend = new FormData();
      formDataToSend.append('lieu_id', lieuId);
      formDataToSend.append('date_debut', formData.date_debut);
      if (formData.date_fin) formDataToSend.append('date_fin', formData.date_fin);
      if (formData.note) formDataToSend.append('note', formData.note);
      if (formData.commentaire) formDataToSend.append('commentaire', formData.commentaire);
      
      // Ajouter les fichiers
      selectedFiles.forEach((file, index) => {
        formDataToSend.append('medias', file);
      });

      // Créer le voyage
      const response = await fetch('http://localhost:8000/api/voyages/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const newVoyage = await response.json();
        console.log('Voyage créé:', newVoyage);
        
        // Réinitialiser le formulaire
        setFormData({
          lieu_id: '',
          lieu_nom: '',
          lieu_data: null,
          date_debut: '',
          date_fin: '',
          note: '',
          commentaire: ''
        });
        setSelectedLieu(null);
        setSearchQuery('');
        setShowSearchResults(false);
        setSearchResults([]);
        clearFiles();
        
        // Recharger la liste des voyages
        await fetchVoyages();
        
        // Afficher un message de succès
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

  // Suppression d'un voyage
  const handleDeleteVoyage = async (voyageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce voyage ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/api/voyages/${voyageId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchVoyages(); // Recharger la liste
      } else {
        setError('Erreur lors de la suppression du voyage');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Vérifier si l'utilisateur est connecté
  // const isAuthenticated = !!localStorage.getItem('authToken'); // This line is now redundant as isAuthenticated state is used

  // Affichage de chargement
  if (isLoadingAuth) {
    return (
      <div className="trip-loading">
        <div className="trip-loading-text">Chargement...</div>
        <div className="trip-spinner"></div>
      </div>
    );
  }

  // Redirection si pas authentifié
  if (!isAuthenticated) {
    return (
      <div className="trip-auth-refused">
        <div className="trip-auth-refused-title">Accès refusé</div>
        <p>Connectez-vous pour commencer à documenter vos aventures !</p>
      </div>
    );
  }

  return (
    <div className="trip-container">
      {/* En-tête */}
      <div className="trip-header">
        <h1 className="trip-title">Mes Voyages</h1>
        {/* Afficher le bouton "Ajouter un voyage" si au moins 1 voyage, 
            et le bouton "Annuler" si le formulaire est ouvert */}
        {voyages.length > 0 && !showForm && (
          <button
            className="trip-add-btn"
            onClick={() => setShowForm(true)}
          >
            ➕ Ajouter un voyage
          </button>
        )}
        {showForm && (
          <button
            className="trip-add-btn trip-add-btn-cancel"
            onClick={() => setShowForm(false)}
          >
            Annuler
          </button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="trip-form-card">
          <h2 className="trip-form-title">Nouveau Voyage</h2>
          <form onSubmit={handleSubmit}>
            <div className="trip-form-grid">
              {/* Recherche de lieu via GeoNames */}
              <div className="trip-form-group trip-form-group-full">
                <label className="trip-label">
                  Destination *
                </label>
                <div className="trip-search-wrapper">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Rechercher une ville ou un pays via GeoNames..."
                    required
                    className="trip-input"
                  />
                  {/* Résultats de recherche GeoNames */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="trip-search-results">
                      {searchResults.map((place, index) => (
                        <div
                          key={`place-${index}`}
                          onClick={() => handlePlaceSelect(place)}
                          className="trip-search-result"
                        >
                          <div className="trip-search-result-title">{place.name}</div>
                          <div className="trip-search-result-country">
                            {place.countryName} ({place.countryCode})
                          </div>
                          <div className="trip-search-result-coords">
                            {place.lat}, {place.lng} • {place.fcodeName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.lieu_nom && (
                  <div className="trip-lieu-selected">
                    <span>✅ {formData.lieu_nom}</span>
                    <button type="button" onClick={clearLieuSelection} className="trip-lieu-clear-btn" title="Changer de destination">
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Dates de début et de fin */}
              <div className="trip-form-group-row trip-form-group-full">
                <div className="trip-form-group">
                  <label className="trip-label">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    name="date_debut"
                    value={formData.date_debut}
                    onChange={handleInputChange}
                    required
                    className="trip-input-date"
                  />
                </div>
                <div className="trip-form-group">
                  <label className="trip-label">
                    Date de fin (optionnel)
                  </label>
                  <input
                    type="date"
                    name="date_fin"
                    value={formData.date_fin}
                    onChange={handleInputChange}
                    min={formData.date_debut}
                    className="trip-input-date"
                  />
                </div>
              </div>


              {/* Note */}
              <div className="trip-form-group">
                <label className="trip-label">
                  Note (optionnel)
                </label>
                <select name="note" value={formData.note} onChange={handleInputChange} className="trip-input">
                  <option value="">Sélectionner une note</option>
                  <option value="1">⭐ 1 - Très décevant</option>
                  <option value="2">⭐⭐ 2 - Décevant</option>
                  <option value="3">⭐⭐⭐ 3 - Moyen</option>
                  <option value="4">⭐⭐⭐⭐ 4 - Bien</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                </select>
              </div>

              {/* Commentaire */}
              <div className="trip-form-group trip-form-group-full">
                <label className="trip-label">
                  Commentaire (optionnel)
                </label>
                <textarea
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleInputChange}
                  placeholder="Partagez vos impressions sur ce voyage..."
                  rows="3"
                  className="trip-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Section Upload de médias */}
            <div className="trip-media-upload">
              <label className="trip-label">
                Photos et vidéos (optionnel)
              </label>
              <div
                className="trip-media-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("trip-media-dropzone-active");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("trip-media-dropzone-active");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("trip-media-dropzone-active");
                  const files = Array.from(e.dataTransfer.files);
                  setSelectedFiles(prev => [...prev, ...files]);
                  handleFileSelect({ target: { files } });
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="trip-media-upload-label">
                  📁 Cliquez pour sélectionner des fichiers
                </label>
                <p className="trip-media-upload-desc">
                  ou glissez-déposez vos fichiers ici
                </p>
                <p className="trip-media-upload-info">
                  Formats supportés: JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV (max 10MB par fichier)
                </p>
              </div>

              {/* Prévisualisation des fichiers sélectionnés */}
              {filePreview.length > 0 && (
                <div className="trip-media-preview">
                  <h4 className="trip-media-preview-title">
                    Fichiers sélectionnés ({filePreview.length})
                  </h4>
                  <div className="trip-media-preview-list">
                    {filePreview.map((preview, index) => (
                      <div key={index} className="trip-media-preview-item">
                        {preview.type === 'image' && preview.preview ? (
                          <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            className="trip-media-preview-img"
                          />
                        ) : (
                          <div className="trip-media-preview-video">
                            🎥 Vidéo
                          </div>
                        )}
                        <div className="trip-media-preview-remove">
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="trip-media-preview-remove-btn"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="trip-media-preview-name">
                          {preview.file.name.length > 20
                            ? preview.file.name.substring(0, 20) + '...'
                            : preview.file.name
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="trip-media-preview-clear-btn"
                  >
                    Effacer tous les fichiers
                  </button>
                </div>
              )}
            </div>

            {/* Bouton de soumission */}
            <div className="trip-form-submit">
              <button
                type="submit"
                disabled={isLoading || !formData.lieu_data || !formData.date_debut}
                className="trip-submit-btn"
              >
                {isLoading ? 'Création...' : 'Enregistrer votre voyage ✈️'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="trip-error-message">
          {error}
        </div>
      )}

      {/* Liste des voyages */}
      <div>
        {voyages.length > 1 && (
          <h2 className="trip-list-title">
            Voyages enregistrés ({voyages.length})
          </h2>
        )}

        {isLoading ? (
          <div className="trip-list-loading">
            <div>Chargement de vos voyages...</div>
          </div>
        ) : voyages.length === 0 ? (
          <div className="trip-list-empty">
            <div className="trip-list-empty-icon">✈️</div>
            <h3>Aucun voyage enregistré</h3>
            <p>Commencez par ajouter votre premier voyage pour documenter vos aventures !</p>
            <button onClick={() => setShowForm(true)} className="trip-list-empty-btn">
              ➕ Ajouter mon premier voyage
            </button>
          </div>
        ) : (
          <div className="trip-list-grid">
            {voyages.map((voyage) => (
              <div
                key={voyage.id}
                className="trip-card"
              >
                {/* En-tête avec lieu et note */}
                <div className="trip-card-header">
                  <div>
                    <h3 className="trip-card-title">
                      {voyage.lieu.nom_ville}
                    </h3>
                    <p className="trip-card-country">
                      {voyage.lieu.pays.nom}
                    </p>
                  </div>
                  {voyage.note && (
                    <div className="trip-card-note">
                      ⭐ {voyage.note}/5
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="trip-card-dates">
                  <div>
                    📅 Du {formatDate(voyage.date_debut)}
                  </div>
                  {voyage.date_fin && (
                    <div>
                      au {formatDate(voyage.date_fin)}
                    </div>
                  )}
                </div>

                {/* Commentaire */}
                {voyage.commentaire && (
                  <div className="trip-card-commentaire">
                    💬 "{voyage.commentaire}"
                  </div>
                )}

                {/* Date de création */}
                <div className="trip-card-created">
                  Créé le {formatDate(voyage.date_creation)}
                </div>

                {/* Actions */}
                <div className="trip-card-actions">
                  <button
                    onClick={() => handleDeleteVoyage(voyage.id)}
                    className="trip-card-delete-btn"
                  >
                    🗑️ Supprimer
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

export default Trip;