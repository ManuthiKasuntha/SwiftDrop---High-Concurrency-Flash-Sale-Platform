import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl mb-8">My Profile</h1>

      <div className="card mb-8">
        <h2 className="text-xl mb-4 border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>Account Details</h2>
        <div className="flex flex-col gap-2">
          <div className="flex">
            <span className="text-secondary w-32">Display Name</span>
            <span className="font-medium">{user?.displayName}</span>
          </div>
          <div className="flex">
            <span className="text-secondary w-32">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex mt-2">
            <span className="text-secondary w-32">Role</span>
            <span className={`badge badge-${user?.role === 'ADMIN' ? 'locked' : 'live'}`}>{user?.role}</span>
          </div>
        </div>
      </div>
      
      {/* Mocked Order History for this implementation */}
      <div className="card">
        <h2 className="text-xl mb-4 border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>Order History</h2>
        <p className="text-muted text-sm">Order history logic would be populated here.</p>
      </div>
    </div>
  );
};

export default Profile;
