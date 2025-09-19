import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OnlineOrder } from '../../types';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const OnlineOrdersView: React.FC = () => {
    const { onlineOrders, confirmAndProcessOrder } = useApp();
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

    const handleViewDetails = (order: OnlineOrder) => {
        setSelectedOrder(order);
        setDetailModalOpen(true);
    };
    
    const handleConfirm = () => {
        if (selectedOrder) {
            confirmAndProcessOrder(selectedOrder.id);
            setDetailModalOpen(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    }

    const getStatusBadge = (status: 'pending' | 'paid' | 'shipped') => {
        const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'paid':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'shipped':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };
    
    const OrderDetailModal: React.FC = () => {
        if (!selectedOrder) return null;
        
        return (
             <Modal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Detalles del Pedido #${selectedOrder.id.slice(-6)}`}>
                 <div id="printable-section">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            #printable-section, #printable-section * { visibility: visible; }
                            #printable-section { position: absolute; left: 0; top: 0; width: 100%; }
                            .no-print { display: none !important; }
                        }
                    `}</style>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Información del Cliente</h3>
                            <p><strong>Nombre:</strong> {selectedOrder.customerName}</p>
                            <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                            <p><strong>Teléfono:</strong> {selectedOrder.customerPhone}</p>
                            <p><strong>Fecha:</strong> {new Date(selectedOrder.date).toLocaleString()}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Artículos del Pedido</h3>
                            <ul className="divide-y divide-gray-200 mt-2">
                                {selectedOrder.items.map(item => (
                                    <li key={item.productId} className="py-2 flex justify-between">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-right font-bold text-xl pt-4 border-t">
                            Total: ${selectedOrder.total.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-6 no-print">
                    <div>
                        {selectedOrder.status === 'pending' && (
                             <Button onClick={handleConfirm}>
                                Marcar como Pagado y Procesar
                            </Button>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="secondary" onClick={handlePrint}>Imprimir</Button>
                        <Button variant="ghost" onClick={() => setDetailModalOpen(false)}>Cerrar</Button>
                    </div>
                </div>
            </Modal>
        )
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Pedidos Online</h1>
            <Card>
                <Table headers={['ID Pedido', 'Cliente', 'Fecha', 'Total', 'Estado', 'Acciones']}>
                    {onlineOrders.map(order => (
                        <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">#{order.id.slice(-6)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${order.total.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                               <span className={getStatusBadge(order.status)}>
                                 {order.status === 'pending' ? 'Pendiente' : (order.status === 'paid' ? 'Pagado' : 'Enviado')}
                               </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>Ver Detalles</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
                {onlineOrders.length === 0 && <p className="text-center text-gray-500 py-8">No hay pedidos online todavía.</p>}
            </Card>

            {selectedOrder && <OrderDetailModal />}
        </div>
    );
};

export default OnlineOrdersView;