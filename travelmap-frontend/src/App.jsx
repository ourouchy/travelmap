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
    const savedProfileImage = localStorage.getItem('userProfileImage');
    
    if (token && userData) {
      setIsAuthenticated(true);
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
     
      setUserProfileImage(savedProfileImage || defaultImage);
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
      setUser(JSON.parse(userData));
    }
    setIsAuthenticated(true);
    setCurrentPage('Index');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
    
    // Mettre à jour les données utilisateur avec les nouvelles infos
    const updatedUser = {
      ...userData,
      bio: data.bio || userData.bio,
      profile_image: data.profile_image || userData.profile_image
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    if (data.profile_image) {
      setUserProfileImage(data.profile_image);
      localStorage.setItem('userProfileImage', data.profile_image);
    } else {
      setUserProfileImage(defaultImage);
      localStorage.setItem('userProfileImage', defaultImage);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    // Vous pourriez vouloir déconnecter l'utilisateur ici si le token est invalide
    if (error.message.includes('401')) {
      handleLogout();
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
      updateUserBio={updateUserBio} />;
      viewingUserId={viewingUserId}
      setViewingUserId={setViewingUserId}
      case 'Activites': 
        return <Activites />;
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