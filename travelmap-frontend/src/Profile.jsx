import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const Profile = ({ 
  userProfileImage, 
  setUserProfileImage, 
  user, 
  onLogout,
  uploadProfileImage,
  updateUserBio,
  viewingUserId,
  setViewingUserId
}) => {
  const [profileUser, setProfileUser] = useState(user);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [newBio, setNewBio] = useState(user?.bio || 'Une petite biographie ici...');
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
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
      const serverImageUrl = await uploadProfileImage(file);
      
      if (serverImageUrl) {
        setUserProfileImage(serverImageUrl);
        localStorage.setItem('userProfileImage', serverImageUrl);
        
        // Mettre à jour l'utilisateur dans le state
        const userData = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...userData, profile_image: serverImageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
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
      // Ici il faut implémenter la logique pour supprimer l'image sur le serveur      
      // Pour l'instant, on met l'image par défaut
      setUserProfileImage(defaultImage);
      localStorage.setItem('userProfileImage', defaultImage);
      
      const userData = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...userData, profile_image: defaultImage };
      localStorage.setItem('user', JSON.stringify(updatedUser));
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
    const success = await updateUserBio(newBio);
    if (success) {
      const updatedUser = { ...user, bio: newBio };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditBio(false);
    }
  } catch (error) {
    console.error("Erreur:", error);
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

  return (
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
  );
};

export default Profile;