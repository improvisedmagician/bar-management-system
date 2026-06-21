import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QrCode, CreditCard, Banknote, Printer, ChevronLeft, ShoppingBag, Receipt } from 'lucide-react';
import { api } from '../../services/api';
import type { Product, Category, Order } from '../../services/api';

interface CartItem {
  cartId: number;
  product: Product;
  observations: string;
  quantity: number;
}

export default function WaiterMenu() {
  const navigate = useNavigate();
  const { tableId } = useParams();
  
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const userStr = localStorage.getItem('bar_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [obsText, setObsText] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [payments, setPayments] = useState<{method: string, amount: number}[]>([]);

  useEffect(() => {
    fetchMenu();
    fetchOrder();
  }, [tableId]);

  const fetchMenu = async () => {
    try {
      const catRes = await api.get<Category[]>('/menu/categories');
      setCategories(catRes.data);
      const prodRes = await api.get<Product[]>('/menu/products');
      setProducts(prodRes.data);
    } catch (e) {
      console.error('Erro ao buscar cardápio', e);
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await api.get<Order[]>('/orders/?status=Aberto');
      const order = res.data.find(o => o.table_id === Number(tableId));
      if (order) setActiveOrder(order);
      else setActiveOrder(null);
    } catch (e) {
      console.error('Erro ao buscar pedido', e);
    }
  };

  const filteredProducts = activeCategory 
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    setCart([...cart, { cartId: Date.now(), product: selectedProduct, observations: obsText, quantity: modalQuantity }]);
    setSelectedProduct(null);
    setObsText('');
    setModalQuantity(1);
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    try {
      let orderId = activeOrder?.id;
      if (!orderId) {
        const orderRes = await api.post<Order>('/orders/', { table_id: Number(tableId), waiter_id: user?.id });
        orderId = orderRes.data.id;
        setActiveOrder(orderRes.data);
      }
      for (const item of cart) {
        await api.post(`/orders/${orderId}/items`, {
          product_id: item.product.id,
          quantity: item.quantity,
          observations: item.observations || null
        });
      }
      setCart([]);
      setIsCartOpen(false);
      fetchOrder(); 
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar pedido.');
    }
  };

  const consumedItems = activeOrder?.items || [];
  const totalConsumed = consumedItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalPaid = (activeOrder?.payments || []).reduce((acc: any, p: any) => acc + p.amount, 0) + payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingToPay = totalConsumed - totalPaid;

  const handleAddPayment = (method: string) => {
    if (remainingToPay > 0) setPayments([...payments, { method, amount: remainingToPay }]);
  };

  const handlePrint = () => window.print();

  const handleFinishTable = async () => {
    if (!activeOrder) return;
    try {
      for (const p of payments) {
        await api.post(`/orders/${activeOrder.id}/pay`, { amount: p.amount, method: p.method });
      }
      await api.post(`/orders/${activeOrder.id}/close`);
      navigate('/waiter/dashboard');
    } catch (e) {
      alert('Erro ao fechar conta.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-modern overflow-hidden font-sans">
      
      {/* HEADER FIXO - Estilo App */}
      <header className="glass sticky top-0 z-10 px-4 pt-4 pb-3 shadow-sm border-b border-white/5">
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={28} />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tight">Mesa {tableId}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeOrder ? 'Ocupada' : 'Livre'}</p>
          </div>
          <button onClick={() => setIsCheckoutOpen(true)} className="p-2 -mr-2 text-orange-400 bg-orange-500/10 rounded-full hover:bg-orange-500/20 transition-colors border border-orange-500/20">
            <Receipt size={24} />
          </button>
        </div>

        {/* CATEGORIES HORIZONTAL SCROLL */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          <button 
            onClick={() => setActiveCategory(null)}
            className={`whitespace-nowrap px-5 py-2 rounded-2xl text-sm font-bold transition-all ${activeCategory === null ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-[#27272a]/50 text-slate-300 hover:bg-[#27272a]'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-2xl text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-[#27272a]/50 text-slate-300 hover:bg-[#27272a]'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* PRODUCT LIST SCROLLABLE */}
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, i) => (
            <div key={product.id} className="glass-card p-4 rounded-[2rem] flex justify-between items-center animate-slide-up border border-white/5" style={{ animationDelay: `${i * 0.05}s` }}>
              <div>
                <h3 className="font-bold text-slate-200 text-lg leading-tight mb-1">{product.name}</h3>
                <p className="text-blue-400 font-black">R$ {product.price.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setSelectedProduct(product)}
                disabled={product.stock_quantity === 0}
                className="bg-[#27272a] text-slate-300 w-12 h-12 rounded-2xl text-2xl font-medium flex items-center justify-center active:bg-blue-600 active:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3f3f46] shadow-sm border border-white/5"
              >
                +
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* FLOATING CART BUTTON (if items exist) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 w-full px-4 z-20 animate-slide-up">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex justify-between items-center px-6 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingBag size={20} />
              </div>
              <span>Ver Pedido</span>
            </div>
            <div className="bg-white text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-black">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </button>
        </div>
      )}

      {/* MODALS */}
      
      {/* MODAL: Adicionar Observação */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} className="bg-white/5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            
            <div className="flex justify-between items-center bg-[#27272a]/50 p-4 rounded-2xl mb-4 border border-white/5">
              <span className="text-slate-300 font-bold uppercase tracking-widest text-xs">Quantidade</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl font-black text-xl shadow-sm text-blue-400 active:scale-95 transition-all">-</button>
                <span className="font-black text-white text-xl w-8 text-center">{modalQuantity}</span>
                <button onClick={() => setModalQuantity(modalQuantity + 1)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl font-black text-xl shadow-sm text-blue-400 active:scale-95 transition-all">+</button>
              </div>
            </div>

            <textarea 
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              placeholder="Alguma observação? (ex: Sem gelo)"
              className="glass-input w-full rounded-2xl p-4 h-20 resize-none mb-4"
            ></textarea>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
              <button onClick={() => setObsText(prev => prev + 'Sem gelo ')} className="whitespace-nowrap px-4 py-2 bg-blue-900/20 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold active:bg-blue-900/40">Sem Gelo</button>
              <button onClick={() => setObsText(prev => prev + 'Gelo e limão ')} className="whitespace-nowrap px-4 py-2 bg-blue-900/20 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold active:bg-blue-900/40">Gelo e Limão</button>
              <button onClick={() => setObsText(prev => prev + 'Ponto menos ')} className="whitespace-nowrap px-4 py-2 bg-blue-900/20 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold active:bg-blue-900/40">Ponto Menos</button>
            </div>

            <button onClick={handleAddToCart} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-blue-600/30 active:bg-blue-700 active:scale-[0.98] transition-all">
              Adicionar ao Pedido
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Carrinho (Bottom Sheet) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end">
          <div className="bg-[#18181b] border-t border-white/10 w-full h-[85vh] rounded-t-[2.5rem] flex flex-col shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Pedido</h2>
                <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mt-1">Mesa {tableId}</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="bg-white/5 w-10 h-10 rounded-full font-bold text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {cart.map(item => (
                <div key={item.cartId} className="flex justify-between items-start border-b border-white/5 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                  <div>
                    <p className="font-bold text-lg text-slate-200 leading-tight"><span className="text-blue-400">{item.quantity}x</span> {item.product.name}</p>
                    {item.observations && <p className="text-sm font-medium text-orange-400 mt-1">Obs: {item.observations}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-black text-blue-400">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => setCart(cart.filter(i => i.cartId !== item.cartId))} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg text-xs font-bold active:bg-red-500/20">
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-[#18181b] border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <button onClick={handleSendOrder} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-lg active:scale-[0.98] transition-all shadow-lg shadow-green-600/30">
                ENVIAR PARA PRODUÇÃO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fechamento de Conta */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end">
          <div className="bg-[#18181b] border-t border-white/10 w-full h-[95vh] rounded-t-[2.5rem] flex flex-col shadow-2xl animate-slide-up">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#27272a]/30 rounded-t-[2.5rem]">
              <div>
                <h2 className="text-2xl font-black text-white">Conta</h2>
                <p className="text-orange-400 font-bold text-sm uppercase tracking-widest mt-1">Mesa {tableId}</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="bg-white/5 border border-white/10 w-10 h-10 rounded-full font-bold text-slate-400 hover:text-white shadow-sm">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" id="print-area">
              <div className="bg-[#27272a]/50 p-5 rounded-3xl border border-white/5">
                <h3 className="font-bold text-slate-500 mb-4 uppercase text-xs tracking-widest">Consumo</h3>
                {consumedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-300">{item.quantity}x {item.product.name}</span>
                    <span className="text-white font-black">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center text-xl font-black text-white">
                  <span>Total</span>
                  <span>R$ {totalConsumed.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handlePrint} className="w-full bg-[#27272a]/80 text-blue-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-blue-500/20 hover:bg-[#27272a] print:hidden transition-all shadow-sm">
                <Printer size={20} />
                Imprimir Pré-Conta
              </button>

              <div className="print:hidden">
                <h3 className="font-bold text-white mb-3 text-lg">Receber Pagamento</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button onClick={() => handleAddPayment('PIX')} className="bg-[#27272a]/50 border border-white/5 py-4 rounded-2xl flex flex-col items-center gap-2 active:border-teal-500/50 hover:bg-teal-900/10 transition-all shadow-sm">
                    <QrCode size={24} className="text-slate-300" />
                    <span className="font-bold text-xs text-slate-400">PIX</span>
                  </button>
                  <button onClick={() => handleAddPayment('Cartão')} className="bg-[#27272a]/50 border border-white/5 py-4 rounded-2xl flex flex-col items-center gap-2 active:border-blue-500/50 hover:bg-blue-900/10 transition-all shadow-sm">
                    <CreditCard size={24} className="text-slate-300" />
                    <span className="font-bold text-xs text-slate-400">Cartão</span>
                  </button>
                  <button onClick={() => handleAddPayment('Dinheiro')} className="bg-[#27272a]/50 border border-white/5 py-4 rounded-2xl flex flex-col items-center gap-2 active:border-green-500/50 hover:bg-green-900/10 transition-all shadow-sm">
                    <Banknote size={24} className="text-slate-300" />
                    <span className="font-bold text-xs text-slate-400">Espécie</span>
                  </button>
                </div>

                {payments.length > 0 && (
                  <div className="bg-[#27272a]/30 border border-white/5 shadow-sm p-4 rounded-3xl mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pagamentos Lançados</span>
                      <button onClick={() => setPayments([])} className="text-[10px] text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/20">Limpar</button>
                    </div>
                    {payments.map((p, i) => (
                      <div key={i} className="flex justify-between items-center font-bold text-white mb-3 border-b border-white/5 pb-3 last:border-0 last:pb-0 last:mb-0">
                        <span className="bg-white/10 px-3 py-1 rounded-lg text-slate-300 text-sm border border-white/5">{p.method}</span>
                        <div className="flex items-center gap-4">
                          <span>R$ {p.amount.toFixed(2)}</span>
                          <button onClick={() => setPayments(payments.filter((_, index) => index !== i))} className="bg-red-500/10 text-red-400 w-8 h-8 flex items-center justify-center rounded-full font-bold border border-red-500/20 hover:bg-red-500/20">&times;</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-[#18181b] border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] print:hidden z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Falta Receber</span>
                <span className={`text-2xl font-black ${remainingToPay > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  R$ {Math.max(0, remainingToPay).toFixed(2)}
                </span>
              </div>
              <button 
                onClick={handleFinishTable}
                disabled={remainingToPay > 0}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${remainingToPay <= 0 ? 'bg-green-600 text-white shadow-xl shadow-green-600/30 active:scale-[0.98] hover:bg-green-500' : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'}`}
              >
                {remainingToPay <= 0 ? 'FINALIZAR MESA' : 'AGUARDANDO PAGAMENTO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
