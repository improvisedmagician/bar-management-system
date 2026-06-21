import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';

import { UserCircle, ArrowRight } from 'lucide-react';

export default function WaiterLogin() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, insira seu nome');
      return;
    }
    
    setLoading(true);
    try {
      let { data: user } = await supabase.from('users').select('*').ilike('name', name).in('role', ['Garçom', 'Admin']).maybeSingle();
      
      if (!user) {
        const { data: newUser, error: createError } = await supabase.from('users').insert([{
          name: name,
          role: 'Garçom',
          pin: null
        }]).select().single();
        
        if (createError) {
          setError('Erro ao registrar novo garçom');
          setLoading(false);
          return;
        }
        user = newUser;
      }

      localStorage.setItem('bar_user', JSON.stringify(user));
      navigate('/waiter/dashboard');
    } catch (err: any) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-modern overflow-hidden p-6 font-sans">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 text-center mb-8 animate-slide-up">
        <div className="bg-[#18181b]/60 border border-white/5 p-4 rounded-full inline-block mb-4 shadow-sm backdrop-blur-md">
          <UserCircle size={48} className="text-blue-500" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Portal</span></h1>
        <p className="text-slate-400 font-medium mt-2">Acesso rápido para atendimento</p>
      </div>

      <div className="z-10 w-full max-w-sm glass-card rounded-[2rem] p-8 animate-slide-up border border-white/5" style={{ animationDelay: '0.1s' }}>
        {error && (
          <div className="text-red-400 text-center mb-6 text-sm font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="relative">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Seu nome (ex: Joao)"
              className="glass-input w-full rounded-2xl px-5 py-4 text-lg font-bold transition-all placeholder:font-medium"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="group w-full h-14 rounded-2xl bg-blue-600 text-lg font-bold text-white hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/30 disabled:bg-[#27272a] disabled:text-slate-500 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2 border border-blue-500/50 disabled:border-white/5"
          >
            {loading ? 'Entrando...' : (
              <>
                Entrar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
