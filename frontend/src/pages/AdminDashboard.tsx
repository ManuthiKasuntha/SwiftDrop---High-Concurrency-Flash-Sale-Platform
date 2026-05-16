import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const AdminDashboard: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api('/events/admin');
      setEvents(data.events);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api(`/events/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchEvents();
    } catch (e) {
      console.error(e);
      alert('Failed to change status');
    }
  };

  if (loading) return <div>Loading Admin Dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl mb-8">Admin Dashboard</h1>

      <div className="card">
        <h2 className="text-2xl mb-4 border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>Event Management</h2>
        
        <div className="flex flex-col gap-4">
          {events.map(event => (
            <div key={event.id} className="p-4 rounded" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-light)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium">{event.name}</h3>
                <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
              </div>
              
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div className="text-sm text-secondary">Total Revenue</div>
                  <div className="text-xl font-bold text-accent-success">${event.totalRevenue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">Units Sold</div>
                  <div className="text-xl font-bold">{event.totalUnitsSold}</div>
                </div>
              </div>

              <div className="flex gap-2">
                {event.status === 'LOCKED' && (
                  <button 
                    className="btn btn-outline text-accent-success"
                    onClick={() => handleStatusChange(event.id, 'LIVE')}
                  >
                    Force Open Event
                  </button>
                )}
                {event.status === 'LIVE' && (
                  <button 
                    className="btn btn-outline text-accent-danger"
                    onClick={() => handleStatusChange(event.id, 'CLOSED')}
                  >
                    Force Close Event
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
