import { useState, useEffect, useRef } from 'react';
import { Clock, ChefHat, Martini, ArrowLeft } from 'lucide-react';
import { supabase } from '../../services/api';

import { useNavigate } from 'react-router-dom';

interface KdsItem {
  id: number;
  productName: string;
  tableNumber: number;
  quantity: number;
  observations: string | null;
  status: 'Pendente' | 'Em Preparo' | 'Pronto' | 'Entregue';
  destination: string;
  createdAt: number; 
}

export default function KdsDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<'Pedidos' | 'Histórico'>('Pedidos');
  const [filter, setFilter] = useState<'Todos' | 'Cozinha' | 'Bar'>('Cozinha');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [items, setItems] = useState<KdsItem[]>([]);
  const prevItemsCountRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: orders, error } = await supabase.from('orders')
        .select(`*, table:tables(*), items:order_items(*, product:products(*, category:categories(*)))`)
        .eq('status', 'Aberto');
      if (error) throw error;
      
      const allItems: KdsItem[] = [];
      orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          const mappedStatus = item.status === 'Na Fila' ? 'Pendente' : item.status;
          allItems.push({
            id: item.id,
            productName: item.product?.name || 'Desconhecido',
            tableNumber: order.table?.number || 0,
            quantity: item.quantity,
            observations: item.observations,
            status: mappedStatus as any,
            destination: item.product?.category?.type || 'Bar',
            createdAt: new Date(item.created_at).getTime()
          });
        });
      });

      if (prevItemsCountRef.current > 0 && allItems.length > prevItemsCountRef.current) {
        if (window.location.pathname.startsWith('/kds') || window.location.pathname.startsWith('/kitchen')) {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
      }
      prevItemsCountRef.current = allItems.length;
      setItems(allItems);
    } catch (e) {
      console.error('Erro ao buscar pedidos do KDS', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('kds-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchOrders();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const moveItem = async (id: number, newStatus: 'Pendente' | 'Em Preparo' | 'Pronto' | 'Entregue') => {
    setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));
    try {
      await supabase.from('order_items').update({ status: newStatus }).eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = items.filter(item => filter === 'Todos' || item.destination === filter);

  const renderColumn = (title: string, status: 'Pendente' | 'Em Preparo' | 'Pronto', colorClass: string, headerClass: string) => {
    const columnItems = filteredItems.filter(item => item.status === status);

    return (
      <div className={`flex-1 rounded-3xl p-5 flex flex-col gap-4 ${colorClass} glass-card`}>
        <div className={`flex justify-between items-center mb-2 pb-3 border-b-2 ${headerClass}`}>
          <h2 className="text-xl font-black uppercase tracking-widest">{title}</h2>
          <span className="bg-white/50 text-gray-800 font-black px-4 py-1 rounded-full shadow-sm text-sm">
            {columnItems.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar">
          {columnItems.map((item, i) => {
            const elapsedMinutes = Math.floor((currentTime - item.createdAt) / 60000);
            const isLate = elapsedMinutes >= 20 && status !== 'Pronto';

            return (
              <div 
                key={item.id} 
                className={`bg-[#27272a]/60 p-5 rounded-2xl shadow-sm border-l-[6px] transition-all hover:-translate-y-1 hover:shadow-md animate-slide-up
                  ${isLate ? 'border-red-500 shadow-red-500/20' : 'border-white/5'}
                `}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#18181b] border border-white/10 text-white font-black text-xl w-12 h-12 flex items-center justify-center rounded-xl shadow-md">
                      {item.tableNumber}
                    </span>
                    <div className="bg-white/5 p-2 rounded-lg text-slate-400">
                      {item.destination === 'Cozinha' ? <ChefHat size={20} /> : <Martini size={20} />}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg ${isLate ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-400'}`}>
                    <Clock size={16} />
                    {elapsedMinutes} min
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-200 leading-tight mb-2">{item.quantity}x {item.productName}</h3>
                
                {item.observations && (
                  <p className="text-sm text-orange-400 font-bold bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                    {item.observations}
                  </p>
                )}

                <div className="flex gap-2 mt-5">
                  {status === 'Pendente' && (
                    <button 
                      onClick={() => moveItem(item.id, 'Em Preparo')}
                      className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      PREPARAR
                    </button>
                  )}
                  {status === 'Em Preparo' && (
                    <button 
                      onClick={() => moveItem(item.id, 'Pronto')}
                      className="flex-1 bg-green-500/10 text-green-400 border border-green-500/20 font-black py-3 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      PRONTO
                    </button>
                  )}
                  {status === 'Pronto' && (
                    <button 
                      onClick={() => moveItem(item.id, 'Entregue')}
                      className="flex-1 bg-white/5 text-slate-300 font-black py-3 rounded-xl hover:bg-white/20 transition-all shadow-sm active:scale-95"
                    >
                      ENTREGUE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-modern p-4 lg:p-6 font-sans">
      <header className="glass flex flex-col md:flex-row justify-between items-center mb-6 p-4 rounded-3xl gap-4 border-b border-white/5">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">KITCHEN DISPLAY</h1>
        </div>
        <div className="flex bg-[#18181b]/50 border border-white/5 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['Pedidos', 'Histórico'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                view === v ? 'bg-[#27272a] text-blue-400 shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="flex bg-[#18181b]/50 border border-white/5 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['Todos', 'Cozinha', 'Bar'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                filter === type ? 'bg-[#27272a] text-blue-400 shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {view === 'Pedidos' ? (
          <>
            {renderColumn('Na Fila', 'Pendente', 'bg-[#18181b]/40', 'border-white/5 text-slate-300')}
            {renderColumn('Em Preparo', 'Em Preparo', 'bg-blue-900/10', 'border-blue-500/20 text-blue-400')}
            {renderColumn('Pronto / Expedição', 'Pronto', 'bg-green-900/10', 'border-green-500/20 text-green-400')}
          </>
        ) : (
          <div className="flex-1 rounded-3xl p-6 flex flex-col gap-4 bg-[#18181b]/40 glass-card overflow-y-auto">
            <h2 className="text-2xl font-black text-white mb-4">Histórico de Itens Entregues</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredItems.filter(i => i.status === 'Entregue').map(item => (
                <div key={item.id} className="bg-[#27272a]/60 p-5 rounded-2xl shadow-sm border border-white/5 opacity-80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-lg text-slate-200">Mesa {item.tableNumber}</span>
                    <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-1 rounded-lg uppercase tracking-widest border border-green-500/20">Entregue</span>
                  </div>
                  <h3 className="font-bold text-slate-400">{item.quantity}x {item.productName}</h3>
                </div>
              ))}
              {filteredItems.filter(i => i.status === 'Entregue').length === 0 && (
                 <p className="text-slate-500 font-medium">Nenhum item no histórico ainda.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
