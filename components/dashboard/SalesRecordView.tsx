import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const SalesRecordView: React.FC = () => {
    const { sales, clients, products, cancelSale } = useApp();
    
    const getMonthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const getToday = () => new Date().toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(getMonthStart());
    const [endDate, setEndDate] = useState<string>(getToday());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);


    const clientMap = useMemo(() => {
        return new Map(clients.map(client => [client.id, client.name]));
    }, [clients]);

    const filteredSales = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return sales
            .filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= start && saleDate <= end;
            })
            .filter(sale => {
                const customerName = sale.clientId ? clientMap.get(sale.clientId) : sale.customerName;
                return customerName?.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, startDate, endDate, searchTerm, clientMap]);
    
    const handleConfirmCancelSale = async () => {
        if (selectedSale) {
            await cancelSale(selectedSale.id);
            setIsConfirmCancelOpen(false);
            setSelectedSale(null);
        }
    };
    
    const SaleDetailModal = () => {
        if (!selectedSale) return null;

        return (
            <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title={`Detalles de la Venta #${selectedSale.id.slice(-6)}`}>
                 <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold">Información del Cliente</h3>
                        <p><strong>Nombre:</strong> {selectedSale.clientId ? clientMap.get(selectedSale.clientId) : selectedSale.customerName}</p>
                        <p><strong>Teléfono:</strong> {selectedSale.customerPhone}</p>
                        <p><strong>Fecha:</strong> {new Date(selectedSale.date).toLocaleString()}</p>
                        <p><strong>Origen:</strong> <span className="font-medium">{selectedSale.origin === 'pos' ? 'Punto de Venta' : 'Catálogo Online'}</span></p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Artículos Vendidos</h3>
                        <ul className="divide-y divide-gray-200 mt-2 max-h-60 overflow-y-auto">
                            {selectedSale.items.map(item => {
                                const product = products.find(p => p.id === item.productId);
                                return (
                                    <li key={item.productId} className="py-2 flex justify-between">
                                        <span>{product?.name || 'Producto no encontrado'} x {item.quantity}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="text-right font-bold text-xl pt-4 border-t">
                        Total: ${selectedSale.total.toFixed(2)}
                    </div>
                </div>
                 <div className="flex justify-between items-center pt-6">
                    <div>
                        <Button variant="danger" onClick={() => setIsConfirmCancelOpen(true)} disabled={selectedSale.status === 'cancelled'}>
                            {selectedSale.status === 'cancelled' ? 'Venta Anulada' : 'Anular Venta'}
                        </Button>
                    </div>
                    <Button variant="secondary" onClick={() => setSelectedSale(null)}>Cerrar</Button>
                </div>
            </Modal>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Registro de Ventas</h1>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    <Input
                        label="Desde"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        label="Hasta"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                     <Input
                        label="Buscar por Cliente"
                        type="search"
                        placeholder="Nombre del cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            <Card>
                 <Table headers={['ID Venta', 'Fecha', 'Cliente', 'Origen', 'Total', 'Estado', 'Acciones']}>
                    {filteredSales.map(sale => (
                        <tr key={sale.id} className={sale.status === 'cancelled' ? 'bg-gray-100 text-gray-500' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{sale.id.slice(-6)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {sale.clientId ? clientMap.get(sale.clientId) : sale.customerName}
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.origin === 'pos' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                 {sale.origin === 'pos' ? 'Punto de Venta' : 'Online'}
                               </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${sale.total.toFixed(2)}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    sale.status === 'cancelled' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                    {sale.status === 'cancelled' ? 'Anulada' : 'Completada'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}>Ver Detalles</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
                {filteredSales.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron ventas con los filtros actuales.</p>}
            </Card>

            <SaleDetailModal />
            
            <Modal
                isOpen={isConfirmCancelOpen}
                onClose={() => setIsConfirmCancelOpen(false)}
                title="Confirmar Anulación"
            >
                <p>
                    ¿Estás seguro de que quieres anular la venta <strong>#{selectedSale?.id.slice(-6)}</strong>?
                    <br />
                    El stock de los productos involucrados será restaurado. Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => setIsConfirmCancelOpen(false)}>
                        No, Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleConfirmCancelSale}>
                        Sí, Anular Venta
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default SalesRecordView;