import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const Profile = ({ 
  userProfileImage, 
  setUserProfileImage, 
  user, 
  onLogout,
  viewingUserId,
  setViewingUserId,
  onNavigateBack
}) => {
  const [editBio, setEditBio] = useState(false);
  const [newBio, setNewBio] = useState(user?.bio || 'Une petite biographie ici...');
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [userScore, setUserScore] = useState(0); // 🎯 Nouveau state pour le score
  const fileInputRef = useRef(null);
  const avatarMenuRef = useRef(null);

  const defaultImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

  const isCurrentUser = !viewingUserId || (user && user.id === viewingUserId);
  const profileTitle = isCurrentUser ? 'Mon profil' : `Profil de ${user?.username || 'l\'utilisateur'}`;

  // Gérer le clic en dehors du menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target) && 
          fileInputRef.current && !fileInputRef.current.contains(event.target)) {
        setShowAvatarMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    if (isCurrentUser) {
      setShowAvatarMenu(!showAvatarMenu);
    }
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setShowAvatarMenu(false);
    
    const file = e.target.files[0];
    const imageUrl = URL.createObjectURL(file);
    setUserProfileImage(imageUrl);

    try {
      setIsLoading(true);
      
      // Créer un FormData pour l'upload de fichier
      const formData = new FormData();
      formData.append('profile_image', file);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Vous devez être connecté pour changer votre photo de profil');
        return;
      }

      const response = await fetch('http://localhost:8000/api/profile/detail/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas mettre Content-Type pour FormData, Django le gère automatiquement
        },
        body: formData
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        console.log('Réponse API profil:', updatedProfile); // Debug
        
        // Mettre à jour l'image de profil avec l'URL du serveur
        if (updatedProfile.profile_image_url) {
            // Construire l'URL complète si nécessaire
            let imageUrl = updatedProfile.profile_image_url;
            console.log('URL reçue:', imageUrl); // Debug
            
            if (imageUrl && !imageUrl.startsWith('http')) {
              // Si c'est une URL relative, construire l'URL complète
              if (imageUrl.startsWith('/media/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
              } else if (imageUrl.startsWith('media/')) {
                imageUrl = `http://localhost:8000/${imageUrl}`;
              } else {
                imageUrl = `http://localhost:8000/media/${imageUrl}`;
              }
            }
            
            console.log('URL finale construite:', imageUrl); // Debug
            
            // Mettre à jour le state global (navbar) ET local
            setUserProfileImage(imageUrl);
            // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
            if (user && user.id) {
              const userSpecificImageKey = `userProfileImage_${user.id}`;
              localStorage.setItem(userSpecificImageKey, imageUrl);
            }
            localStorage.setItem('userProfileImage', imageUrl);
            
            // Mettre à jour l'utilisateur dans le state
            const userData = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...userData, profile_image: imageUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Message de confirmation
            alert('Photo de profil enregistrée avec succès !');
          } else if (updatedProfile.profile_image) {
            // Fallback: essayer avec profile_image au lieu de profile_image_url
            let imageUrl = updatedProfile.profile_image;
            console.log('Fallback - profile_image:', imageUrl); // Debug
            
            if (imageUrl && !imageUrl.startsWith('http')) {
              if (imageUrl.startsWith('/media/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
              } else if (imageUrl.startsWith('media/')) {
                imageUrl = `http://localhost:8000/${imageUrl}`;
              } else {
                imageUrl = `http://localhost:8000/media/${imageUrl}`;
              }
            }
            
            console.log('URL finale fallback:', imageUrl); // Debug
            
            // Mettre à jour le state global (navbar) ET local
            setUserProfileImage(imageUrl);
            // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
            if (user && user.id) {
              const userSpecificImageKey = `userProfileImage_${user.id}`;
              localStorage.setItem(userSpecificImageKey, imageUrl);
            }
            localStorage.setItem('userProfileImage', imageUrl);
            
            const userData = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...userData, profile_image: imageUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            alert('Photo de profil enregistrée avec succès !');
          } else {
            console.log('Aucune URL d\'image trouvée dans la réponse'); // Debug
            console.log('Champs disponibles:', Object.keys(updatedProfile)); // Debug
            alert('Photo uploadée mais URL non reçue');
          }
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la sauvegarde de la photo: ${errorData.error || 'Erreur inconnue'}`);
        // Revenir à l'image précédente en cas d'erreur
        setUserProfileImage(userProfileImage);
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de la mise à jour de l'image de profil");
      setUserProfileImage(userProfileImage); // Revenir à l'image précédente
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setShowAvatarMenu(false);
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Vous devez être connecté pour supprimer votre photo de profil');
        return;
      }

      // Envoyer une requête pour supprimer l'image (mettre à null)
      const response = await fetch('http://localhost:8000/api/profile/detail/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile_image: null })
      });

      if (response.ok) {
        // Mettre l'image par défaut
        setUserProfileImage(defaultImage);
        // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
        if (user && user.id) {
          const userSpecificImageKey = `userProfileImage_${user.id}`;
          localStorage.setItem(userSpecificImageKey, defaultImage);
        }
        localStorage.setItem('userProfileImage', defaultImage);
        
        const userData = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...userData, profile_image: defaultImage };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Message de confirmation
        alert('Photo de profil supprimée avec succès !');
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la suppression: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression de l'image de profil");
    } finally {
      setIsLoading(false);
    }
  };

const handleBioSave = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Vous devez être connecté pour sauvegarder votre bio');
      return;
    }

    const response = await fetch('http://localhost:8000/api/profile/detail/', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bio: newBio })
    });

    if (response.ok) {
      const updatedProfile = await response.json();
      
      // Mettre à jour l'utilisateur dans localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...userData, bio: updatedProfile.bio };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Fermer le mode édition
      setEditBio(false);
      
      // Message de confirmation
      alert('Bio enregistrée avec succès !');
    } else {
      const errorData = await response.json();
      alert(`Erreur lors de la sauvegarde: ${errorData.error || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la bio:", error);
    alert("Erreur lors de la sauvegarde de la bio");
  } finally {
    setIsLoading(false);
  }
};

  const handleBioClick = () => {
    setEditBio(true);
  };

  useEffect(() => {
    const loadProfileUser = async () => {
      if (viewingUserId && (!user || user.id !== viewingUserId)) {
        setIsLoadingProfile(true);
        try {
          const response = await fetch(`http://localhost:8000/api/users/${viewingUserId}/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          
          if (!response.ok) throw new Error('Failed to load user profile');
          
          const data = await response.json();
          setProfileUser(data);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Revenir au profil courant en cas d'erreur
          setViewingUserId(null);
          setProfileUser(user);
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
        setProfileUser(user);
      }
    };

    loadProfileUser();
  }, [viewingUserId, user]);

  // Charger le profil utilisateur depuis l'API au montage
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isCurrentUser) return; // Seulement pour l'utilisateur connecté
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:8000/api/profile/detail/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('Profil chargé depuis API:', profileData); // Debug
          
          // Mettre à jour la bio
          if (profileData.bio !== undefined) {
            setNewBio(profileData.bio || 'Une petite biographie ici...');
          }
          
          // Mettre à jour l'image de profil si elle existe
          if (profileData.profile_image_url) {
            let imageUrl = profileData.profile_image_url;
            console.log('Image trouvée dans API:', imageUrl); // Debug
            
            // Construire l'URL complète si nécessaire
            if (imageUrl && !imageUrl.startsWith('http')) {
              if (imageUrl.startsWith('/media/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
              } else if (imageUrl.startsWith('media/')) {
                imageUrl = `http://localhost:8000/${imageUrl}`;
              } else {
                imageUrl = `http://localhost:8000/media/${imageUrl}`;
              }
            }
            
            console.log('URL finale construite au chargement:', imageUrl); // Debug
            // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
            setUserProfileImage(imageUrl);
            if (user && user.id) {
              const userSpecificImageKey = `userProfileImage_${user.id}`;
              localStorage.setItem(userSpecificImageKey, imageUrl);
            }
            localStorage.setItem('userProfileImage', imageUrl);
          } else if (profileData.profile_image) {
            // Fallback avec profile_image
            let imageUrl = profileData.profile_image;
            console.log('Fallback - profile_image au chargement:', imageUrl); // Debug
            
            if (imageUrl && !imageUrl.startsWith('http')) {
              if (imageUrl.startsWith('/media/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
              } else if (imageUrl.startsWith('media/')) {
                imageUrl = `http://localhost:8000/${imageUrl}`;
              } else {
                imageUrl = `http://localhost:8000/media/${imageUrl}`;
              }
            }
            
            console.log('URL finale fallback au chargement:', imageUrl); // Debug
            // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
            setUserProfileImage(imageUrl);
            if (user && user.id) {
              const userSpecificImageKey = `userProfileImage_${user.id}`;
              localStorage.setItem(userSpecificImageKey, imageUrl);
            }
            localStorage.setItem('userProfileImage', imageUrl);
          } else {
            console.log('Aucune image trouvée dans l\'API, utilisation de l\'image par défaut'); // Debug
            // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
            setUserProfileImage(defaultImage);
            if (user && user.id) {
              const userSpecificImageKey = `userProfileImage_${user.id}`;
              localStorage.setItem(userSpecificImageKey, defaultImage);
            }
            localStorage.setItem('userProfileImage', defaultImage);
          }
          
          // Mettre à jour l'utilisateur dans le state
          if (user) {
            const updatedUser = { 
              ...user, 
              bio: profileData.bio,
              profile_image: profileData.profile_image_url || profileData.profile_image 
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
          
          // 🎯 Récupérer et stocker le score
          if (profileData.score_total !== undefined) {
            setUserScore(profileData.score_total);
            console.log('🎯 Score chargé depuis API:', profileData.score_total);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        // En cas d'erreur, utiliser l'image par défaut
        setUserProfileImage(defaultImage);
        localStorage.setItem('userProfileImage', defaultImage);
      }
    };

    loadUserProfile();
  }, [isCurrentUser, user]);

  return (
  <div>
      <div className="button-group">
        <button
          onClick={onNavigateBack}
          className="cancel"
        >
          ← Retour
        </button>
      </div>
    <div className="card profile">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <h1>{profileTitle}</h1>
      <div className="profile-avatar-wrapper">
        <div 
          className="profile-avatar-large" 
          onClick={handleAvatarClick}
          style={{ cursor: isCurrentUser ? 'pointer' : 'default' }}
        >
          <img 
            src={userProfileImage || defaultImage} 
            alt="Avatar" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultImage;
            }}
          />
        </div>
        
        {showAvatarMenu && isCurrentUser && (
          <div ref={avatarMenuRef} className="avatar-menu">
            <button 
              className="avatar-menu-item"
              onClick={() => fileInputRef.current.click()}
            >
              Changer la photo
            </button>
            <button 
              className="avatar-menu-item"
              onClick={handleRemoveAvatar}
            >
              Supprimer la photo
            </button>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*" 
          onChange={handleFileChange}
          className="visually-hidden"
        />
      </div>
          <div className="form-group">
            <h3>Biographie</h3>
            {editBio ? (
              <>
                <textarea
                  className="input profile-textarea"
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  rows="4"
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="auth-button" onClick={handleBioSave}>
                    Enregistrer
                  </button>
                  <button 
                    className="auth-button auth-button-secondary"
                    onClick={() => setEditBio(false)}
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div 
                className="profile-bio-content"
                onClick={isCurrentUser ? handleBioClick : null}
                style={{ cursor: isCurrentUser ? 'pointer' : 'default' }}
              >
                {newBio || "Cliquez pour ajouter une biographie..."}
              </div>
            )}
        </div>
          <div className="form-group">
          <h3>Informations du compte</h3>
          <div className="user-info">
              <label className="form-label">Nom d'utilisateur</label>
              <div className="input profile-info-field">
                {user?.username || 'Utilisateur'}
              </div>
            
              <label className="form-label">Adresse email</label>
              <div className="input profile-info-field">
                {user?.email || 'email@exemple.com'}
              </div>
            
              <label className="form-label">Membre depuis</label>
              <div className="input profile-info-field">
                {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '2023-01-01'}
              </div>

              {/* 🎯 Icône Score */}
              <label className="form-label">
                <span style={{ marginRight: '0.5rem' }}>🎯</span>
                Score total
              </label>
              <div className="input profile-info-field score-field">
                <span style={{ 
                  fontSize: '1.2em', 
                  fontWeight: 'bold', 
                  color: '#1976d2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>🏆</span>
                  {userScore} points
                </span>
              </div>
            </div>
          {isCurrentUser && (
            <button 
              className="auth-button" 
              onClick={onLogout}
              style={{ marginTop: '2rem' }}
            >
              Déconnexion
            </button>
            )}
          </div>
      </div>
    </div>
  );
};

export default Profile;