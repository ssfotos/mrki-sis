// Fix: Create the main navigation Sidebar component.
import React from 'react';
import { DashboardIcon, ProductsIcon, POSIcon, PurchasesIcon, SuppliersIcon, ReportsIcon, SettingsIcon, LogoutIcon, BellIcon, TagIcon, ClientsIcon, SalesIcon, InboxArrowDownIcon } from '../ui/Icon';

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    isCollapsed: boolean;
    isOpenOnMobile: boolean;
    onClose: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, isCollapsed, onClick }) => (
    <li>
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`flex items-center p-3 text-base font-normal rounded-lg transition-colors
                ${isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }
                ${isCollapsed ? 'justify-center' : ''}
            `}
        >
            <span className="w-6 h-6 flex-shrink-0">{icon}</span>
            <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
        </a>
    </li>
);

const NavHeader: React.FC<{ label: string; isCollapsed: boolean }> = ({ label, isCollapsed }) => {
    if (isCollapsed) {
        return <hr className="my-2 mx-3 border-t border-gray-200" />;
    }
    return (
        <h3 className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
        </h3>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, isCollapsed, isOpenOnMobile, onClose }) => {
    
    const mainNavItems = [
        { id: 'dashboard', label: 'Panel', icon: <DashboardIcon /> },
        { id: 'sales', label: 'Ventas', icon: <SalesIcon /> },
        { id: 'reports', label: 'Reportes', icon: <ReportsIcon /> },
    ];

    const menuGroups = [
        {
            title: 'Operaciones',
            items: [
                { id: 'pos', label: 'Punto de Venta', icon: <POSIcon /> },
                { id: 'onlineOrders', label: 'Pedidos Online', icon: <BellIcon /> },
                { id: 'pendingPurchases', label: 'Compras Pendientes', icon: <InboxArrowDownIcon /> },
            ]
        },
        {
            title: 'Tablas',
            items: [
                { id: 'products', label: 'Productos', icon: <ProductsIcon /> },
                { id: 'categories', label: 'Rubros', icon: <TagIcon /> },
                { id: 'clients', label: 'Clientes', icon: <ClientsIcon /> },
                { id: 'suppliers', label: 'Proveedores', icon: <SuppliersIcon /> },
                { id: 'purchases', label: 'Compras', icon: <PurchasesIcon /> },
            ]
        },
        {
            title: 'Catálogo',
            items: [
                { id: 'catalog', label: 'Ver Catálogo', icon: <ProductsIcon /> },
            ]
        },
        {
            title: 'Configuración',
            items: [
                { id: 'settings', label: 'Configuración', icon: <SettingsIcon /> },
            ]
        }
    ];

    const sidebarContent = (
        <>
            <div className={`flex items-center justify-center h-20 border-b ${isCollapsed ? 'px-2' : ''}`}>
                 <span className="text-3xl mr-2 flex-shrink-0">📦</span>
                <span className={`text-2xl font-bold text-gray-800 transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>MRK</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-2">
                    {mainNavItems.map(item => (
                        <NavItem
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            isActive={currentView === item.id}
                            onClick={() => onNavigate(item.id)}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </ul>
                
                {menuGroups.map(group => (
                    <div key={group.title}>
                        <NavHeader label={group.title} isCollapsed={isCollapsed} />
                        <ul className="space-y-2">
                            {group.items.map(item => (
                                <NavItem
                                    key={item.id}
                                    label={item.label}
                                    icon={item.icon}
                                    isActive={currentView === item.id}
                                    onClick={() => onNavigate(item.id)}
                                    isCollapsed={isCollapsed}
                                />
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t">
                <button
                    onClick={onLogout}
                    className={`flex items-center w-full p-3 text-base font-normal text-white bg-red-500 rounded-lg hover:bg-red-600 ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogoutIcon className="w-6 h-6 flex-shrink-0" />
                    <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Cerrar Sesión</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col bg-white shadow-md transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                {sidebarContent}
            </aside>
            
            {/* Mobile Sidebar */}
            {isOpenOnMobile && <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={onClose}></div>}
            <aside className={`md:hidden fixed inset-y-0 left-0 z-30 flex flex-col bg-white shadow-md transition-transform duration-300 ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'} w-64`}>
                {sidebarContent}
            </aside>
        </>
    );
};

export default Sidebar;