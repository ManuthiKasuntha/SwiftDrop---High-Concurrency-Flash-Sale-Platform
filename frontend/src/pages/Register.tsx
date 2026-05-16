import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { ShoppingBag } from 'lucide-react';

const Register: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, password }),
      });
      
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-8">
          <div className="logo justify-center mb-2" style={{ fontSize: '2rem' }}>
            <ShoppingBag size={32} color="var(--accent-primary)" />
            Swift<span>Drop</span>
          </div>
          <p className="text-secondary">Create a new account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--text-primary)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Display Name</label>
            <input 
              type="text" 
              className="input" 
              required 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input 
              type="email" 
              className="input" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Already have an account? <Link to="/login" className="font-medium text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
