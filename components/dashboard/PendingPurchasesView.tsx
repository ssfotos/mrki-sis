import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Purchase, PurchaseItem } from '../../types';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { TrashIcon } from '../ui/Icon';

const ReceivePurchaseModal: React.FC<{
    purchase: Purchase;
    onClose: () => void;
    onConfirm: (purchase: Purchase) => void;
}> = ({ purchase, onClose, onConfirm }) => {
    const { products } = useApp();
    const [items, setItems] = useState<PurchaseItem[]>(JSON.parse(JSON.stringify(purchase.items))); // Deep copy

    const handleItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: Number(value) };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const total = useMemo(() => items.reduce((sum, item) => sum + (item.cost * item.quantity), 0), [items]);

    const handleConfirmReception = () => {
        const updatedPurchase = {
            ...purchase,
            items,
            total,
            status: 'received' as const,
        };
        onConfirm(updatedPurchase);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Recibir Compra #${purchase.id.slice(-6)}`}>
            <div className="space-y-4">
                <p>Ajusta las cantidades y costos si hay diferencias con la entrega real. Al confirmar, el stock y los costos de los productos se actualizarán.</p>
                
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    <h3 className="font-semibold">Artículos Recibidos</h3>
                    {items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                <span className="flex-grow font-medium text-sm">{product?.name || 'Producto no encontrado'}</span>
                                <Input label="Cant." type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} containerClassName="w-24" />
                                <Input label="Costo U." type="number" step="0.01" value={item.cost} onChange={e => handleItemChange(index, 'cost', e.target.value)} containerClassName="w-28" />
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
                 <div className="text-right font-bold text-xl pt-4 border-t">
                    Total Final: ${total.toFixed(2)}
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-6">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleConfirmReception}>Confirmar Recepción y Actualizar Stock</Button>
            </div>
        </Modal>
    );
}


const PendingPurchasesView: React.FC = () => {
    const { purchases, suppliers, updatePurchase } = useApp();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

    const pendingPurchases = useMemo(() => {
        return purchases
            .filter(p => p.status === 'pending')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [purchases]);

    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'N/A';

    const handleReceiveClick = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setModalOpen(true);
    };
    
    const handleConfirmReception = (updatedPurchase: Purchase) => {
        updatePurchase(updatedPurchase);
        setModalOpen(false);
        setSelectedPurchase(null);
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Compras Pendientes de Recepción</h1>
            <Card>
                 <Table headers={['ID Compra', 'Proveedor', 'Fecha', 'Total Esperado', 'Acciones']}>
                    {pendingPurchases.map(purchase => (
                        <tr key={purchase.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">#{purchase.id.slice(-6)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getSupplierName(purchase.supplierId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(purchase.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${purchase.total.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button size="sm" onClick={() => handleReceiveClick(purchase)}>
                                    Recibir Mercadería
                                </Button>
                            </td>
                        </tr>
                    ))}
                </Table>
                {pendingPurchases.length === 0 && <p className="text-center text-gray-500 py-8">No hay compras pendientes de recibir.</p>}
            </Card>

            {isModalOpen && selectedPurchase && (
                <ReceivePurchaseModal 
                    purchase={selectedPurchase}
                    onClose={() => setModalOpen(false)}
                    onConfirm={handleConfirmReception}
                />
            )}
        </div>
    );
};

export default PendingPurchasesView;