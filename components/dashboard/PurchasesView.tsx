import React, { useState, ChangeEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Purchase, Product, Supplier } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { PlusIcon, TrashIcon } from '../ui/Icon';

// Re-using ProductForm from ProductsView might be complex due to props.
// A simpler, dedicated form for this context is better.
const NewProductMiniForm: React.FC<{ onSave: (product: Omit<Product, 'id' | 'supplierId'>) => void }> = ({ onSave }) => {
    const [name, setName] = useState('');
    const [costPrice, setCostPrice] = useState(0);
    const [sellingPrice, setSellingPrice] = useState(0);

    const handleSave = () => {
        onSave({
            name,
            costPrice,
            sellingPrice,
            sku: '',
            category: 'General',
            stock: 0,
            lowStockThreshold: 5
        });
        setName(''); setCostPrice(0); setSellingPrice(0);
    };

    return (
        <div className="space-y-2 p-4 border rounded-md bg-gray-50">
            <h4 className="font-semibold">Crear Nuevo Producto Rápido</h4>
            <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Costo" type="number" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} />
            <Input label="Precio Venta" type="number" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} />
            <Button onClick={handleSave} size="sm" disabled={!name}>Guardar Producto</Button>
        </div>
    );
};


const PurchaseForm: React.FC<{
    purchase?: Purchase | null,
    onSave: (purchase: Omit<Purchase, 'id'> | Purchase) => void,
    onClose: () => void
}> = ({ purchase, onSave, onClose }) => {
    const { products, suppliers, addProduct, addSupplier } = useApp();
    const [supplierId, setSupplierId] = useState(purchase?.supplierId || '');
    const [items, setItems] = useState(purchase?.items || []);
    
    const [showNewProductForm, setShowNewProductForm] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, cost: 0 }]);
    };
    
    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        const product = products.find(p => p.id === (field === 'productId' ? value : newItems[index].productId));
        if (field === 'productId') {
            newItems[index] = { ...newItems[index], productId: String(value), cost: product?.costPrice || 0 };
        } else {
             newItems[index] = { ...newItems[index], [field]: value };
        }
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSaveNewProduct = (productData: Omit<Product, 'id' | 'supplierId'>) => {
        if (!supplierId) {
            alert("Por favor, seleccione un proveedor primero.");
            return;
        }
        addProduct({ ...productData, supplierId });
        setShowNewProductForm(false);
    };

    const handleCreateSupplier = () => {
        if (!newSupplierName) return;
        const newSupplier = addSupplier({ name: newSupplierName, contactName: '', email: '', phone: '' });
        setSupplierId(newSupplier.id);
        setNewSupplierName("");
    }

    const total = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const purchaseData = {
            date: purchase?.date || new Date().toISOString(),
            supplierId,
            items,
            total,
            status: purchase?.status || 'pending',
        };
        onSave(purchase ? { ...purchase, ...purchaseData } : purchaseData);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                 <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Seleccione un Proveedor</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => setNewSupplierName(" ")} title="Añadir Proveedor">
                        <PlusIcon />
                    </Button>
                </div>
                {newSupplierName !== "" && (
                     <div className="flex items-end gap-2 p-2 border rounded-md">
                        <Input label="Nuevo Proveedor" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
                        <Button type="button" onClick={handleCreateSupplier} size="sm">Crear</Button>
                    </div>
                )}
                <div>
                    <h3 className="font-semibold mb-2">Artículos</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="flex-grow mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="">Seleccione Producto</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-20" placeholder="Cant."/>
                                <Input type="number" step="0.01" value={item.cost} onChange={e => handleItemChange(index, 'cost', Number(e.target.value))} className="w-24" placeholder="Costo" />
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                         <Button type="button" variant="secondary" size="sm" onClick={handleAddItem}>Añadir Artículo</Button>
                         <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewProductForm(!showNewProductForm)}>{showNewProductForm ? 'Ocultar Formulario' : 'Crear Nuevo Producto'}</Button>
                    </div>
                </div>
                {showNewProductForm && <NewProductMiniForm onSave={handleSaveNewProduct} />}
                <div className="text-right font-bold text-xl">Total: ${total.toFixed(2)}</div>
            </div>
            <div className="flex justify-end space-x-2 pt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{purchase ? 'Guardar Cambios' : 'Registrar Compra'}</Button>
            </div>
        </form>
    );
};

const PurchasesView: React.FC = () => {
    const { purchases, suppliers, addPurchase, updatePurchase, deletePurchase } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'N/A';
    
    const handleSave = (data: Omit<Purchase, 'id'> | Purchase) => {
        if ('id' in data) {
            updatePurchase(data);
        } else {
            addPurchase(data);
        }
    };

    const handleEdit = (purchase: Purchase) => {
        setEditingPurchase(purchase);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingPurchase(null);
        setIsModalOpen(true);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Compras</h1>
                <Button onClick={handleAddNew}><PlusIcon className="h-5 w-5 mr-2" /> Registrar Nueva Compra</Button>
            </div>
            <Card>
                <Table headers={['ID Compra', 'Proveedor', 'Fecha', 'Total', 'Estado', 'Acciones']}>
                    {purchases.map(p => (
                        <tr key={p.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{p.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getSupplierName(p.supplierId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${p.total.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                               <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                 {p.status === 'received' ? 'Recibido' : 'Pendiente'}
                               </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>Editar</Button>
                                <Button variant="ghost" size="sm" onClick={() => deletePurchase(p.id)}><TrashIcon className="h-5 w-5 text-red-500" /></Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPurchase ? 'Editar Compra' : 'Registrar Nueva Compra'}>
                <PurchaseForm purchase={editingPurchase} onSave={handleSave} onClose={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default PurchasesView;