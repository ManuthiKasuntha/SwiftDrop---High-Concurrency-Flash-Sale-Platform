import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getSSEUrl } from '../utils/api';
import { ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EventItem {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface EventDetailType {
  id: string;
  name: string;
  coverPhoto: string;
  status: 'LOCKED' | 'LIVE' | 'CLOSED';
  items: EventItem[];
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<{ type: 'success' | 'error' | 'payment', message: string, reservationId?: string, item?: any } | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await api(`/events/${id}`);
        setEvent(data.event);
        
        // If event is live, connect to SSE for real-time stock updates
        if (data.event.status === 'LIVE') {
          connectSSE();
        }
      } catch (error) {
        console.error('Failed to fetch event', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [id]);

  const connectSSE = () => {
    if (eventSourceRef.current) return;

    const sse = new EventSource(getSSEUrl());
    
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'STOCK_UPDATE') {
          setEvent(prev => {
            if (!prev) return prev;
            const updatedItems = prev.items.map(item => 
              item.id === data.itemId ? { ...item, stock: data.stock } : item
            );
            
            // Check if all items are sold out to auto-close UI
            const allSoldOut = updatedItems.every(i => i.stock === 0);
            return { 
              ...prev, 
              items: updatedItems,
              status: allSoldOut ? 'CLOSED' : prev.status 
            };
          });
        }
      } catch (err) {
        console.error('SSE Error', err);
      }
    };

    eventSourceRef.current = sse;
  };

  const handleReserve = async (itemId: string) => {
    setPurchasingItemId(itemId);
    setPurchaseStatus(null);

    try {
      const data = await api('/purchase/reserve', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });

      // Show payment modal
      setPurchaseStatus({
        type: 'payment',
        message: data.message,
        reservationId: data.reservationId,
        item: data.item
      });
      
    } catch (error: any) {
      setPurchaseStatus({
        type: 'error',
        message: error.message || 'Failed to process request'
      });
    } finally {
      setPurchasingItemId(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!purchaseStatus?.item?.id) return;
    
    setPurchasingItemId('confirming');
    try {
      await api('/purchase/confirm', {
        method: 'POST',
        body: JSON.stringify({ itemId: purchaseStatus.item.id })
      });

      setPurchaseStatus({
        type: 'success',
        message: 'Order Confirmed! You secured the item.'
      });
      
    } catch (error: any) {
      setPurchaseStatus({
        type: 'error',
        message: error.message || 'Payment failed'
      });
    } finally {
      setPurchasingItemId(null);
    }
  };

  const handleCancelReservation = async () => {
    if (!purchaseStatus?.item?.id) {
      setPurchaseStatus(null);
      return;
    }
    
    try {
      await api('/purchase/cancel', {
        method: 'POST',
        body: JSON.stringify({ itemId: purchaseStatus.item.id })
      });
    } catch (e) {
      console.error(e);
    }
    setPurchaseStatus(null);
  };

  if (loading) return <div className="text-center mt-8">Loading event...</div>;
  if (!event) return <div className="text-center mt-8">Event not found</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <button className="btn btn-outline" onClick={() => navigate('/')}>&larr; Back</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
          <img 
            src={event.coverPhoto} 
            alt={event.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
            <span className={`badge badge-${event.status.toLowerCase()}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              {event.status}
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))', padding: '3rem 2rem 2rem' }}>
            <h1 className="text-3xl font-display m-0" style={{ color: 'white' }}>{event.name}</h1>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {event.status === 'LOCKED' && (
            <div className="mb-6 p-4 rounded text-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <h3 className="text-accent-warning text-xl mb-1">Event is Locked</h3>
              <p className="text-secondary">Purchasing will be enabled when the event goes live.</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {event.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-light)' }}>
                <div>
                  <h3 className="text-xl font-medium">{item.name}</h3>
                  <div className="text-2xl font-bold text-accent-primary mt-1">${item.price.toFixed(2)}</div>
                </div>
                
                <div className="flex items-center gap-6">
                  {event.status === 'LIVE' && (
                    <div className="text-center">
                      <div className="text-sm text-secondary">Remaining Stock</div>
                      <div className={`text-2xl font-display font-bold ${item.stock <= 10 ? 'text-accent-danger' : 'text-primary'}`}>
                        {item.stock}
                      </div>
                    </div>
                  )}

                  <button 
                    className="btn btn-primary"
                    style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                    disabled={
                      event.status !== 'LIVE' || 
                      item.stock === 0 || 
                      purchasingItemId !== null
                    }
                    onClick={() => handleReserve(item.id)}
                  >
                    {item.stock === 0 ? 'SOLD OUT' : (purchasingItemId === item.id ? 'Reserving...' : 'Buy Now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment / Status Modal Overlay */}
      {purchaseStatus && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
            
            {purchaseStatus.type === 'error' && (
              <div className="text-center py-4">
                <AlertCircle size={48} color="var(--accent-danger)" className="mx-auto mb-4" />
                <h3 className="text-xl mb-2 text-accent-danger">Purchase Failed</h3>
                <p className="text-secondary mb-6">{purchaseStatus.message}</p>
                <button className="btn btn-outline w-full" onClick={() => setPurchaseStatus(null)}>Close</button>
              </div>
            )}

            {purchaseStatus.type === 'success' && (
              <div className="text-center py-4">
                <CheckCircle2 size={48} color="var(--accent-success)" className="mx-auto mb-4" />
                <h3 className="text-xl mb-2 text-accent-success">Success!</h3>
                <p className="text-secondary mb-6">{purchaseStatus.message}</p>
                <button className="btn btn-primary w-full" onClick={() => setPurchaseStatus(null)}>Continue Shopping</button>
              </div>
            )}

            {purchaseStatus.type === 'payment' && (
              <div>
                <h3 className="text-xl mb-4 border-b pb-4" style={{ borderColor: 'var(--border-light)' }}>Confirm Payment</h3>
                
                <div className="mb-6 bg-base p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <span className="text-secondary">Item</span>
                    <span className="font-medium">{purchaseStatus.item?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Total to pay</span>
                    <span className="font-bold text-xl text-accent-primary">${purchaseStatus.item?.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 1 }}
                    onClick={handleCancelReservation}
                    disabled={purchasingItemId === 'confirming'}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={handleConfirmPayment}
                    disabled={purchasingItemId === 'confirming'}
                  >
                    {purchasingItemId === 'confirming' ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default EventDetail;
