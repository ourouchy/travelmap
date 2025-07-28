import React, { useState, useEffect } from 'react';
import './App.css';
import Index from './Index';
import Login from './Login';
import Register from './Register';
import Trip from './Trip';
import Profile from './Profile';
import Navbar from './Navbar';
import NotFound from './NotFound';
import ServerError from './ServerError';
import Footer from './Footer';

const App = () => {
  const [currentPage, setCurrentPage] = useState('Index');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);

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

  const renderPage = () => {
    switch(currentPage) {
      case 'Index': return <Index />;
      case 'Login': return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case 'Register': return <Register onRegister={handleLogin} onNavigate={setCurrentPage} />;
      case 'Trip': return <Trip />;
      case 'Profile': return <Profile onLogout={handleLogout} user={user} />;
      case 'ServerError': return <ServerError />; // à terminer pour gérer les erreurs serveur/API
      default: return <NotFound />;
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
      <Footer />      
    </div>
  );
};

export default App;