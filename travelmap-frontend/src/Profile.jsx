import React from 'react';
import './App.css';

const Profile = ({ onLogout, user }) => {
  return (
    <div className="profile-container">
      <div className="card">
        <h2>Profil</h2>
        {user && (
          <div className="user-info">
            <p><strong>Nom d'utilisateur:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Prénom:</strong> {user.first_name}</p>
            <p><strong>Nom:</strong> {user.last_name}</p>
          </div>
        )}
        <button onClick={onLogout} className="auth-button">
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default Profile;