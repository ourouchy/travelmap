import React from 'react';

const Navbar = ({ isAuthenticated, setCurrentPage, handleLogout, toggleTheme, isDarkMode }) => {
  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="nav-group">
          <button onClick={() => setCurrentPage('Index')}>Accueil</button>
          <button onClick={() => setCurrentPage('Trip')}>Voyage</button>
        </div>
        
        <div className="nav-group">
          {isAuthenticated ? (
            <>
              <button onClick={() => setCurrentPage('Profile')}>Profil</button>
              <button onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <button onClick={() => setCurrentPage('Login')}>Connexion</button>
              <button onClick={() => setCurrentPage('Register')}>Inscription</button>
            </>
          )}
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;