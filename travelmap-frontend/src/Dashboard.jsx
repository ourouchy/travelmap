import React, { useState, useEffect } from 'react';
import VoyageDetail from './VoyageDetail';
import ActiviteDetail from './ActiviteDetail';

const Dashboard = ({ setViewingUserId, setCurrentPage, onNavigateToLieu }) => {
  // États communs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [selectedVoyageId, setSelectedVoyageId] = useState(null);
  const [selectedActiviteId, setSelectedActiviteId] = useState(null);
  const [displayedVoyagesCount, setDisplayedVoyagesCount] = useState(3);
  const [displayedActivitesCount, setDisplayedActivitesCount] = useState(3);

  // États pour les voyages (de Trip.jsx)
  const [voyages, setVoyages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreview, setFilePreview] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showVoyageForm, setShowVoyageForm] = useState(false);
  const [voyageFormData, setVoyageFormData] = useState({
    lieu_id: '',
    lieu_nom: '',
    lieu_data: null,
    date_debut: '',
    date_fin: '',
    note: '',
    commentaire: ''
  });

  // États pour les activités (de Activites.jsx)
  const [mesActivites, setMesActivites] = useState([]);
  const [isLoadingActivites, setIsLoadingActivites] = useState(false);
  const [showActiviteForm, setShowActiviteForm] = useState(false);
  const [selectedLieu, setSelectedLieu] = useState(null);
  const [activiteFormData, setActiviteFormData] = useState({
    titre: '',
    description: '',
    lieu_id: '',
    prix_estime: '',
    age_minimum: '',
    type_activite: 'autre',
    adresse_precise: '',
    transport_public: false,
    reservation_requise: false,
    medias: []
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingActivite, setEditingActivite] = useState(null);
  const [editFormData, setEditFormData] = useState({
    titre: '',
    description: '',
    prix_estime: '',
    age_minimum: '',
    type_activite: 'autre',
    adresse_precise: '',
    transport_public: false,
    reservation_requise: false
  });

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  }, []);

  // Charger les données au montage
  useEffect(() => {
    if (isAuthenticated) {
      fetchVoyages();
      fetchMesActivites();
    }
  }, [isAuthenticated]);

const ArrowUpSVG = () => (
  <svg className="SVG" width="30" height="30" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
    <path fill="currentColor" stroke="currentColor" strokeWidth="1.5" d="M23.245 20l-11.245-14.374-11.219 14.374-.781-.619 12-15.381 12 15.391-.755.609z"/>
  </svg>
);

const ArrowDownSVG = () => (
  <svg className="SVG" width="30" height="30" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
    <path fill="currentColor" stroke="currentColor" strokeWidth="1.5" d="M23.245 4l-11.245 14.374-11.219-14.374-.781.619 12 15.381 12-15.391-.755-.609z"/>
  </svg>
);

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

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  
  if (showActiviteForm) {
    // Pour le formulaire d'activité
    setActiviteFormData(prev => ({
      ...prev,
      medias: [...prev.medias, ...files]
    }));
  } else {
    // Pour le formulaire de voyage
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
  }
};

const removeFile = (index) => {
  if (showActiviteForm) {
    // Pour le formulaire d'activité
    setActiviteFormData(prev => {
      const newMedias = [...prev.medias];
      newMedias.splice(index, 1);
      return { ...prev, medias: newMedias };
    });
  } else {
    // Pour le formulaire de voyage
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreview.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setFilePreview(newPreviews);
    
    if (filePreview[index]?.preview) {
      URL.revokeObjectURL(filePreview[index].preview);
    }
  }
};

