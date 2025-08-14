import React, { useState, useRef, useEffect } from 'react';

const Navbar = ({ isAuthenticated, setCurrentPage, handleLogout, toggleTheme, isDarkMode, userProfileImage, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Image par défaut
  const defaultImage = '/assets/default_profile.png';

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="nav-group"> 
          <h1 className="logo" onClick={() => setCurrentPage('Index')}>TravelMap</h1>
          {isAuthenticated}
        </div>
        
        <div className="nav-group">
          {isAuthenticated ? (
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <div 
                className="profile-avatar-container"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="profile-avatar">
                  <img 
                    src={userProfileImage || defaultImage} 
                    alt="Profil utilisateur" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultImage;
                    }}
                  />
                </div>
              </div>
              
              {dropdownOpen && (
                <div className="profile-dropdown-menu">
                  <button onClick={() => {
                    setCurrentPage('Profile');
                    setDropdownOpen(false);
                  }}>
                    Profil
                  </button>
                  <button onClick={() => {
                    setCurrentPage('Dashboard');
                    setDropdownOpen(false);
                  }}>
                    Dashboard
                  </button>
                  <button onClick={() => {
                    handleLogout();
                    setDropdownOpen(false);
                  }}>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
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