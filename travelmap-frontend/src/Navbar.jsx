import React, { useState, useRef, useEffect } from 'react';

const Navbar = ({ isAuthenticated, setCurrentPage, handleLogout, toggleTheme, isDarkMode, userProfileImage, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [userScore, setUserScore] = useState(0);
  
  // Image par défaut
  const defaultImage = '/assets/default_profile.png';

  // Charger le score de l'utilisateur
  useEffect(() => {
    if (user && isAuthenticated) {
      const fetchUserScore = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/profile/detail/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserScore(data.score_total || 0);
          }
        } catch (error) {
          console.error("Erreur lors du chargement du score:", error);
        }
      };
      
      fetchUserScore();
    }
  }, [user, isAuthenticated]);

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
        </div>
        
        <div className="nav-group">
          {isAuthenticated ? (
            <>
              <div className="navbar-score">
                <span className="score-icon">🏆</span>
                <span className="score-value">{userScore} points</span>
              </div>
              
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
                      setCurrentPage('Favoris');
                      setDropdownOpen(false);
                    }}>
                      Favoris
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