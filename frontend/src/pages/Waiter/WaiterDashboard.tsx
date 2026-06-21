import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Table, User } from '../../services/api';
import { LogOut, Home, ClipboardList, LayoutGrid } from 'lucide-react';

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentUserStr = localStorage.getItem('currentUser');
  const user: User | null = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (!user) {
      navigate('/waiter/login');
      return;
    }
    
    fetchTables();
    
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchTables = async () => {
    try {
      const response = await api.get<Table[]>('/tables/');
      setTables(response.data);
    } catch (err) {
      console.error("Erro ao buscar mesas", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/waiter/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-modern pb-24 font-sans">
      <header className="glass sticky top-0 z-20 flex justify-between items-center p-4 rounded-b-3xl border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mesas</h1>
          <p className="text-sm font-medium text-blue-400">Olá, {user?.name}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500/10 text-red-400 p-3 rounded-full hover:bg-red-500/20 active:scale-95 transition-all shadow-sm border border-red-500/20"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full mt-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tables.map((table, i) => {
              const isLocked = table.status !== 'Livre' && table.current_waiter_id && table.current_waiter_id !== user?.id;
              return (
                <div 
                  key={table.id}
                  onClick={() => {
                    if (isLocked) {
                      alert('Esta mesa está sendo atendida por outro garçom.');
                      return;
                    }
                    navigate(`/waiter/menu/${table.id}`);
                  }}
                  className={`relative overflow-hidden p-5 rounded-3xl glass-card flex flex-col items-center justify-center h-36 active:scale-95 transition-all animate-slide-up border border-white/5
                    ${isLocked ? 'opacity-50 cursor-not-allowed bg-[#27272a]/50 border-b-4 border-slate-600' : 'cursor-pointer'}
                    ${!isLocked && table.status === 'Livre' ? 'bg-[#18181b]/60 border-b-4 border-green-500' : ''}
                    ${!isLocked && table.status === 'Ocupada' ? 'bg-blue-900/10 border-b-4 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}
                    ${!isLocked && table.status === 'Aguardando Fechamento' ? 'bg-orange-900/10 border-b-4 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : ''}
                  `}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {!isLocked && table.status === 'Ocupada' && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  )}
                  {!isLocked && table.status === 'Aguardando Fechamento' && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                  )}

                  <span className={`text-5xl font-black mb-2 ${isLocked ? 'text-slate-600' : table.status === 'Livre' ? 'text-slate-200' : table.status === 'Ocupada' ? 'text-blue-400' : 'text-orange-400'}`}>
                    {table.number}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border
                    ${isLocked ? 'bg-slate-800 text-slate-400 border-slate-700' : table.status === 'Livre' ? 'bg-green-500/10 text-green-400 border-green-500/20' : table.status === 'Ocupada' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}
                  `}>
                    {isLocked ? 'Atendida' : table.status === 'Aguardando Fechamento' ? 'Fechando' : table.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Menu Inferior (Bottom Navigation) Mobile-First */}
      <nav className="fixed bottom-4 left-4 right-4 bg-[#18181b]/80 backdrop-blur-xl border border-white/5 rounded-3xl flex justify-around p-2 shadow-2xl z-20">
        <button className="flex flex-col items-center justify-center w-16 h-14 bg-white/10 text-white rounded-2xl transition-all shadow-sm border border-white/5">
          <LayoutGrid size={24} className="mb-1" />
          <span className="text-[10px] font-bold">Mesas</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-14 text-slate-500 hover:text-slate-200 transition-all" onClick={() => navigate('/waiter/orders')}>
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
