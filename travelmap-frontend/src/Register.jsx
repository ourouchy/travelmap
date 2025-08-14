import React, { useState } from 'react';
import './App.css';

const Register = ({ onRegister, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email, // On utilise email comme username
          email: email,
          password: password,
          password2: password2,
          first_name: name.split(' ')[0] || name,
          last_name: name.split(' ').slice(1).join(' ') || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Stocker le token et les infos utilisateur
        localStorage.setItem('authToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        onRegister(data.access);
      } else {
        // Gérer les erreurs de validation
        if (data.username) {
          setError(`Nom d'utilisateur: ${data.username[0]}`);
        } else if (data.email) {
          setError(`Email: ${data.email[0]}`);
        } else if (data.password) {
          setError(`Mot de passe: ${data.password[0]}`);
        } else {
          setError('Erreur lors de l\'inscription');
        }
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="auth card">
        <h2>Créer un compte</h2>
        {error && <div className="error-message">{error}</div>}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password2" className="form-label">Confirmer le mot de passe</label>
            <input
              id="password2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="input"
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Inscription...' : 'S\'inscrire'}
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