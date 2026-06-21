import { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, Menu, X, LayoutGrid } from 'lucide-react';
import { supabase } from '../../services/api';
import type { Product, User, Category, Table } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'team' | 'tables'>('dashboard');
  const [metrics, setMetrics] = useState<any>({
    total_revenue: 0,
    average_ticket: 0,
    completed_orders: 0,
    sales_over_time: [],
    top_products: []
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '', price: 0, category_id: 1, stock_quantity: -1
  });
  const [newCategory, setNewCategory] = useState({ name: '', type: 'Bar' });
  const [newUser, setNewUser] = useState({ name: '', role: 'Garçom', pin: '' });

  useEffect(() => {
    if (activeTab === 'dashboard') fetchMetrics();
    else if (activeTab === 'menu') fetchProducts();
    else if (activeTab === 'team') fetchUsers();
    else if (activeTab === 'tables') fetchTables();
  }, [activeTab]);

  const fetchMetrics = async () => {
    try {
      const { data: payments } = await supabase.from('payments').select('amount, created_at, order_id');
      const { data: orders } = await supabase.from('orders').select('id, status');
      const { data: orderItems } = await supabase.from('order_items').select('product_id, quantity, product:products(name)');

      const total_revenue = payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
      const completed_orders = orders?.filter(o => o.status === 'Fechado').length || 0;
      const average_ticket = completed_orders > 0 ? total_revenue / completed_orders : 0;

      const productCounts: Record<string, number> = {};
      orderItems?.forEach(item => {
        const name = (item.product as any)?.name || 'Desconhecido';
        productCounts[name] = (productCounts[name] || 0) + item.quantity;
      });
      const top_products = Object.entries(productCounts)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const salesByDate: Record<string, number> = {};
      payments?.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
        salesByDate[date] = (salesByDate[date] || 0) + p.amount;
      });
      const sales_over_time = Object.entries(salesByDate).map(([time, total]) => ({ time, total }));

      setMetrics({ total_revenue, average_ticket, completed_orders, sales_over_time, top_products });
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const { data: productsData } = await supabase.from('products').select('*, category:categories(*)').order('id');
      if (productsData) setProducts(productsData as any);
      
      const { data: catData } = await supabase.from('categories').select('*').order('id');
      if (catData) setCategories(catData as any);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('users').select('*').order('id');
      if (data) setUsers(data as any);
    } catch (e) { console.error(e); }
  };

  const fetchTables = async () => {
    try {
      const { data } = await supabase.from('tables').select('*').order('number');
      if (data) setTables(data as any);
    } catch (e) { console.error(e); }
  };

  const handleAddTable = async () => {
    const number = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    try {
      const { error } = await supabase.from('tables').insert([{ number, status: 'Livre' }]);
      if (error) throw error;
      fetchTables();
    } catch(e) { alert('Erro ao criar mesa'); }
  };

  const handleDeleteTable = async (id: number) => {
    if(confirm('Atenção: Tem certeza que deseja remover esta mesa?')) {
      try {
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (error) throw error;
        fetchTables();
      } catch(e) { alert('Mesa possui pedidos atrelados ou erro ao deletar.'); }
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
      if (error) throw error;
      fetchProducts();
    } catch (e) { alert("Erro"); }
  };

  const updateStock = async (product: Product, newStock: number) => {
    try {
      const { error } = await supabase.from('products').update({ stock_quantity: newStock }).eq('id', product.id);
      if (error) throw error;
      fetchProducts();
    } catch (e) { alert("Erro"); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('products').insert([newProduct]);
      if (error) throw error;
      setIsModalOpen(false);
      setNewProduct({ name: '', price: 0, category_id: categories[0]?.id || 1, stock_quantity: -1 });
      fetchProducts();
    } catch (e) { alert('Erro ao criar produto'); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('categories').insert([newCategory]);
      if (error) throw error;
      setIsCategoryModalOpen(false);
      setNewCategory({ name: '', type: 'Bar' });
      fetchProducts();
    } catch (e) { alert('Erro ao criar categoria'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('users').insert([{
        name: newUser.name,
        role: newUser.role,
        pin: newUser.pin ? newUser.pin : null
      }]);
      if (error) throw error;
      setIsUserModalOpen(false);
      setNewUser({ name: '', role: 'Garçom', pin: '' });
      fetchUsers();
    } catch (e: any) { alert(e.message || 'Erro ao criar usuário'); }
  };

  const handleDeleteUser = async (userId: number) => {
    if(confirm('Deseja realmente remover este usuário?')) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
        fetchUsers();
      } catch (e) { alert('Erro ao excluir usuário'); }
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-slate-200 font-sans relative overflow-hidden">
      
      {/* Mobile Header & Sidebar Toggle */}
      <div className="md:hidden fixed top-0 w-full bg-[#09090b]/80 backdrop-blur-md z-30 flex justify-between items-center p-4 border-b border-white/5">
        <h1 className="text-xl font-black text-white tracking-tight">BarAdmin</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 bg-white/5 rounded-lg border border-white/5">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:relative z-20 w-72 h-full bg-[#18181b] border-r border-white/5 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} pt-16 md:pt-0`}>
        <div className="p-6 hidden md:block border-b border-white/5">
          <h1 className="text-2xl font-black text-white tracking-widest">BarAdmin</h1>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Management V3</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <TrendingUp size={20} /> <span className="font-bold text-sm tracking-widest uppercase">Dashboard</span>
          </button>
          <button onClick={() => { setActiveTab('menu'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'menu' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Package size={20} /> <span className="font-bold text-sm tracking-widest uppercase">Estoque</span>
          </button>
          <button onClick={() => { setActiveTab('team'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Users size={20} /> <span className="font-bold text-sm tracking-widest uppercase">Equipe</span>
          </button>
          <button onClick={() => { setActiveTab('tables'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'tables' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <LayoutGrid size={20} /> <span className="font-bold text-sm tracking-widest uppercase">Mesas</span>
          </button>
        </nav>
        <div className="p-6 mt-auto">
          <button onClick={() => navigate('/')} className="w-full bg-[#27272a] text-slate-300 py-3 rounded-xl font-bold hover:bg-[#3f3f46] hover:text-white transition-colors border border-white/5">Sair</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-8 bg-gradient-modern no-scrollbar">
        
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
            <header>
              <h2 className="text-3xl font-black text-white">Visão Geral</h2>
              <p className="text-slate-400 font-medium">Acompanhamento em tempo real da operação.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between h-40 border border-white/5">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center border border-green-500/20"><DollarSign size={24} /></div>
                  <span className="text-xs font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg uppercase">+12%</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest">Faturamento Hoje</p>
                  <p className="text-3xl font-black text-white mt-1">R$ {metrics.total_revenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between h-40 border border-white/5">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20"><Users size={24} /></div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest">Ticket Médio</p>
                  <p className="text-3xl font-black text-white mt-1">R$ {metrics.average_ticket.toFixed(2)}</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between h-40 border border-white/5">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center border border-orange-500/20"><TrendingUp size={24} /></div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest">Pedidos Concluídos</p>
                  <p className="text-3xl font-black text-white mt-1">{metrics.completed_orders}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[2rem] border border-white/5">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Faturamento por Horário</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.sales_over_time} margin={{top:5, right:20, bottom:5, left:0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a"/>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                      <Tooltip cursor={{stroke: '#27272a', strokeWidth: 2}} contentStyle={{backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', color: '#fff'}}/>
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 8, strokeWidth: 4, stroke: '#bfdbfe'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-white/5">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Top Produtos</h3>
                <div className="flex flex-col gap-5 mt-2">
                  {metrics.top_products.map((item: any, i: number) => {
                    const maxAmount = Math.max(...metrics.top_products.map((p: any) => p.amount));
                    const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                    return (
                      <div key={i} className="relative w-full group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-slate-200 truncate pr-4 group-hover:text-white transition-colors">{item.name}</span>
                          <span className="text-sm font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{item.amount} un</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#18181b] border border-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full relative"
                            style={{ width: `${percentage}%`, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -skew-x-12 translate-x-[-100%]"></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {metrics.top_products.length === 0 && (
                    <div className="text-center text-slate-500 py-10 font-medium">Nenhum dado disponível</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">Cardápio & Estoque</h2>
                <p className="text-slate-400 font-medium">Gestão de produtos e visibilidade.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsCategoryModalOpen(true)} className="bg-[#27272a] text-blue-400 border border-white/10 px-6 py-3 rounded-xl font-black shadow-sm hover:bg-[#3f3f46] transition-all">
                  Nova Categoria
                </button>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all">
                  + Novo Produto
                </button>
              </div>
            </header>

            <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-[#27272a]/50 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-widest">Produto</th>
                      <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-widest">Categoria</th>
                      <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-widest">Preço</th>
                      <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-widest">Estoque</th>
                      <th className="px-6 py-5 font-black text-slate-400 uppercase text-xs tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-[#18181b]/30">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-200">{p.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{p.category?.name || '-'}</td>
                        <td className="px-6 py-4 font-black text-blue-400">R$ {p.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {p.stock_quantity === -1 ? (
                              <span className="text-slate-400 italic text-sm font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">Ilimitado</span>
                            ) : (
                              <div className="flex items-center bg-[#27272a] border border-white/5 rounded-xl overflow-hidden">
                                <button onClick={() => updateStock(p, Math.max(0, p.stock_quantity - 1))} className="bg-[#27272a] hover:bg-[#3f3f46] px-3 py-1 text-slate-300 font-bold transition-colors border-r border-white/5">-</button>
                                <span className="font-black w-8 text-center text-slate-200">{p.stock_quantity}</span>
                                <button onClick={() => updateStock(p, p.stock_quantity + 1)} className="bg-[#27272a] hover:bg-[#3f3f46] px-3 py-1 text-slate-300 font-bold transition-colors border-l border-white/5">+</button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleProductStatus(p)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${p.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 shadow-sm' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                          >
                            {p.is_active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-white">Equipe</h2>
                <p className="text-slate-400 font-medium">Contas e acessos do sistema.</p>
              </div>
              <button onClick={() => setIsUserModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all">
                + Novo Membro
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((u) => (
                <div key={u.id} className="glass-card p-6 rounded-[2rem] flex flex-col items-center text-center relative group border border-white/5">
                  <button onClick={() => handleDeleteUser(u.id)} className="absolute top-4 right-4 bg-red-500/10 text-red-400 border border-red-500/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"><X size={16}/></button>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-900/40 to-teal-900/40 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-black text-2xl mb-4 shadow-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-black text-slate-200 text-xl">{u.name}</h3>
                  <span className="mt-2 bg-white/10 text-slate-300 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {u.role}
                  </span>
                  {u.pin && <p className="mt-4 text-sm font-bold text-slate-400 tracking-widest bg-[#27272a]/50 px-4 py-2 rounded-xl w-full border border-white/5">PIN: {u.pin}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-white">Mesas</h2>
                <p className="text-slate-400 font-medium">Gestão do salão.</p>
              </div>
              <button onClick={handleAddTable} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all">
                + Nova Mesa
              </button>
            </header>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              {tables.map((t) => (
                <div key={t.id} className="glass-card p-6 rounded-[2rem] flex flex-col items-center justify-center text-center relative group h-32 border border-white/5">
                  <button onClick={() => handleDeleteTable(t.id)} className="absolute top-2 right-2 bg-red-500/10 text-red-400 p-2 border border-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"><X size={14}/></button>
                  <span className="text-4xl font-black text-white">{t.number}</span>
                  <span className={`mt-2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${t.status === 'Livre' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Modal Criar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-black text-white mb-6">Novo Produto</h3>
            <form onSubmit={handleCreateProduct} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nome do Produto</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="glass-input w-full rounded-2xl p-4" placeholder="Ex: Cerveja Artesanal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Preço (R$)</label>
                  <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="glass-input w-full rounded-2xl p-4" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Estoque Inicial</label>
                  <input required type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})} className="glass-input w-full rounded-2xl p-4" placeholder="-1 = Ilimitado" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                  <select value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: parseInt(e.target.value)})} className="glass-input w-full rounded-2xl p-4">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 border border-white/10 text-slate-300 p-4 rounded-2xl font-black hover:bg-white/10 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-500/30 active:scale-95 transition-all">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-black text-white mb-6">Nova Categoria</h3>
            <form onSubmit={handleCreateCategory} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                <input required type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="glass-input w-full rounded-2xl p-4" placeholder="Ex: Cervejas" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Destino (KDS)</label>
                <select value={newCategory.type} onChange={e => setNewCategory({...newCategory, type: e.target.value})} className="glass-input w-full rounded-2xl p-4">
                  <option value="Bar">Bar (Bebidas / Balcão)</option>
                  <option value="Cozinha">Cozinha (Pratos / Petiscos)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 bg-white/5 border border-white/10 text-slate-300 p-4 rounded-2xl font-black hover:bg-white/10 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-black text-white mb-6">Novo Membro</h3>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="glass-input w-full rounded-2xl p-4" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="glass-input w-full rounded-2xl p-4">
                  <option value="Garçom">Garçom</option>
                  <option value="Cozinha">Cozinha/Bar</option>
                  <option value="Caixa">Caixa</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">PIN de Acesso (4 digitos)</label>
                <input required type="password" maxLength={4} value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="glass-input w-full rounded-2xl p-4 text-center tracking-[1em]" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 bg-white/5 border border-white/10 text-slate-300 p-4 rounded-2xl font-black hover:bg-white/10 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
