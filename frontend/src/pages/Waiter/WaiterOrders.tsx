import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Order, User } from '../../services/api';
import { Home, ClipboardList, LayoutGrid, Clock, CheckCircle, ChefHat } from 'lucide-react';

export default function WaiterOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const notifiedItems = useRef<Set<number>>(new Set());
  
  
  const currentUserStr = localStorage.getItem('currentUser');
  const user: User | null = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (!user) {
      navigate('/waiter/login');
      return;
    }
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      // Duplo beep para chamar atenção
      const playBeep = (startTime: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, startTime);
        osc.frequency.exponentialRampToValueAtTime(1200, startTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.4);
    } catch(e) { console.log(e); }
  };

  const fetchOrders = async (isFirstLoad = false) => {
    try {
      const response = await api.get<Order[]>('/orders/?status=Aberto');
      const data = response.data;
      
      let shouldAlarm = false;
      data.forEach(order => {
        const isResponsible = order.waiter_id === user?.id || (order.table && order.table.current_waiter_id === user?.id);
        
        order.items.forEach(item => {
          if (item.status === 'Pronto' && !notifiedItems.current.has(item.id)) {
            if (!isFirstLoad && isResponsible) shouldAlarm = true;
            notifiedItems.current.add(item.id);
          }
        });
      });
      if (shouldAlarm) playAlarm();

      setOrders(data);
    } catch (err) {
      console.error("Erro ao buscar pedidos", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (orderId: number, itemId: number) => {
    try {
      // Optimistic update
      setOrders(orders.map(o => o.id === orderId ? {
        ...o, items: o.items.map(i => i.id === itemId ? { ...i, status: 'Entregue' } : i)
      } : o));
      
      await api.put(`/orders/${orderId}/items/${itemId}/status?status=Entregue`);
    } catch (e) {
      console.error("Erro ao entregar item", e);
      fetchOrders(false); // Revert on failure
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-modern pb-24 font-sans">
      <header className="glass sticky top-0 z-20 flex justify-between items-center p-4 rounded-b-3xl shadow-sm border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Status dos Pedidos</h1>
          <p className="text-sm font-medium text-blue-400">Acompanhe a produção</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full mt-2">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">Nenhum pedido aberto no momento.</div>
            ) : (
              orders.map((order, i) => (
                <div key={order.id} className="glass-card p-5 rounded-3xl animate-slide-up border border-white/5" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                    <h2 className="text-xl font-black text-slate-200">Mesa {order.table.number}</h2>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{order.items.length} itens</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {order.items.map(item => {
                      const isPronto = item.status === 'Pronto';
                      const isPendente = item.status === 'Na Fila' || item.status === 'Pendente';
                      const isEntregue = item.status === 'Entregue';
                      
                      return (
                        <div key={item.id} className="flex justify-between items-center bg-[#27272a]/50 p-3 rounded-2xl shadow-sm border border-white/5">
                          <div>
                            <p className={`font-bold ${isEntregue ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                              {item.quantity}x {item.product.name}
                            </p>
                            {item.observations && <p className="text-xs font-medium text-orange-400">Obs: {item.observations}</p>}
                          </div>
                          
                          <div className="flex flex-col gap-2 items-end">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border
                              ${isPronto ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                              ${!isPronto && !isPendente && !isEntregue ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                              ${isPendente ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                              ${isEntregue ? 'bg-white/5 text-slate-500 border-white/10' : ''}
                            `}>
                              {isPronto ? <CheckCircle size={14} /> : isPendente ? <Clock size={14} /> : isEntregue ? <CheckCircle size={14} /> : <ChefHat size={14} />}
                              {item.status === 'Na Fila' ? 'Pendente' : item.status}
                            </div>
                            
                            {isPronto && (
                              <button 
                                onClick={() => markAsDelivered(order.id, item.id)}
                                className="bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm hover:bg-green-500 active:scale-95 transition-all"
                              >
                                ENTREGAR
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {order.items.length === 0 && <p className="text-sm text-slate-500 italic">Sem itens registrados.</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      
      {/* Menu Inferior (Bottom Navigation) Mobile-First */}
      <nav className="fixed bottom-4 left-4 right-4 bg-[#18181b]/80 backdrop-blur-xl border border-white/5 rounded-3xl flex justify-around p-2 shadow-2xl z-20">
        <button className="flex flex-col items-center justify-center w-16 h-14 text-slate-500 hover:text-slate-200 transition-all" onClick={() => navigate('/waiter/dashboard')}>
          <LayoutGrid size={24} className="mb-1" />
          <span className="text-[10px] font-bold">Mesas</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-14 bg-white/10 text-white rounded-2xl transition-all shadow-sm border border-white/5">
          <ClipboardList size={24} className="mb-1" />
          <span className="text-[10px] font-bold">Pedidos</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-14 text-slate-500 hover:text-slate-200 transition-all" onClick={() => navigate('/')}>
          <Home size={24} className="mb-1" />
          <span className="text-[10px] font-bold">Sair</span>
        </button>
      </nav>
    </div>
  );
}
