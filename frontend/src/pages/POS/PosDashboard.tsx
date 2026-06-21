import { useState, useEffect } from 'react';
import { CreditCard, Banknote, QrCode, Split, Calculator, ArrowLeftRight, Printer, Menu, X } from 'lucide-react';
import { api } from '../../services/api';
import type { Order, Table } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function PosDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [splitType, setSplitType] = useState<'none' | 'equal'>('none');
  const [peopleCount, setPeopleCount] = useState(2);
  const [payments, setPayments] = useState<{method: string, amount: number}[]>([]);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  
  // Cash Register state
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [isClosingShift, setIsClosingShift] = useState(false);
  
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const res = await api.get('/cash-register/current');
      if (res.data) {
        setCashRegister(res.data);
        fetchOpenOrders();
      } else {
        setCashRegister(null);
      }
    } catch (e) {
      console.error('Erro ao buscar turno', e);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/cash-register/open', { initial_balance: initialBalance });
      setCashRegister(res.data);
      setIsOpeningShift(false);
      fetchOpenOrders();
    } catch (e) {
      alert('Erro ao abrir caixa');
    }
  };

  const handleCloseShift = async () => {
    try {
      const res = await api.post('/cash-register/close');
      alert(`Caixa Fechado com Sucesso!\nSaldo Inicial: R$ ${res.data.initial_balance.toFixed(2)}\nTotal Recebido: R$ ${(res.data.current_balance - res.data.initial_balance).toFixed(2)}\nSaldo Final na Gaveta: R$ ${res.data.current_balance.toFixed(2)}`);
      setCashRegister(null);
      setIsClosingShift(false);
    } catch (e) {
      alert('Erro ao fechar caixa');
    }
  };

  const fetchOpenOrders = async () => {
    try {
      const res = await api.get<Order[]>('/orders/?status=Aberto');
      setOrders(res.data);
    } catch (e) {
      console.error('Erro ao buscar pedidos', e);
    }
  };
  
  const fetchAvailableTables = async () => {
    try {
      const res = await api.get<Table[]>('/tables/');
      setAvailableTables(res.data.filter(t => t.status === 'Livre'));
    } catch (e) {
      console.error('Erro ao buscar mesas', e);
    }
  };

  const handleOpenTransferModal = () => {
    fetchAvailableTables();
    setIsTransferModalOpen(true);
  };

  const handleTransferTable = async (newTableId: number) => {
    if (!selectedOrder) return;
    try {
      await api.post(`/orders/${selectedOrder.id}/transfer?new_table_id=${newTableId}`);
      setIsTransferModalOpen(false);
      setSelectedOrder(null);
      fetchOpenOrders();
    } catch (e) {
      alert('Erro ao transferir mesa');
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setPayments(order.payments || []); 
    setSplitType('none');
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleAddTable = async () => {
    try {
      const res = await api.get<Table[]>('/tables/');
      const number = res.data.length > 0 ? Math.max(...res.data.map(t => t.number)) + 1 : 1;
      await api.post('/tables/', { number, status: 'Livre' });
      alert(`Mesa ${number} criada com sucesso e está livre para uso!`);
    } catch(e) { 
      alert('Erro ao criar mesa. Tente novamente.'); 
    }
  };

  const items = selectedOrder?.items || [];
  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const total = subtotal;

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = total - totalPaid;

  const handleAddPayment = (method: string) => {
    if (remaining > 0) setPayments([...payments, { method, amount: remaining }]);
  };

  const handleFinishTable = async () => {
    if (!selectedOrder) return;
    try {
      for (const p of payments) {
         await api.post(`/orders/${selectedOrder.id}/pay`, { amount: p.amount, method: p.method });
      }
      await api.post(`/orders/${selectedOrder.id}/close`);
      setSelectedOrder(null);
      setPayments([]);
      fetchOpenOrders();
    } catch (e) {
      alert('Erro ao finalizar mesa');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-modern overflow-hidden font-sans relative">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-50 bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-blue-600 print:hidden"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Open Tables */}
      <aside className={`fixed md:relative z-40 w-80 h-full glass-dark flex flex-col print:hidden transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 bg-slate-900/50 backdrop-blur-md flex justify-between items-center border-b border-white/10 mt-16 md:mt-0">
          <div>
            <h2 className="text-xl font-black text-white tracking-widest">PONTO DE VENDA</h2>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${cashRegister ? 'text-green-400' : 'text-orange-400'}`}>
              {cashRegister ? 'Caixa Aberto' : 'Caixa Fechado'}
            </p>
          </div>
          <button onClick={() => cashRegister ? setIsClosingShift(true) : navigate('/')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${cashRegister ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            {cashRegister ? 'Fechar Caixa' : 'Sair'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          <div className="flex justify-between items-center mb-4 pl-2 pr-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mesas Abertas</h3>
            <button onClick={handleAddTable} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
              + Nova Mesa
            </button>
          </div>
          
          {orders.map((order, i) => {
            const orderTotal = order.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
            return (
              <div 
                key={order.id} 
                onClick={() => handleSelectOrder(order)}
                className={`p-5 rounded-2xl cursor-pointer transition-all animate-slide-up
                  ${selectedOrder?.id === order.id ? 'bg-blue-600/20 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800/50 border border-white/5 hover:bg-slate-700/50'}
                `}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-lg text-white">Mesa {order.table.number}</span>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${order.status === 'Fechando' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-slate-400 font-medium text-sm">Total: <span className="text-blue-400 font-black">R$ {orderTotal.toFixed(2)}</span></p>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="text-center text-slate-500 font-medium mt-10">Nenhuma mesa aberta.</div>
          )}
        </div>
      </aside>

      {/* Main Content - Bill Details */}
      {selectedOrder ? (
        <main className="flex-1 flex flex-col h-full bg-black/20 backdrop-blur-3xl">
          <header className="p-6 md:px-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden md:pl-8 pl-20 bg-[#18181b]/40">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Fechamento <span className="text-blue-500">Mesa {selectedOrder.table.number}</span></h1>
              <p className="text-slate-400 font-medium text-sm mt-1">Consumo detalhado e divisões de pagamento</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleOpenTransferModal} className="flex-1 sm:flex-none bg-[#27272a]/80 border border-white/10 text-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-[#3f3f46]/80 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                <ArrowLeftRight size={18} /> Transferir
              </button>
              <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                <Printer size={18} /> Imprimir
              </button>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8 flex flex-col lg:flex-row gap-6 overflow-hidden">
            
            {/* Bill Items List */}
            <div className="flex-1 glass-card rounded-[2rem] flex flex-col overflow-hidden print:shadow-none print:border-none print:p-0 print:bg-white animate-slide-up border border-white/5">
              <div className="p-6 border-b border-white/5 bg-[#27272a]/30 print:bg-white print:border-b-2 print:border-black">
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs print:text-black print:text-xl">Cupom Não Fiscal - Mesa {selectedOrder.table.number}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 print:overflow-visible no-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 print:border-gray-300">
                    <div>
                      <p className="font-bold text-slate-200 text-lg print:text-black">{item.product.name}</p>
                      <p className="text-sm font-medium text-blue-400 print:text-black">{item.quantity}x R$ {item.product.price.toFixed(2)}</p>
                    </div>
                    <span className="font-black text-slate-300 text-lg print:text-black">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-blue-900/10 border-t border-white/5 print:bg-white print:border-t-2 print:border-black">
                <div className="flex justify-between items-center mb-2 text-lg text-slate-400 font-bold print:text-black uppercase tracking-wider text-sm">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-4xl font-black text-white print:text-black mt-2">
                  <span>Total</span>
                  <span className="text-blue-400 print:text-black">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Panel */}
            <div className="w-full lg:w-[450px] flex flex-col gap-6 print:hidden overflow-y-auto lg:overflow-visible no-scrollbar pb-6 lg:pb-0">
              
              {/* Split Options */}
              <div className="glass-card p-6 rounded-[2rem] animate-slide-up border border-white/5" style={{ animationDelay: '0.1s' }}>
                <h3 className="font-black text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                  <Split size={18} className="text-blue-400"/> Divisão de Conta
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setSplitType('none')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${splitType === 'none' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>Única</button>
                  <button onClick={() => setSplitType('equal')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${splitType === 'equal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>Igualitária</button>
                </div>

                {splitType === 'equal' && (
                  <div className="mt-4 flex items-center justify-between bg-[#27272a]/50 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setPeopleCount(Math.max(2, peopleCount - 1))} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl font-black text-xl shadow-sm text-blue-400 active:scale-95 transition-all">-</button>
                      <span className="font-black text-slate-200">{peopleCount} <span className="text-sm font-bold text-slate-400">Pessoas</span></span>
                      <button onClick={() => setPeopleCount(peopleCount + 1)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl font-black text-xl shadow-sm text-blue-400 active:scale-95 transition-all">+</button>
                    </div>
                    <span className="font-black text-2xl text-blue-400">R$ {(total / peopleCount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="flex-1 glass-card p-6 rounded-[2rem] flex flex-col animate-slide-up border border-white/5" style={{ animationDelay: '0.2s' }}>
                <h3 className="font-black text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                  <Calculator size={18} className="text-green-400"/> Pagamento
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button onClick={() => handleAddPayment('PIX')} className="bg-[#27272a]/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-teal-500/50 hover:bg-[#27272a]/80 text-slate-300 hover:text-teal-400 transition-all shadow-sm active:scale-95">
                    <QrCode size={28} />
                    <span className="font-black text-sm uppercase tracking-widest">PIX</span>
                  </button>
                  <button onClick={() => handleAddPayment('Cartão')} className="bg-[#27272a]/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-blue-500/50 hover:bg-[#27272a]/80 text-slate-300 hover:text-blue-400 transition-all shadow-sm active:scale-95">
                    <CreditCard size={28} />
                    <span className="font-black text-sm uppercase tracking-widest">Cartão</span>
                  </button>
                  <button onClick={() => handleAddPayment('Dinheiro')} className="bg-[#27272a]/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-green-500/50 hover:bg-[#27272a]/80 text-slate-300 hover:text-green-400 transition-all shadow-sm active:scale-95 col-span-2">
                    <Banknote size={28} />
                    <span className="font-black text-sm uppercase tracking-widest">Dinheiro em Espécie</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 border-t border-white/10 pt-4 relative">
                  {payments.length > 0 && (
                    <button onClick={() => setPayments([])} className="absolute top-4 right-0 text-[10px] font-black text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-full uppercase tracking-widest transition-colors">
                      Limpar
                    </button>
                  )}
                  <div className="mt-10 space-y-3">
                    {payments.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-[#27272a]/50 p-3 rounded-xl border border-white/5">
                        <span className="bg-white/10 px-3 py-1 rounded-lg text-slate-300 font-bold text-sm shadow-sm">{p.method}</span>
                        <span className="text-white font-black text-lg">R$ {p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-black text-slate-400 uppercase tracking-widest text-sm">Falta Pagar</span>
                    <span className={`font-black text-4xl ${remaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>R$ {Math.max(0, remaining).toFixed(2)}</span>
                  </div>
                  
                  <button 
                    disabled={remaining > 0}
                    onClick={handleFinishTable}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-sm ${remaining <= 0 ? 'bg-green-600 text-white hover:bg-green-500 hover:shadow-lg shadow-green-600/30 active:scale-[0.98]' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                  >
                    {remaining <= 0 ? 'FINALIZAR MESA' : 'AGUARDANDO VALOR TOTAL'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center bg-black/20 backdrop-blur-3xl print:hidden p-8">
          <div className="bg-[#18181b]/80 p-10 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/5 text-center max-w-sm animate-slide-up backdrop-blur-xl">
            <div className="bg-blue-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-400">
              <Calculator size={48} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Caixa Livre</h2>
            <p className="text-slate-400 font-medium leading-relaxed">Selecione uma mesa na barra lateral para detalhar os consumos e efetuar o fechamento.</p>
          </div>
        </main>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                <ArrowLeftRight size={32} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Transferir Mesa {selectedOrder?.table.number}</h2>
              <p className="text-slate-400 font-medium mt-2">Escolha uma mesa livre para destino</p>
            </div>
            
            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto mb-6 p-1 no-scrollbar">
              {availableTables.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTransferTable(t.id)}
                  className="bg-[#27272a]/50 text-slate-200 border border-white/5 font-black text-xl p-4 rounded-2xl hover:border-blue-500/50 hover:bg-[#27272a] hover:text-blue-400 transition-all active:scale-95 shadow-sm"
                >
                  {t.number}
                </button>
              ))}
              {availableTables.length === 0 && (
                <div className="col-span-4 text-center text-orange-400 font-bold p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">Todas as mesas estão ocupadas!</div>
              )}
            </div>
            <button 
              onClick={() => setIsTransferModalOpen(false)}
              className="w-full bg-white/5 text-slate-300 font-bold py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Abre Caixa Modal/Overlay */}
      {!cashRegister && !isOpeningShift && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
          <div className="text-center animate-slide-up">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Banknote size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Caixa Fechado</h1>
            <p className="text-gray-400 font-medium mb-8">Abra o turno para iniciar as vendas e receber pagamentos.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => navigate('/')} className="bg-white/10 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all">Voltar</button>
              <button onClick={() => setIsOpeningShift(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all">Abrir Caixa</button>
            </div>
          </div>
        </div>
      )}

      {/* Opening Shift Form */}
      {!cashRegister && isOpeningShift && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up">
            <h2 className="text-2xl font-black text-white mb-6">Abrir Turno</h2>
            <form onSubmit={handleOpenShift} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fundo de Troco (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#27272a] border border-white/10 p-4 rounded-2xl font-black text-2xl text-white focus:ring-4 focus:ring-blue-500/20 outline-none text-center" 
                />
                <p className="text-center text-sm text-slate-500 mt-2">Valor inicial na gaveta</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsOpeningShift(false)} className="flex-1 bg-white/5 text-slate-300 font-bold p-4 rounded-2xl hover:bg-white/10">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold p-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-500">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Closing Shift Confirmation */}
      {isClosingShift && cashRegister && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator size={32} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Fechar Turno?</h2>
            <p className="text-slate-400 font-medium mt-2">O fechamento fará a contagem final das vendas.</p>
            <div className="bg-[#27272a] rounded-2xl p-4 mt-6 text-left space-y-2 border border-white/5">
               <div className="flex justify-between font-bold text-slate-300 text-sm">
                 <span>Troco Inicial:</span>
                 <span>R$ {cashRegister.initial_balance.toFixed(2)}</span>
               </div>
               <div className="flex justify-between font-black text-blue-400 text-lg border-t border-white/10 pt-2 mt-2">
                 <span>Na gaveta (aprox.):</span>
                 <span>Calculando...</span>
               </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsClosingShift(false)} className="flex-1 bg-white/5 text-slate-300 font-bold py-4 rounded-2xl hover:bg-white/10">Cancelar</button>
              <button onClick={handleCloseShift} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/30 hover:bg-red-500">Encerrar Caixa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
