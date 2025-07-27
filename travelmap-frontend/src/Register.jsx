import React, { useState } from 'react';
import './App.css';

const Register = ({ onRegister, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister('fake-token');
  };

  return (
    <div className="form-container">
      <div className="card">
        <h2>Créer un compte</h2>
        <form onSubmit={handleSubmit} className="form-group">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Nom complet</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Adresse email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <button type="submit" className="auth-button">
            S'inscrire
          </button>

          <div className="auth-footer">
            <p>Déjà un compte ? <a onClick={() => onNavigate('Login')}> Se connecter </a> </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;