const clearFiles = () => {
  if (showActiviteForm) {
    // Pour le formulaire d'activité
    setActiviteFormData(prev => ({ ...prev, medias: [] }));
  } else {
    // Pour le formulaire de voyage
    setSelectedFiles([]);
    filePreview.forEach(preview => {
      if (preview?.preview) {
        URL.revokeObjectURL(preview.preview);
      }
    });
    setFilePreview([]);
  }
};
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

  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(
        `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=10&username=ourouchy&featureClass=P&featureClass=A&featureClass=T&orderby=relevance`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.geonames && data.geonames.length > 0) {
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && !voyageFormData.lieu_data) {
        searchPlaces(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, voyageFormData.lieu_data]);

  const handlePlaceSelect = (place) => {
    const lieuNom = `${place.name}, ${place.countryName}`;
    
    setVoyageFormData({
      ...voyageFormData,
      lieu_id: '',
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
    
    setSearchQuery(lieuNom);
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleVoyageInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'searchQuery') {
      if (voyageFormData.lieu_data) {
        setVoyageFormData(prev => ({
          ...prev,
          lieu_id: '',
          lieu_nom: '',
          lieu_data: null
        }));
      }
      setSearchQuery(value);
    } else {
      setVoyageFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (!value.trim()) {
      setVoyageFormData(prev => ({
        ...prev,
        lieu_id: '',
        lieu_nom: '',
        lieu_data: null
      }));
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const clearLieuSelection = () => {
    setVoyageFormData(prev => ({
      ...prev,
      lieu_id: '',
      lieu_nom: '',
      lieu_data: null
    }));
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const ensureLieuExists = async (lieuData) => {
    try {
      const token = localStorage.getItem('authToken');
      
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

      console.log('Création d\'un nouveau lieu:', lieuData);
      
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

  const handleCreateVoyage = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const lieuId = await ensureLieuExists(voyageFormData.lieu_data);
      if (!lieuId) {
        setError('Erreur lors de la création/validation du lieu');
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
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const newVoyage = await response.json();
        console.log('Voyage créé:', newVoyage);
        
        setVoyageFormData({
          lieu_id: '',
          lieu_nom: '',
          lieu_data: null,
          date_debut: '',
          date_fin: '',
          note: '',
          commentaire: ''
        });
        setSelectedFiles([]);
        setFilePreview([]);
        setSearchQuery('');
        setShowSearchResults(false);
        setSearchResults([]);
        
        await fetchVoyages();
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
        await fetchVoyages();
      } else {
        setError('Erreur lors de la suppression du voyage');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  // Fonctions pour les activités (de Activites.jsx)
  const fetchMesActivites = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingActivites(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('Token non trouvé');
        return;
      }

      const response = await fetch('http://localhost:8000/api/activites/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userActivites = data.filter(activite => 
          activite.cree_par?.id === userData.id || activite.cree_par === userData.id
        );
        setMesActivites(userActivites);
      } else {
        console.error('Erreur lors du chargement des activités');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsLoadingActivites(false);
    }
  };

  const openActiviteForm = (lieu) => {
    setSelectedLieu(lieu);
    setActiviteFormData({
      titre: '',
      description: '',
      lieu_id: lieu.id,
      prix_estime: '',
      age_minimum: '',
      type_activite: 'autre',
      adresse_precise: '',
      transport_public: false,
      reservation_requise: false,
      medias: []
    });
    setShowActiviteForm(true);
  };

  const closeActiviteForm = () => {
    setShowActiviteForm(false);
    setSelectedLieu(null);
    setActiviteFormData({
      titre: '',
      description: '',
      lieu_id: '',
      prix_estime: '',
      age_minimum: '',
      type_activite: 'autre',
      adresse_precise: '',
      transport_public: false,
      reservation_requise: false,
      medias: []
    });
  };

  const handleActiviteInputChange = (e) => {
    const { name, value } = e.target;
    setActiviteFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateActivite = async (e) => {
    e.preventDefault();
    
    if (!activiteFormData.titre.trim() || !activiteFormData.description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const formDataToSend = new FormData();
      formDataToSend.append('titre', activiteFormData.titre.trim());
      formDataToSend.append('description', activiteFormData.description.trim());
      formDataToSend.append('lieu_id', activiteFormData.lieu_id);
      
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
      
      activiteFormData.medias.forEach((file, index) => {
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
        const activite = await response.json();
        console.log('✅ Activité créée:', activite);
        
        closeActiviteForm();
        setError(null);
        await fetchMesActivites();
        alert('Activité créée avec succès !');
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur création activité:', errorData);
        
        if (errorData.lieu_id) {
          setError(errorData.lieu_id[0]);
        } else if (errorData.non_field_errors) {
          setError(errorData.non_field_errors[0]);
        } else {
          setError('Erreur lors de la création de l\'activité');
        }
      }
    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditForm = (activite) => {
    setEditingActivite(activite);
    setEditFormData({
      titre: activite.titre,
      description: activite.description,
      prix_estime: activite.prix_estime,
      age_minimum: activite.age_minimum,
      type_activite: activite.type_activite,
      adresse_precise: activite.adresse_precise,
      transport_public: activite.transport_public,
      reservation_requise: activite.reservation_requise
    });
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingActivite(null);
    setEditFormData({
      titre: '',
      description: '',
      prix_estime: '',
      age_minimum: '',
      type_activite: 'autre',
      adresse_precise: '',
      transport_public: false,
      reservation_requise: false
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditActivite = async (e) => {
    e.preventDefault();
    
    if (!editFormData.titre.trim() || !editFormData.description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:8000/api/activites/${editingActivite.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titre: editFormData.titre.trim(),
          description: editFormData.description.trim(),
          lieu_id: editingActivite.lieu.id,
          prix_estime: editFormData.prix_estime,
          age_minimum: editFormData.age_minimum,
          type_activite: editFormData.type_activite,
          adresse_precise: editFormData.adresse_precise,
          transport_public: editFormData.transport_public,
          reservation_requise: editFormData.reservation_requise
        })
      });

      if (response.ok) {
        const activite = await response.json();
        console.log('✅ Activité modifiée:', activite);
        
        closeEditForm();
        setError(null);
        await fetchMesActivites();
        alert('Activité modifiée avec succès !');
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur modification activité:', errorData);
        setError('Erreur lors de la modification de l\'activité');
      }
    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteActivite = async (activiteId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:8000/api/activites/${activiteId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Activité supprimée');
        await fetchMesActivites();
        alert('Activité supprimée avec succès !');
      } else {
        console.error('❌ Erreur suppression activité');
        setError('Erreur lors de la suppression de l\'activité');
      }
    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions utilitaires
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Rediriger vers login si pas authentifié
  if (!isAuthenticated && !isLoadingAuth) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔒 Accès restreint</h2>
        <p>Vous devez être connecté pour accéder à cette page.</p>
      </div>
    );
  }

  if (selectedVoyageId) {
    return (
      <VoyageDetail 
        voyageId={selectedVoyageId} 
        onNavigateBack={handleBackFromVoyage}
        setViewingUserId={setViewingUserId}
        setCurrentPage={setCurrentPage}
        onNavigateToLieu={onNavigateToLieu}
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
        onNavigateToLieu={onNavigateToLieu}
      />
    );
  }


  return (

<div>
  <h1>Tableau de bord</h1>
  <div className="card">
  {error && (
    <div className="error-message">
      ❌ {error}
    </div>
  )}

  {/* Section Mes Voyages */}
  <div className="voyage-section">
    <div className="section-header">
      <h2 className="section-title">
        ✈️ Mes Voyages ({voyages.length})
      </h2>
      <button onClick={() => setShowVoyageForm(!showVoyageForm)} style={{width: 'fit-content'}} > ➕ Ajouter un voyage
      </button>
    </div>
  {/* Modal du formulaire de voyage */}
{showVoyageForm && (
  <div className="loading-overlay">
    <div className="modal-card">
      <div className="modal-header">
        <h2 className="section-title" style={{ margin: 0 }}>
          ✈️ Nouveau Voyage
        </h2>
        <button
          onClick={() => setShowVoyageForm(false)}
          className="close"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleCreateVoyage}>
        {/* Recherche de destination */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            🌍 Destination *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Rechercher une ville ou un pays..."
            />
            
            {/* Résultats de recherche */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((place, index) => (
                  <div
                    key={`place-${index}`}
                    onClick={() => handlePlaceSelect(place)}
                    className="search-result-item"
                  >
                    <div className="search-result-main">{place.name}</div>
                    <div className="search-result-secondary">
                      {place.countryName} ({place.countryCode})
                    </div>
                    <div className="search-result-tertiary">
                      {place.lat}, {place.lng} • {place.fcodeName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {voyageFormData.lieu_nom && (
            <div className="selected-destination">
              <span>✅ {voyageFormData.lieu_nom}</span>
              <button
                type="button"
                onClick={clearLieuSelection}
                className="clear-selection-button"
                title="Changer de destination"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Date de début */}
          <div className="form-group">
            <label className="form-label">
              📅 Date de début *
            </label>
            <input
              type="date"
              className="input"
              name="date_debut"
              value={voyageFormData.date_debut}
              onChange={handleVoyageInputChange}
              required
            />
          </div>

          {/* Date de fin */}
          <div className="form-group">
            <label className="form-label">
              📅 Date de fin (optionnel)
            </label>
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
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            ⭐ Note (optionnel)
          </label>
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
        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label className="form-label">
            📝 Commentaire (optionnel)
          </label>
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
        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label className="form-label">
            📸 Photos et vidéos (optionnel)
          </label>
          
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
            <p className="file-upload-subhint">
              Formats supportés: JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV (max 10MB par fichier)
            </p>
          </div>

          {/* Prévisualisation des fichiers */}
          {filePreview.length > 0 && (
            <div className="media-preview-section">
              <div className="media-header">
                📁 Fichiers sélectionnés ({filePreview.length})
              </div>
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
                    
                    <div className="media-preview-filename">
                      {preview.file.name.length > 20 
                        ? preview.file.name.substring(0, 20) + '...'
                        : preview.file.name
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button" onClick={clearFiles} className="delete" style={{ marginTop: '10px' }}>
                  Effacer tous les fichiers
              </button>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="form-actions">
          <button type="button" onClick={() => setShowVoyageForm(false)} className="cancel" >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || !voyageFormData.lieu_data || !voyageFormData.date_debut}
            className={` ${isLoading ? 'disabled' : ''}`}
          >
            {isLoading ? '⏳ Création...' : '✈️ Créer le voyage'}
          </button>
        </div>
      </form>
      
    </div>
  </div>
)}
{/* Liste des voyages */}
<div>
  {isLoading ? (
    <div className="loading-message">
      <div>Chargement de vos voyages...</div>
    </div>
  ) : voyages.length === 0 ? (
    <div className="empty-section">
      <div className="empty-icon">✈️</div>
      <h3>Aucun voyage enregistré</h3>
      <p>Commencez par ajouter votre premier voyage pour documenter vos aventures !</p>
      <button
        onClick={() => setShowVoyageForm(true)}
      >
        Ajouter mon premier voyage
      </button>
    </div>
  ) : (
    <div className="dashboard-grid">
      {voyages
        .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
        .slice(0, displayedVoyagesCount)
        .map((voyage) => (
        <div
          key={voyage.id}
          className="dashboard-card card-hover" onClick={(e) => {
      e.stopPropagation();
      handleVoyageClick(voyage.id);
    }}
        >
          {/* En-tête avec lieu et note */}
          <div className="dashboard-header">
            <div>
              <h3 className="dashboard-title">
                {voyage.lieu.nom_ville}
              </h3>
              <p className="voyage-country">
                {voyage.lieu.pays.nom}
              </p>
            </div>
            {voyage.note && (
              <div className="dashboard-rating">
                ⭐ {voyage.note}/5
              </div>
            )}
          </div>
          {/* Dates */}
          <div className="voyage-dates">
            <div className="voyage-date">
              📅 Du {formatDate(voyage.date_debut)}
            </div>
            {voyage.date_fin && (
              <div className="voyage-date">
                📅 Au {formatDate(voyage.date_fin)}
              </div>
            )}
          </div>

          {/* Commentaire */}
          {voyage.commentaire && (
            <div className="voyage-comment">
              💬 "{voyage.commentaire}"
            </div>
          )}

          {/* Date de création */}
          <div className="voyage-creation-date">
            Créé le {formatDate(voyage.date_creation)}
          </div>

          {/* Actions */}
          <div className="actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openActiviteForm(voyage.lieu);
              }}
            >
              ➕ Ajouter une activité
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteVoyage(voyage.id);
              }}
              className="delete"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
    
  )}
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
</div>
</div>
    <div className="card">
{/* Section Mes Activités */}
<div className= "section-header">  <h2 className="section-title">
    🎯 Mes Activités ({mesActivites.length})
  </h2></div>
  {isLoadingActivites ? (
    <div className="loading-activities">
      <p>Chargement de vos activités...</p>
    </div>
  ) : mesActivites.length === 0 ? (
    <div className="empty-section">
      <h3>🚀 Aucune activité créée</h3>
      <p>
        Vous n'avez pas encore créé d'activités.
      </p>
      <p>
        Cliquez sur une destination ci-dessus pour commencer !
      </p>
    </div>
  ) : (
      <div className="dashboard-grid">
        {mesActivites
          .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
          .slice(0, displayedActivitesCount)
          .map((activite) => (
        <div
          key={activite.id}
          className="dashboard-card card-hover" onClick={(e) => {
      e.stopPropagation(); handleActiviteClick(activite.id)}}
        >

          {/* En-tête avec titre et note moyenne */}
            <h3>{activite.titre}</h3>
            {activite.note_moyenne && (
              <div className="activity-rating">
                ⭐ {activite.note_moyenne.toFixed(1)}/5
              </div>
            )}
          {/* Description */}
          <div className="activity-description">
            {activite.description}
          </div>

          {/* Détails pratiques de l'activité */}
          <div className="activity-details">
            <div className="activity-tags">
              {/* Type d'activité */}
              {activite.type_activite && activite.type_activite !== 'autre' && (
                <div className="activity-tag type-tag">
                  🏷️ {activite.type_activite_display}
                </div>
              )}
              
              {/* Prix */}
              {activite.prix_estime && (
                <div className="activity-tag price-tag">
                  💰 {activite.prix_display}
                </div>
              )}
              
              {/* Âge minimum */}
              {activite.age_minimum !== null && activite.age_minimum !== undefined && (
                <div className="activity-tag age-tag">
                  👶 {activite.age_minimum === 0 ? 'Tous âges' : `${activite.age_minimum}+ ans`}
                </div>
              )}
            </div>
            
            {/* Options pratiques */}
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
            
            {/* Adresse précise */}
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

          {/* Informations de l'activité */}
          <div className="activity-info">
            <span>🏙️ {activite.lieu?.nom_ville}, {activite.lieu?.pays?.nom}</span>
            <span>📅 {new Date(activite.date_creation).toLocaleDateString('fr-FR')}</span>
          </div>

          {/* Statistiques des notes */}
          <div className="activity-stats">
            <span>
              📊 {activite.nombre_notes || 0} avis
            </span>
            {activite.note_moyenne && (
              <span className="average-rating">
                Note moyenne: {activite.note_moyenne.toFixed(1)}/5
              </span>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="actions">  
            <button
              onClick={(e) => {
      e.stopPropagation(); openEditForm(activite)}}
              className="edit-button"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={(e) => {
      e.stopPropagation(); handleDeleteActivite(activite.id)}}
              className="delete"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
  {mesActivites.length > 3 && (
  <div className="pagination-controls">
    {displayedActivitesCount > 3 && (
      <button 
        onClick={showLessActivites}
        className="pagination-button"
      >
        <ArrowUpSVG />
      </button>
    )}
    {displayedActivitesCount < mesActivites.length && (
      <button 
        onClick={showMoreActivites}
        className="pagination-button"
      >
        <ArrowDownSVG />
      </button>
    )}
  </div>
)}
      </div>
{/* Modal du formulaire d'activité */}
{showActiviteForm && selectedLieu && (
  <div className="loading-overlay">
    <div className="modal-card">
      <div className="modal-header">
        <h2 className="section-title" style={{ margin: 0 }}>
          ✨ Nouvelle Activité
        </h2>
        <button
          onClick={closeActiviteForm}
          className="close"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleCreateActivite}>
        {/* Destination (read-only) */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            🏙️ Destination
          </label>
          <input
            type="text"
            className="input disabled-input"
            value={`${selectedLieu.nom_ville}, ${selectedLieu.pays.nom}`}
            readOnly
          />
        </div>

        {/* Titre de l'activité */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            🎯 Titre de l'activité *
          </label>
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
        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label className="form-label">
            📝 Description *
          </label>
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
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            💰 Prix estimé (€)
          </label>
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
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            👶 Âge minimum requis
          </label>
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
          <span className="form-hint">
            💡 Mettre 0 pour "Tous âges"
          </span>
        </div>

        {/* Type d'activité */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            🏷️ Type d'activité
          </label>
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
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">
            📍 Adresse précise
          </label>
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
        <div className="checkbox-group" style={{ marginBottom: '25px' }}>
          {/* Transport public */}
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

          {/* Réservation requise */}
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

        {/* Gestion des médias */}
        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label className="form-label">
            📸 Médias (images/vidéos)
          </label>
          
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
            <p className="file-upload-subhint">
              Formats supportés: JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV (max 10MB par fichier)
            </p>
          </div>
          
          {/* Aperçu des fichiers sélectionnés */}
          {activiteFormData.medias.length > 0 && (
            <div className="media-preview-section">
              <div className="media-header">
                📁 Fichiers sélectionnés ({activiteFormData.medias.length})
              </div>
              <div className="media-preview-grid">
                {activiteFormData.medias.map((file, index) => (
                  <div key={index} className="media-preview-item">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
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
                    
                    <div className="media-preview-filename">
                      {file.name.length > 20 
                        ? file.name.substring(0, 20) + '...'
                        : file.name
                      }
                    </div>
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
            onClick={closeActiviteForm}
            className="cancel"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`auth-button ${isLoading ? 'disabled' : ''}`}
          >
            {isLoading ? '⏳ Création...' : '✨ Créer l\'activité'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{/* Modal de modification d'activité */}
{showEditForm && editingActivite && (
  <div className="loading-overlay">
    <div className="card modal-card">
      <div className="modal-header">
        <h2 style={{ margin: 0 }}>✏️ Modifier l'Activité</h2>
        <button
          onClick={closeEditForm}
          className="close"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleEditActivite} className="form-container">
        {/* Destination (read-only) */}
        <div className="form-group">
          <label className="form-label">🏙️ Destination</label>
          <input
            type="text"
            className="input disabled-input"
            value={`${editingActivite.lieu?.nom_ville}, ${editingActivite.lieu?.pays?.nom}`}
            readOnly
          />
        </div>

        {/* Titre de l'activité */}
        <div className="form-group">
          <label className="form-label">🎯 Titre de l'activité *</label>
          <input
            type="text"
            name="titre"
            className="input"
            value={editFormData.titre}
            onChange={handleEditInputChange}
            required
            placeholder="Ex: Visite du Louvre, Dégustation de vins..."
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">📝 Description *</label>
          <textarea
            name="description"
            className="input textarea"
            value={editFormData.description}
            onChange={handleEditInputChange}
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
            name="prix_estime"
            className="input"
            value={editFormData.prix_estime}
            onChange={handleEditInputChange}
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
            name="age_minimum"
            className="input"
            value={editFormData.age_minimum}
            onChange={handleEditInputChange}
            min="0"
            max="120"
            placeholder="0"
          />
          <small className="form-hint">💡 Mettre 0 pour "Tous âges"</small>
        </div>

        {/* Type d'activité */}
        <div className="form-group">
          <label className="form-label">🏷️ Type d'activité</label>
          <select
            name="type_activite"
            className="input"
            value={editFormData.type_activite}
            onChange={handleEditInputChange}
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
            name="adresse_precise"
            className="input"
            value={editFormData.adresse_precise}
            onChange={handleEditInputChange}
            placeholder="Rue, numéro, code postal..."
          />
        </div>

        {/* Options pratiques */}
        <div className="form-group checkbox-group">
          {/* Transport public */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="transport_public"
              checked={editFormData.transport_public}
              onChange={(e) => setEditFormData(prev => ({
                ...prev,
                transport_public: e.target.checked
              }))}
              className="checkbox-input"
            />
            <span>🚌 Transport public</span>
          </label>

          {/* Réservation requise */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="reservation_requise"
              checked={editFormData.reservation_requise}
              onChange={(e) => setEditFormData(prev => ({
                ...prev,
                reservation_requise: e.target.checked
              }))}
              className="checkbox-input"
            />
            <span>📅 Réservation requise</span>
          </label>
        </div>

        {/* Boutons d'action */}
        <div className="form-actions">
          <button
            type="button"
            onClick={closeEditForm}
            className="cancel"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`auth-button ${isLoading ? 'disabled' : ''}`}
            style={{ backgroundColor: '#ffc107', color: '#212529' }}
          >
            {isLoading ? '⏳ Modification...' : '✏️ Modifier l\'activité'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default Dashboard; 