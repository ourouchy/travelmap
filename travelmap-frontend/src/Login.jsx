import React, { useState } from 'react';
import './App.css';

const Login = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin('fake-token');
  };

  return (
    <div className="form-container">
      <div className="card">
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit} className="form-group">
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
            Se connecter
          </button>

          <div className="auth-footer">
            <p>Pas encore de compte ?
                <a onClick={() => onNavigate('Register')}> S'inscrire </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;