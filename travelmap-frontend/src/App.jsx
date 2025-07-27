import React, { useState, useEffect } from 'react';
import './App.css';
import Index from './Index';
import Login from './Login';
import Register from './Register';
import Trip from './Trip';
import Profile from './Profile';
import Navbar from './Navbar'; // Importez le nouveau composant Navbar

const App = () => {
  const [currentPage, setCurrentPage] = useState('Index');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Charger le thème sauvegardé
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    setCurrentPage('Index');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setCurrentPage('Index');
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'Index': return <Index />;
      case 'Login': return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case 'Register': return <Register onRegister={handleLogin} onNavigate={setCurrentPage} />;
      case 'Trip': return <Trip />;
      case 'Profile': return <Profile onLogout={handleLogout} />;
      default: return <Index />;
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
      />
      
      <div>
        {renderPage()}
      </div>
    </div>
  );
};

export default App;