import React from 'react';

const Profile = ({ onLogout }) => {
  return (
    <div>
      <h1>Profil</h1>
      <div>
        <h2>Informations du compte</h2>
        <p>Email: utilisateur@example.com</p>
        <p>Membre depuis: 01/01/2023</p>
        <button onClick={onLogout}> Déconnexion </button>
      </div>
    </div>
  );
};

export default Profile;