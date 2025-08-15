import React from 'react';
import './App.css';

const Footer = ({ isDarkMode }) => {
  return (
    <footer className={`footer-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="footer-content">
        <div className="footer-row">
          <ul>
            <li><a href="#">Nous contacter</a></li>
            <li><a href="#">Politique de confidentialité</a></li>
            <li><a href="#">Conditions générales</a></li>
          </ul>
        </div>

        <div className="footer-row">
          TravelMap Copyright © {new Date().getFullYear()} - Tous droits réservés
        </div>
      </div>
    </footer>
  );
};

export default Footer;