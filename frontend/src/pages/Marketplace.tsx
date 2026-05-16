import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Clock } from 'lucide-react';

interface EventItem {
  id: string;
  name: string;
  price: number;
}

interface Event {
  id: string;
  name: string;
  coverPhoto: string;
  goLiveTime: string;
  status: 'LOCKED' | 'LIVE' | 'CLOSED';
  items: EventItem[];
}

// Client-side countdown component
const Countdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft('Starting any moment...');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days > 0 ? `${days}d ` : ''}${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-display font-bold">{timeLeft}</span>;
};

const Marketplace: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api('/events');
        setEvents(data.events);
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading events...</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Featured Drops</h1>
        <p className="text-secondary">Exclusive limited-quantity imports at unbeatable prices.</p>
      </div>

      <div className="flex flex-col gap-8">
        {events.length === 0 ? (
          <p className="text-muted">No events currently scheduled.</p>
        ) : (
          events.map(event => (
            <Link to={`/event/${event.id}`} key={event.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                <img 
                  src={event.coverPhoto} 
                  alt={event.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <span className={`badge badge-${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.9))', padding: '2rem 1.5rem 1rem' }}>
                  <h2 className="text-2xl text-primary m-0" style={{ color: 'white' }}>{event.name}</h2>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                {event.status === 'LOCKED' && (
                  <div className="flex items-center gap-2 text-accent-warning mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                    <Clock size={20} />
                    <span>Opens in: </span>
                    <Countdown targetDate={event.goLiveTime} />
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg mb-2">Included Items:</h3>
                  <div className="flex flex-col gap-2">
                    {event.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'var(--bg-base)' }}>
                        <span className="font-medium">{item.name}</span>
                        <span className="font-bold text-accent-primary">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Marketplace;
