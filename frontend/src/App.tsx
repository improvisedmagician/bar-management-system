import { Routes, Route } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import WaiterLogin from './pages/Waiter/WaiterLogin'
import WaiterDashboard from './pages/Waiter/WaiterDashboard'
import WaiterMenu from './pages/Waiter/WaiterMenu'
import WaiterOrders from './pages/Waiter/WaiterOrders'
import KdsDashboard from './pages/KDS/KdsDashboard'
import PosDashboard from './pages/POS/PosDashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import Home from './pages/Home'
import { supabase } from './services/api'

function App() {
  const [notification, setNotification] = useState<{message: string, id: number} | null>(null);
  const prevProntoRef = useRef(0);

  // Polling para notificações do garçom
  useEffect(() => {
    if (!window.location.pathname.startsWith('/waiter')) return;

    const poll = async () => {
      try {
        const { data: orders, error } = await supabase.from('orders').select('table_id, items:order_items(status)').eq('status', 'Aberto');
        if (error) return;
        let currentPronto = 0;
        let latestTable = null;

        orders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            if (item.status === 'Pronto') {
              currentPronto++;
              latestTable = order.table_id;
            }
          });
        });

        if (prevProntoRef.current > 0 && currentPronto > prevProntoRef.current) {
          setNotification({ message: `Pedido da Mesa ${latestTable} está pronto!`, id: Date.now() });
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
          setTimeout(() => setNotification(null), 6000);
        }
        prevProntoRef.current = currentPronto;
      } catch (e) {}
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-slate-200 font-sans relative">
      
      {/* Alerta Global de Notificação para o Garçom */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 z-50 animate-bounce cursor-pointer border-4 border-blue-400" onClick={() => setNotification(null)}>
          🔔 <span className="text-lg">{notification.message}</span>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Painel Garçom */}
        <Route path="/waiter/login" element={<WaiterLogin />} />
        <Route path="/waiter/dashboard" element={<WaiterDashboard />} />
        <Route path="/waiter/menu/:tableId" element={<WaiterMenu />} />
        <Route path="/waiter/orders" element={<WaiterOrders />} />
        
        {/* Outros Módulos */}
        <Route path="/kds" element={<KdsDashboard />} />
        <Route path="/pos" element={<PosDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  )
}

export default App
