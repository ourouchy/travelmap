import React, { useState, useEffect } from 'react';

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '1.2em', marginBottom: '20px' }}>Chargement...</div>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  // Redirection si pas authentifié
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '1.5em', marginBottom: '20px', color: '#dc3545' }}>Accès refusé</div>
        <p>Connectez-vous pour commencer à documenter vos aventures !</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <h1>Mes Voyages</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            backgroundColor: showForm ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = showForm ? '#c82333' : '#218838'}
          onMouseLeave={(e) => e.target.style.backgroundColor = showForm ? '#dc3545' : '#28a745'}
        >
          {showForm ? 'Annuler' : '➕ Ajouter un voyage'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Nouveau Voyage</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Recherche de lieu via GeoNames */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Destination *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Rechercher une ville ou un pays via GeoNames..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                  
                  {/* Résultats de recherche GeoNames */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {searchResults.map((place, index) => (
                        <div
                          key={`place-${index}`}
                          onClick={() => handlePlaceSelect(place)}
                          style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <div style={{ fontWeight: 'bold' }}>{place.name}</div>
                          <div style={{ fontSize: '0.9em', color: '#666' }}>
                            {place.countryName} ({place.countryCode})
                          </div>
                          <div style={{ fontSize: '0.8em', color: '#999' }}>
                            {place.lat}, {place.lng} • {place.fcodeName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.lieu_nom && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '12px', 
                    backgroundColor: '#e8f5e8', 
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    color: '#28a745',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>✅ {formData.lieu_nom}</span>
                    <button
                      type="button"
                      onClick={clearLieuSelection}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '1.2em',
                        padding: '0',
                        marginLeft: '10px'
                      }}
                      title="Changer de destination"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Date de début */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Date de début *
                </label>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Date de fin */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Date de fin (optionnel)
                </label>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleInputChange}
                  min={formData.date_debut}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Note */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Note (optionnel)
                </label>
                <select
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
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
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Commentaire (optionnel)
                </label>
                <textarea
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleInputChange}
                  placeholder="Partagez vos impressions sur ce voyage..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1em',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Section Upload de médias */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                Photos et vidéos (optionnel)
              </label>
              
              <div style={{
                border: '2px dashed #ddd',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                transition: 'border-color 0.2s'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#ddd';
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
                <label htmlFor="file-upload" style={{
                  cursor: 'pointer',
                  color: '#007bff',
                  fontWeight: '500'
                }}>
                  📁 Cliquez pour sélectionner des fichiers
                </label>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                  ou glissez-déposez vos fichiers ici
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: '#999' }}>
                  Formats supportés: JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV (max 10MB par fichier)
                </p>
              </div>

              {/* Prévisualisation des fichiers sélectionnés */}
              {filePreview.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#333' }}>
                    Fichiers sélectionnés ({filePreview.length})
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '10px'
                  }}>
                    {filePreview.map((preview, index) => (
                      <div key={index} style={{
                        position: 'relative',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: 'white'
                      }}>
                        {preview.type === 'image' && preview.preview ? (
                          <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100px',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100px',
                            backgroundColor: '#f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666'
                          }}>
                            🎥 Vidéo
                          </div>
                        )}
                        
                        <div style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px'
                        }}>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div style={{
                          padding: '5px',
                          fontSize: '0.8em',
                          color: '#666',
                          textAlign: 'center',
                          backgroundColor: 'rgba(255,255,255,0.9)'
                        }}>
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
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    Effacer tous les fichiers
                  </button>
                </div>
              )}
            </div>

            {/* Bouton de soumission */}
            <div style={{ textAlign: 'right' }}>
              <button
                type="submit"
                disabled={isLoading || !formData.lieu_data || !formData.date_debut}
                style={{
                  padding: '12px 30px',
                  backgroundColor: isLoading || !formData.lieu_data || !formData.date_debut ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading || !formData.lieu_data || !formData.date_debut ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold'
                }}
              >
                {isLoading ? 'Création...' : 'Créer le voyage'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Liste des voyages */}
      <div>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          Voyages enregistrés ({voyages.length})
        </h2>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Chargement de vos voyages...</div>
          </div>
        ) : voyages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            color: '#6c757d'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '20px' }}>✈️</div>
            <h3>Aucun voyage enregistré</h3>
            <p>Commencez par ajouter votre premier voyage pour documenter vos aventures !</p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1em',
                marginTop: '20px'
              }}
            >
              Ajouter mon premier voyage
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px' 
          }}>
            {voyages.map((voyage) => (
              <div
                key={voyage.id}
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
                {/* En-tête avec lieu et note */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                      {voyage.lieu.nom_ville}
                    </h3>
                    <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>
                      {voyage.lieu.pays.nom}
                    </p>
                  </div>
                  {voyage.note && (
                    <div style={{ 
                      backgroundColor: '#ffd700', 
                      color: '#333',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      fontSize: '0.9em',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      ⭐ {voyage.note}/5
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>
                    📅 Du {formatDate(voyage.date_debut)}
                  </div>
                  {voyage.date_fin && (
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      📅 Au {formatDate(voyage.date_fin)}
                    </div>
                  )}
                </div>

                {/* Commentaire */}
                {voyage.commentaire && (
                  <div style={{ 
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '0.9em',
                    fontStyle: 'italic',
                    color: '#495057'
                  }}>
                    💬 "{voyage.commentaire}"
                  </div>
                )}

                {/* Date de création */}
                <div style={{ 
                  fontSize: '0.8em', 
                  color: '#999', 
                  marginBottom: '15px',
                  fontStyle: 'italic'
                }}>
                  Créé le {formatDate(voyage.date_creation)}
                </div>

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => handleDeleteVoyage(voyage.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
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