// Fix: Implement the main Layout component to structure the app UI.
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardView from '../dashboard/DashboardView';
import ProductsView from '../dashboard/ProductsView';
import POSView from '../dashboard/POSView';
import PurchasesView from '../dashboard/PurchasesView';
import SuppliersView from '../dashboard/SuppliersView';
import ReportsView from '../dashboard/ReportsView';
import SettingsView from '../dashboard/SettingsView';
import CatalogView from '../catalog/CatalogView';
import OnlineOrdersView from '../dashboard/OnlineOrdersView';
import CategoriesView from '../dashboard/CategoriesView';
import ClientsView from '../dashboard/ClientsView';
import SalesRecordView from '../dashboard/SalesRecordView';
import PendingPurchasesView from '../dashboard/PendingPurchasesView';

interface LayoutProps {
    onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarCollapsed(true);
            }
        };
        handleResize(); // Check on initial load
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNavigate = (view: string) => {
        setCurrentView(view);
        if (window.innerWidth < 768) {
            setMobileSidebarOpen(false); // Close sidebar on nav click on mobile
        }
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'products':
                return <ProductsView />;
            case 'categories':
                return <CategoriesView />;
            case 'clients':
                return <ClientsView />;
            case 'pos':
                return <POSView />;
            case 'sales':
                return <SalesRecordView />;
            case 'purchases':
                return <PurchasesView />;
            case 'pendingPurchases':
                return <PendingPurchasesView />;
            case 'suppliers':
                return <SuppliersView />;
            case 'reports':
                return <ReportsView />;
             case 'onlineOrders':
                return <OnlineOrdersView />;
            case 'settings':
                return <SettingsView />;
            case 'catalog':
                return <CatalogView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                currentView={currentView}
                onNavigate={handleNavigate}
                onLogout={onLogout}
                isCollapsed={isSidebarCollapsed}
                isOpenOnMobile={isMobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    onToggleSidebar={() => setIsSidebarCollapsed(p => !p)}
                    onToggleMobileSidebar={() => setMobileSidebarOpen(p => !p)}
                    isSidebarCollapsed={isSidebarCollapsed}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default Layout;