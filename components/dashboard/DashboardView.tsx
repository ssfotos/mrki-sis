import React from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../ui/Card';
import type { Product } from '../../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-6">
        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <span className="text-2xl">{icon}</span>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </Card>
);

const LowStockItem: React.FC<{product: Product}> = ({ product }) => (
    <li className="flex justify-between items-center py-2">
        <span className="text-gray-700">{product.name}</span>
        <span className="font-semibold text-red-500">{product.stock} restantes</span>
    </li>
);

const DashboardView: React.FC = () => {
    const { products } = useApp();

    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0).toFixed(2);
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold).slice(0, 5);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Panel</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Productos Totales" value={products.length} icon="📦" />
                <StatCard title="Valor Total del Stock" value={`$${totalStockValue}`} icon="💰" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Alertas de Stock Bajo">
                    {lowStockProducts.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                           {lowStockProducts.map(p => <LowStockItem key={p.id} product={p} />)}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">Ningún producto tiene stock bajo. ¡Buen trabajo!</p>
                    )}
                </Card>
                <Card title="Actividad Reciente">
                     <p className="text-center text-gray-500 py-4">El feed de actividad reciente estará disponible pronto.</p>
                </Card>
            </div>
        </div>
    );
};

export default DashboardView;