import React, { useState, useEffect } from 'react';
import './App.css';
import Index from './Index';
import Login from './Login';
import Register from './Register';
import Trip from './Trip';
import Profile from './Profile';
import Navbar from './Navbar';
import Lieu from './Lieu';

const App = () => {
  const [currentPage, setCurrentPage] = useState('Index');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [lieuData, setLieuData] = useState(null);
  const [lieuId, setLieuId] = useState(null);

  // Charger le thème sauvegardé
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
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
      case 'Profile': 
        return <Profile onLogout={handleLogout} user={user} />;
      case 'Lieu': 
        return <Lieu lieuId={lieuId} lieuData={lieuData} onNavigateBack={navigateBackToIndex} />;
      default: 
        return <Index onNavigateToLieu={navigateToLieu} />;
    }
  };

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <Navbar 
        isAuthenticated={isAuthenticated}
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