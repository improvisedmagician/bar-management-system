import { useNavigate } from 'react-router-dom';
import { ChefHat, MonitorDot, TabletSmartphone, TerminalSquare } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-modern flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-200">
      {/* Glow effects for dark mode */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="text-center mb-16 animate-slide-up z-10">
        <div className="inline-block bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-6 backdrop-blur-md shadow-2xl">
          <h2 className="text-sm font-black text-blue-400 tracking-[0.2em] uppercase">Sistema de Gestão</h2>
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight mb-4 drop-shadow-2xl">
          NEXUS<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">BAR</span>
        </h1>
        <p className="text-xl text-slate-400 font-medium max-w-md mx-auto">
          Plataforma profissional para bares e restaurantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full animate-slide-up z-10" style={{ animationDelay: '0.1s' }}>
        
        {/* Admin */}
        <button 
          onClick={() => navigate('/admin')}
          className="group relative bg-[#18181b]/60 backdrop-blur-lg p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
            <MonitorDot size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Administração</h3>
          <p className="text-slate-400 font-medium text-sm leading-relaxed">
            Painel de controle financeiro, estoque, mesas e equipe.
          </p>
        </button>

        {/* POS */}
        <button 
          onClick={() => navigate('/pos')}
          className="group relative bg-[#18181b]/60 backdrop-blur-lg p-8 rounded-[2rem] border border-white/5 hover:border-teal-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(20,184,166,0.3)] text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-teal-500/20"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
            <TerminalSquare size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Caixa (POS)</h3>
          <p className="text-slate-400 font-medium text-sm leading-relaxed">
            Abertura de turnos, pagamentos e encerramento de mesas.
          </p>
        </button>

        {/* Waiter */}
        <button 
          onClick={() => navigate('/waiter/login')}
          className="group relative bg-[#18181b]/60 backdrop-blur-lg p-8 rounded-[2rem] border border-white/5 hover:border-orange-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.3)] text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-orange-500/20"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
            <TabletSmartphone size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Garçom App</h3>
          <p className="text-slate-400 font-medium text-sm leading-relaxed">
            Comanda digital, pedidos rápidos e status das mesas.
          </p>
        </button>

        {/* KDS */}
        <button 
          onClick={() => navigate('/kds')}
          className="group relative bg-[#18181b]/60 backdrop-blur-lg p-8 rounded-[2rem] border border-white/5 hover:border-rose-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(244,63,94,0.3)] text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
            <ChefHat size={32} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Cozinha (KDS)</h3>
          <p className="text-slate-400 font-medium text-sm leading-relaxed">
            Controle de produção de pratos e drinks em tempo real.
          </p>
        </button>

      </div>
    </div>
  );
}
