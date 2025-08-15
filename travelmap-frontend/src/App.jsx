import React, { useState, useEffect } from 'react';
import './App.css';
import Index from './Index';
import Login from './Login';
import Register from './Register';
import Trip from './Trip';
import Profile from './Profile';
import Dashboard from './Dashboard';
import Lieu from './Lieu';
import Navbar from './Navbar';
import Activites from './Activites';
import Favoris from './Favoris';
import UserPublicProfile from './UserPublicProfile';
import defaultImage from './assets/default_profile.png';

const App = () => {
  const [currentPage, setCurrentPage] = useState('Index');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [lieuData, setLieuData] = useState(null);
  const [lieuId, setLieuId] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(defaultImage);
  const [viewingUserId, setViewingUserId] = useState(null); 

  // Charger le thème sauvegardé et les données utilisateur
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 🎯 Charger l'image de profil spécifique à l'utilisateur
      const userSpecificImageKey = `userProfileImage_${parsedUser.id}`;
      const userSpecificImage = localStorage.getItem(userSpecificImageKey);
      setUserProfileImage(userSpecificImage || defaultImage);
      
      // 🎯 Nettoyer les anciennes clés localStorage pour éviter les conflits
      const oldKeys = ['userProfileImage'];
      oldKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`🧹 Nettoyage de l'ancienne clé: ${key}`);
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogin = (token) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 🎯 Charger l'image de profil spécifique à l'utilisateur connecté
      const userSpecificImageKey = `userProfileImage_${parsedUser.id}`;
      const userSpecificImage = localStorage.getItem(userSpecificImageKey);
      setUserProfileImage(userSpecificImage || defaultImage);
      
      // 🎯 Charger silencieusement l'image depuis l'API si nécessaire
      setTimeout(() => {
        loadUserProfileImageSilently();
      }, 100);
    }
    setIsAuthenticated(true);
    setCurrentPage('Index');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // 🎯 Nettoyer l'image de profil et remettre l'image par défaut
    setUserProfileImage(defaultImage);
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('Index');
  };

  // Fonction pour naviguer vers un lieu
  const navigateToLieu = (lieuId, lieuData) => {
    setLieuId(lieuId);
    setLieuData(lieuData);
    setCurrentPage('Lieu');
  };

  // Fonction pour naviguer vers le profil d'un autre utilisateur
  const navigateToUserProfile = (userId) => {
    setViewingUserId(userId);
    setCurrentPage('UserPublicProfile');
  };

  // Fonction pour revenir en arrière depuis un profil public
  const navigateBackFromUserProfile = () => {
    setViewingUserId(null);
    setCurrentPage('Index');
  };

  // Fonction pour retourner à l'accueil
  const navigateBackToIndex = () => {
    setCurrentPage('Index');
    setLieuId(null);
    setLieuData(null);
  };

const loadUserProfile = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/profile/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }

    const data = await response.json();
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (userData) {
      const updatedUser = { 
        ...userData, 
        profile_image: data.profile_image 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
};

// Nouvelle fonction pour charger l'image de profil depuis l'API
const loadUserProfileImage = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch('http://localhost:8000/api/profile/detail/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Réponse API profil:', data); // Debug
      
      // Mettre à jour l'image de profil avec l'URL du serveur
      if (data.profile_image_url) {
          // Construire l'URL complète si nécessaire
          let imageUrl = data.profile_image_url;
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
          
          // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
          setUserProfileImage(imageUrl);
          if (user && user.id) {
            const userSpecificImageKey = `userProfileImage_${user.id}`;
            localStorage.setItem(userSpecificImageKey, imageUrl);
          }
          
          // Mettre à jour l'utilisateur dans le state
          const userData = JSON.parse(localStorage.getItem('user'));
          const updatedUser = { ...userData, profile_image: imageUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Message de confirmation
          alert('Photo de profil enregistrée avec succès !');
        } else if (data.profile_image) {
          // Fallback avec profile_image
          let imageUrl = data.profile_image;
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
          
          // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
          setUserProfileImage(imageUrl);
          if (user && user.id) {
            const userSpecificImageKey = `userProfileImage_${user.id}`;
            localStorage.setItem(userSpecificImageKey, imageUrl);
          }
          
          const userData = JSON.parse(localStorage.getItem('user'));
          const updatedUser = { ...userData, profile_image: imageUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          alert('Photo de profil enregistrée avec succès !');
        } else {
          console.log('Aucune URL d\'image trouvée dans la réponse'); // Debug
          console.log('Champs disponibles:', Object.keys(data)); // Debug
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
  }
};

// 🎯 Nouvelle fonction pour charger silencieusement l'image de profil (sans messages)
const loadUserProfileImageSilently = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch('http://localhost:8000/api/profile/detail/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('🎯 Chargement silencieux du profil:', data); // Debug
      
      // Mettre à jour l'image de profil avec l'URL du serveur
      if (data.profile_image_url) {
          // Construire l'URL complète si nécessaire
          let imageUrl = data.profile_image_url;
          
          if (imageUrl && !imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('/media/')) {
              imageUrl = `http://localhost:8000${imageUrl}`;
            } else if (imageUrl.startsWith('media/')) {
              imageUrl = `http://localhost:8000/${imageUrl}`;
            } else {
              imageUrl = `http://localhost:8000/media/${imageUrl}`;
            }
          }
          
          console.log('🎯 Image de profil chargée silencieusement:', imageUrl); // Debug
          
          // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
          setUserProfileImage(imageUrl);
          if (user && user.id) {
            const userSpecificImageKey = `userProfileImage_${user.id}`;
            localStorage.setItem(userSpecificImageKey, imageUrl);
          }
          
          // Mettre à jour l'utilisateur dans le state
          const userData = JSON.parse(localStorage.getItem('user'));
          const updatedUser = { ...userData, profile_image: imageUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
        } else if (data.profile_image) {
          // Fallback avec profile_image
          let imageUrl = data.profile_image;
          
          if (imageUrl && !imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('/media/')) {
              imageUrl = `http://localhost:8000${imageUrl}`;
            } else if (imageUrl.startsWith('media/')) {
              imageUrl = `http://localhost:8000/${imageUrl}`;
            } else {
              imageUrl = `http://localhost:8000/media/${imageUrl}`;
            }
          }
          
          console.log('🎯 Image de profil chargée silencieusement (fallback):', imageUrl); // Debug
          
          // 🎯 Mettre à jour l'image de profil spécifique à l'utilisateur
          setUserProfileImage(imageUrl);
          if (user && user.id) {
            const userSpecificImageKey = `userProfileImage_${user.id}`;
            localStorage.setItem(userSpecificImageKey, imageUrl);
          }
          
          const userData = JSON.parse(localStorage.getItem('user'));
          const updatedUser = { ...userData, profile_image: imageUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
        } else {
          console.log('🎯 Aucune image trouvée, utilisation de l\'image par défaut'); // Debug
          // Utiliser l'image par défaut sans afficher d'erreur
          setUserProfileImage(defaultImage);
          if (user && user.id) {
            const userSpecificImageKey = `userProfileImage_${user.id}`;
            localStorage.setItem(userSpecificImageKey, defaultImage);
          }
        }
    } else {
      console.log('🎯 Erreur API lors du chargement silencieux, utilisation de l\'image par défaut'); // Debug
      // En cas d'erreur, utiliser l'image par défaut sans afficher d'alerte
      setUserProfileImage(defaultImage);
      if (user && user.id) {
        const userSpecificImageKey = `userProfileImage_${user.id}`;
        localStorage.setItem(userSpecificImageKey, defaultImage);
      }
    }
  } catch (error) {
    console.error("🎯 Erreur lors du chargement silencieux de l'image de profil:", error);
    // En cas d'erreur, utiliser l'image par défaut sans afficher d'alerte
    setUserProfileImage(defaultImage);
    if (user && user.id) {
      const userSpecificImageKey = `userProfileImage_${user.id}`;
      localStorage.setItem(userSpecificImageKey, defaultImage);
    }
  }
};

const uploadProfileImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('profile_image', file);

    const response = await fetch('http://localhost:8000/api/profile/update/', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData
    });

    const data = await response.json();
    if (response.ok) {
      // Forcez le rafraîchissement en ajoutant un timestamp
      const imageUrl = `${data.profile_image_url}?t=${Date.now()}`;
      setUserProfileImage(imageUrl);
      localStorage.setItem('userProfileImage', imageUrl);
      
      // Mettez à jour également l'utilisateur dans le localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { 
        ...userData, 
        profile_image: imageUrl 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return imageUrl;
    }
    throw new Error(data.error || 'Upload failed');
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

const updateUserBio = async (newBio) => {
  const response = await fetch('http://localhost:8000/api/profile/update/', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bio: newBio })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update bio');
  }
  return await response.json();
};

  useEffect(() => {
  if (isAuthenticated) {
    loadUserProfile();
    loadUserProfileImageSilently(); // 🎯 Charger l'image de profil silencieusement au démarrage
  }
}, [isAuthenticated]);

  const renderPage = () => {
    switch(currentPage) {
      case 'Index': 
        return <Index onNavigateToLieu={navigateToLieu} />;
      case 'Login': 
        return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case 'Register': 
        return <Register onRegister={handleLogin} onNavigate={setCurrentPage} />;
      case 'Trip': 
        return <Trip />;
      case 'Dashboard': 
        return <Dashboard />;
      case 'Lieu': 
        return <Lieu 
          lieuId={lieuId} 
          lieuData={lieuData} 
          onNavigateBack={navigateBackToIndex}
          setViewingUserId={setViewingUserId}
          setCurrentPage={setCurrentPage}
        />;
     case 'Profile': 
        return <Profile onLogout={handleLogout} 
      user={user} 
      userProfileImage={userProfileImage} 
      setUserProfileImage={setUserProfileImage}
      uploadProfileImage={uploadProfileImage}
      updateUserBio={updateUserBio} 
      viewingUserId={viewingUserId}
      setViewingUserId={setViewingUserId}/>;
      case 'Activites': 
        return <Activites />;
      case 'Favoris':
        return <Favoris 
          onNavigateBack={() => setCurrentPage('Index')}
          setCurrentPage={setCurrentPage}
          onNavigateToLieu={navigateToLieu}
        />;
      case 'UserPublicProfile':
        return <UserPublicProfile 
          userId={viewingUserId} 
          onNavigateBack={navigateBackFromUserProfile}
        />;
      default: 
        return <Index onNavigateToLieu={navigateToLieu} />;
    }
  };

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <Navbar 
        isAuthenticated={isAuthenticated}
        userProfileImage={userProfileImage}
        setCurrentPage={setCurrentPage}
        handleLogout={handleLogout}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        user={user}
      />
      
      <div>
        {renderPage()}
      </div>
    </div>
  );
};

export default App;