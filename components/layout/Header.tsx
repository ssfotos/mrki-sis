import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BellIcon, MenuIcon, ChevronDoubleLeftIcon } from '../ui/Icon';

interface HeaderProps {
    onToggleSidebar: () => void;
    onToggleMobileSidebar: () => void;
    isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleMobileSidebar, isSidebarCollapsed }) => {
  const { lowStockProducts, onlineOrders } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const lowStockCount = lowStockProducts.length;
  const pendingOrders = onlineOrders.filter(order => order.status === 'pending');
  const pendingOrdersCount = pendingOrders.length;
  const totalNotifications = lowStockCount + pendingOrdersCount;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b flex-shrink-0">
      <div className="flex items-center">
         <button onClick={onToggleMobileSidebar} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md md:hidden">
            <MenuIcon />
         </button>
         <button onClick={onToggleSidebar} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md hidden md:block">
            <ChevronDoubleLeftIcon isCollapsed={isSidebarCollapsed} />
         </button>
        <h1 className="text-xl font-semibold text-gray-700 ml-2 hidden sm:block">Sistema de Gestión</h1>
      </div>
      <div className="flex items-center">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            aria-label={`Notificaciones: ${totalNotifications} alertas`}
          >
            <BellIcon className="h-6 w-6" />
            {totalNotifications > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 -mt-1 -mr-1 rounded-full ring-2 ring-white bg-red-500 text-white text-xs flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 border">
              <div className="py-2">
                <div className="px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold text-gray-800">Notificaciones ({totalNotifications})</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {totalNotifications > 0 ? (
                    <>
                      {lowStockCount > 0 && (
                        <div>
                          <h4 className="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 uppercase">Alertas de Stock Bajo</h4>
                          {lowStockProducts.map(product => (
                            <div key={`stock-${product.id}`} className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-gray-100 transition-colors duration-150">
                              <img className="h-10 w-10 rounded-full object-cover flex-shrink-0" src={product.image || 'https://picsum.photos/40/40'} alt={product.name} />
                              <div className="ml-3 flex-grow">
                                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">Quedan <span className="font-bold text-red-600">{product.stock}</span> unidades</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {pendingOrdersCount > 0 && (
                        <div>
                           <h4 className="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 uppercase">Pedidos Online Pendientes</h4>
                           {pendingOrders.map(order => (
                             <div key={`order-${order.id}`} className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-gray-100 transition-colors duration-150">
                               <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                 <span className="text-blue-600 text-lg">🛍️</span>
                               </div>
                               <div className="ml-3 flex-grow">
                                  <p className="text-sm font-medium text-gray-800 truncate">{order.customerName}</p>
                                  <p className="text-xs text-gray-500">Pedido de <span className="font-bold text-gray-800">${order.total.toFixed(2)}</span></p>
                               </div>
                             </div>
                           ))}
                        </div>
                      )}

                    </>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      <p>¡Todo en orden!</p>
                      <p className="mt-1">No hay notificaciones nuevas.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <span className="text-sm font-medium ml-4 hidden sm:inline">Bienvenido, Admin</span>
        <div className="ml-4 h-10 w-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
          A
        </div>
      </div>
    </header>
  );
};

export default Header;