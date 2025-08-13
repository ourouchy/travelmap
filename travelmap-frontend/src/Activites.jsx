import React, { useState, useEffect } from 'react';

const Activites = () => {
  const [lieuxVisites, setLieuxVisites] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // États du formulaire
  const [showForm, setShowForm] = useState(false);
  const [selectedLieu, setSelectedLieu] = useState(null);
  const [formData, setFormData] = useState({
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

  // États pour la gestion des activités
  const [mesActivites, setMesActivites] = useState([]);
  const [isLoadingActivites, setIsLoadingActivites] = useState(false);
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

  // Charger les voyages de l'utilisateur
  useEffect(() => {
    if (isAuthenticated) {
      fetchVoyages();
      fetchMesActivites();
    }
  }, [isAuthenticated]);

  // Extraire les lieux uniques visités
  useEffect(() => {
    if (voyages.length > 0) {
      const lieuxMap = new Map();
      voyages.forEach(voyage => {
        if (!lieuxMap.has(voyage.lieu.id)) {
          lieuxMap.set(voyage.lieu.id, {
            id: voyage.lieu.id,
            nom_ville: voyage.lieu.nom_ville,
            pays: voyage.lieu.pays,
            nombre_voyages: 1,
            dernier_voyage: voyage.date_debut
          });
        } else {
          const lieu = lieuxMap.get(voyage.lieu.id);
          lieu.nombre_voyages++;
          // Garder la date la plus récente
          if (new Date(voyage.date_debut) > new Date(lieu.dernier_voyage)) {
            lieu.dernier_voyage = voyage.date_debut;
          }
        }
      });
      
      // Trier par date de dernier voyage (plus récent en premier)
      const lieuxArray = Array.from(lieuxMap.values()).sort((a, b) => 
        new Date(b.dernier_voyage) - new Date(a.dernier_voyage)
      );
      
      setLieuxVisites(lieuxArray);
    }
  }, [voyages]);

  // Récupérer les activités de l'utilisateur
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
        // Filtrer pour ne garder que les activités créées par l'utilisateur connecté
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

  // Récupérer les voyages de l'utilisateur
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

  // Ouvrir le formulaire pour un lieu spécifique
  const openForm = (lieu) => {
    setSelectedLieu(lieu);
    setFormData({
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
    setShowForm(true);
  };

  // Fermer le formulaire
  const closeForm = () => {
    setShowForm(false);
    setSelectedLieu(null);
    setFormData({
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

  // Gestion des changements du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Créer une activité
  const handleCreateActivite = async (e) => {
    e.preventDefault();
    
    if (!formData.titre.trim() || !formData.description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Utiliser FormData pour envoyer les fichiers
      const formDataToSend = new FormData();
      formDataToSend.append('titre', formData.titre.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('lieu_id', formData.lieu_id);
      
      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.prix_estime) {
        formDataToSend.append('prix_estime', formData.prix_estime);
      }
      if (formData.age_minimum !== '') {
        formDataToSend.append('age_minimum', formData.age_minimum);
      }
      if (formData.type_activite && formData.type_activite !== 'autre') {
        formDataToSend.append('type_activite', formData.type_activite);
      }
      if (formData.adresse_precise.trim()) {
        formDataToSend.append('adresse_precise', formData.adresse_precise.trim());
      }
      formDataToSend.append('transport_public', formData.transport_public);
      formDataToSend.append('reservation_requise', formData.reservation_requise);
      
      // Ajouter les fichiers médias
      formData.medias.forEach((file, index) => {
        formDataToSend.append('medias', file);
      });
      
      const response = await fetch('http://localhost:8000/api/activites/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Ne pas mettre Content-Type pour FormData, il sera automatiquement défini
        },
        body: formDataToSend
      });

      if (response.ok) {
        const activite = await response.json();
        console.log('✅ Activité créée:', activite);
        
        // Fermer le formulaire et recharger si nécessaire
        closeForm();
        setError(null);
        
        // Recharger la liste des activités
        await fetchMesActivites();
        
        // Optionnel : afficher un message de succès
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

  // Ouvrir le formulaire de modification
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

  // Fermer le formulaire de modification
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

  // Gestion des changements du formulaire de modification
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Modifier une activité
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
        
        // Fermer le formulaire et recharger
        closeEditForm();
        setError(null);
        
        // Recharger la liste des activités
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

  // Supprimer une activité
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
        
        // Recharger la liste des activités
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

  // Formater une date
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>🎯 Mes Activités</h1>
      
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Chargement de vos destinations...</p>
        </div>
      ) : lieuxVisites.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>🚀 Aucune destination visitée</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Vous n'avez pas encore de voyages enregistrés.
          </p>
          <p style={{ color: '#6c757d' }}>
            Créez d'abord un voyage pour pouvoir ajouter des activités !
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#495057', marginBottom: '15px' }}>
              📍 Vos Destinations Visitées ({lieuxVisites.length})
            </h2>
            <p style={{ color: '#6c757d', fontSize: '0.9em' }}>
              Cliquez sur une destination pour y ajouter une activité
            </p>
          </div>

          {/* Liste des lieux visités */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {lieuxVisites.map((lieu) => (
              <div
                key={lieu.id}
                onClick={() => openForm(lieu)}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  e.target.style.borderColor = '#007bff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.target.style.borderColor = '#e9ecef';
                }}
              >
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ 
                    margin: '0 0 5px 0', 
                    color: '#333',
                    fontSize: '1.2em'
                  }}>
                    🏙️ {lieu.nom_ville}
                  </h3>
                  <p style={{ 
                    margin: '0', 
                    color: '#666', 
                    fontSize: '1em',
                    fontWeight: '500'
                  }}>
                    🇺🇳 {lieu.pays.nom}
                  </p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9em',
                  color: '#6c757d'
                }}>
                  <span>🛫 {lieu.nombre_voyages} voyage{lieu.nombre_voyages > 1 ? 's' : ''}</span>
                  <span>📅 {formatDate(lieu.dernier_voyage)}</span>
                </div>

                <div style={{
                  marginTop: '15px',
                  padding: '8px 12px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  borderRadius: '20px',
                  fontSize: '0.8em',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  ✨ Cliquer pour ajouter une activité
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Section Mes Activités */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px', color: '#495057' }}>
          🎯 Mes Activités Créées ({mesActivites.length})
        </h2>
        
        {isLoadingActivites ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            <p>Chargement de vos activités...</p>
          </div>
        ) : mesActivites.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>🚀 Aucune activité créée</h3>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Vous n'avez pas encore créé d'activités.
            </p>
            <p style={{ color: '#6c757d' }}>
              Cliquez sur une destination ci-dessus pour commencer !
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {mesActivites.map((activite) => (
              <div
                key={activite.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
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
                {/* En-tête avec titre et note moyenne */}
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
                  <span>🏙️ {activite.lieu?.nom_ville}, {activite.lieu?.pays?.nom}</span>
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

                {/* Boutons d'action */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => openEditForm(activite)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e0a800'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ffc107'}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteActivite(activite.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
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

      {/* Modal du formulaire */}
      {showForm && selectedLieu && (
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
                ✨ Nouvelle Activité
              </h2>
              <button
                onClick={closeForm}
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

            <form onSubmit={handleCreateActivite}>
              {/* Destination (read-only) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  🏙️ Destination
                </label>
                <input
                  type="text"
                  value={`${selectedLieu.nom_ville}, ${selectedLieu.pays.nom}`}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Titre de l'activité */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  🎯 Titre de l'activité *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Visite du Louvre, Dégustation de vins..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  📝 Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Décrivez votre activité, vos impressions, conseils..."
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

              {/* Prix estimé */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  💰 Prix estimé (€)
                </label>
                <input
                  type="number"
                  name="prix_estime"
                  value={formData.prix_estime}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Âge minimum */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  👶 Âge minimum requis
                </label>
                <input
                  type="number"
                  name="age_minimum"
                  value={formData.age_minimum}
                  onChange={handleInputChange}
                  min="0"
                  max="120"
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
                <small style={{ 
                  color: '#6c757d', 
                  fontSize: '0.8em',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  💡 Mettre 0 pour "Tous âges"
                </small>
              </div>

              {/* Type d'activité */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  🏷️ Type d'activité
                </label>
                <select
                  name="type_activite"
                  value={formData.type_activite}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  📍 Adresse précise
                </label>
                <input
                  type="text"
                  name="adresse_precise"
                  value={formData.adresse_precise}
                  onChange={handleInputChange}
                  placeholder="Rue, numéro, code postal..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Options pratiques */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  {/* Transport public */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      name="transport_public"
                      checked={formData.transport_public}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        transport_public: e.target.checked
                      }))}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontSize: '0.9em', color: '#495057' }}>
                      🚌 Transport public
                    </span>
                  </label>

                  {/* Réservation requise */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      name="reservation_requise"
                      checked={formData.reservation_requise}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reservation_requise: e.target.checked
                      }))}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontSize: '0.9em', color: '#495057' }}>
                      📅 Réservation requise
                    </span>
                  </label>
                </div>
              </div>

              {/* Gestion des médias */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  📸 Médias (images/vidéos)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setFormData(prev => ({
                      ...prev,
                      medias: files
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
                <small style={{ 
                  color: '#6c757d', 
                  fontSize: '0.8em',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  💡 Formats acceptés : JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV (max 10MB par fichier)
                </small>
                
                {/* Aperçu des fichiers sélectionnés */}
                {formData.medias.length > 0 && (
                  <div style={{ 
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ 
                      fontSize: '0.9em', 
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#495057'
                    }}>
                      📁 Fichiers sélectionnés ({formData.medias.length}) :
                    </div>
                    {formData.medias.map((file, index) => (
                      <div key={index} style={{ 
                        fontSize: '0.8em',
                        color: '#6c757d',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {file.type.startsWith('image/') ? '🖼️' : '🎥'} 
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={closeForm}
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
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1em',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.target.style.backgroundColor = '#0056b3';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) e.target.style.backgroundColor = '#007bff';
                  }}
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
                ✏️ Modifier l'Activité
              </h2>
              <button
                onClick={closeEditForm}
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

            <form onSubmit={handleEditActivite}>
              {/* Destination (read-only) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  🏙️ Destination
                </label>
                <input
                  type="text"
                  value={`${editingActivite.lieu?.nom_ville}, ${editingActivite.lieu?.pays?.nom}`}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Titre de l'activité */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  🎯 Titre de l'activité *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={editFormData.titre}
                  onChange={handleEditInputChange}
                  required
                  placeholder="Ex: Visite du Louvre, Dégustation de vins..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  📝 Description *
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  required
                  rows="4"
                  placeholder="Décrivez votre activité, vos impressions, conseils..."
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

              {/* Prix estimé */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  💰 Prix estimé (€)
                </label>
                <input
                  type="number"
                  name="prix_estime"
                  value={editFormData.prix_estime}
                  onChange={handleEditInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Âge minimum */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  👶 Âge minimum requis
                </label>
                <input
                  type="number"
                  name="age_minimum"
                  value={editFormData.age_minimum}
                  onChange={handleEditInputChange}
                  min="0"
                  max="120"
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
                <small style={{ 
                  color: '#6c757d', 
                  fontSize: '0.8em',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  💡 Mettre 0 pour "Tous âges"
                </small>
              </div>

              {/* Type d'activité */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  🏷️ Type d'activité
                </label>
                <select
                  name="type_activite"
                  value={editFormData.type_activite}
                  onChange={handleEditInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  📍 Adresse précise
                </label>
                <input
                  type="text"
                  name="adresse_precise"
                  value={editFormData.adresse_precise}
                  onChange={handleEditInputChange}
                  placeholder="Rue, numéro, code postal..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1em'
                  }}
                />
              </div>

              {/* Options pratiques */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  {/* Transport public */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      name="transport_public"
                      checked={editFormData.transport_public}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        transport_public: e.target.checked
                      }))}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontSize: '0.9em', color: '#495057' }}>
                      🚌 Transport public
                    </span>
                  </label>

                  {/* Réservation requise */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      name="reservation_requise"
                      checked={editFormData.reservation_requise}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        reservation_requise: e.target.checked
                      }))}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontSize: '0.9em', color: '#495057' }}>
                      📅 Réservation requise
                    </span>
                  </label>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={closeEditForm}
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
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1em',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.target.style.backgroundColor = '#e0a800';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) e.target.style.backgroundColor = '#ffc107';
                  }}
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

export default Activites; 