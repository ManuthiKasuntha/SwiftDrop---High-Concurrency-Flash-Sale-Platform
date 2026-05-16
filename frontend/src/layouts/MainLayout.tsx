import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, ShoppingBag, Shield } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <ShoppingBag size={28} color="var(--accent-primary)" />
            Swift<span>Drop</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem' }}>
                <Shield size={18} /> Admin Dashboard
              </Link>
            )}
            
            <Link to="/profile" className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem' }}>
              <UserIcon size={18} /> {user?.displayName}
            </Link>
            
            <button onClick={logout} className="btn btn-outline text-muted" style={{ padding: '0.5rem' }} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mt-8 pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
