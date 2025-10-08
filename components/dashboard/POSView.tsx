
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useApp } from '../../context/AppContext';
import type { Product, CartItem as AppCartItem, Client } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { PlusIcon, TrashIcon } from '../ui/Icon';

// Interfaz local para los artículos del carrito del POS, con un ID único por línea.
interface POSCartItem extends AppCartItem {
  id: string;
}

const POSProductCard: React.FC<{ product: Product; onProductClick: () => void }> = ({ product, onProductClick }) => (
    <Card className="flex flex-col text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={onProductClick}>
        <div className="relative">
            <img src={product.image || 'https://picsum.photos/300/200'} alt={product.name} className="aspect-video w-full object-cover"/>
        </div>
        <div className="p-2 flex-grow flex flex-col justify-between">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
            <p className="text-lg font-bold text-indigo-600 mt-1">${product.sellingPrice.toFixed(2)}</p>
        </div>
    </Card>
);

const POSCartItem: React.FC<{ item: POSCartItem; onUpdate: (itemId: string, qty: number) => void; onRemove: (itemId: string) => void }> = ({ item, onUpdate, onRemove }) => (
    <div className="flex items-center py-2">
        <div className="flex-1">
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs text-gray-500">Precio: ${item.price.toFixed(2)}</p>
        </div>
        <input 
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, parseInt(e.target.value))}
            className="w-16 mx-2 text-center border rounded"
            min="1"
        />
        <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)}><TrashIcon className="h-4 w-4 text-red-500"/></Button>
    </div>
);

const POSView: React.FC = () => {
    const { products, addSale, clients } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<POSCartItem[]>([]);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    
    // Estado para el modal de añadir producto
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [productToAdd, setProductToAdd] = useState<Product | null>(null);
    const [addFormState, setAddFormState] = useState({ quantity: 1, price: 0 });

    // State for the checkout modal
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isCasualCustomer, setIsCasualCustomer] = useState(true);
    const [casualCustomerName, setCasualCustomerName] = useState('');
    const [casualCustomerPhone, setCasualCustomerPhone] = useState('');
    const [adjustmentPercentage, setAdjustmentPercentage] = useState<string>('0');

    const selectedClient = useMemo(() => {
        if (!isCasualCustomer && selectedClientId) {
            return clients.find(c => c.id === selectedClientId);
        }
        return null;
    }, [clients, selectedClientId, isCasualCustomer]);

    const handleProductClick = (product: Product) => {
        setProductToAdd(product);
        setAddFormState({ quantity: 1, price: product.sellingPrice });
        setAddModalOpen(true);
    };

    const handleAddFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Permite valores decimales, pero si el campo está vacío, lo trata como 0
        setAddFormState(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) || 0 }));
    };

    const handleAddToCart = () => {
        if (!productToAdd) return;
        const quantity = Number(addFormState.quantity);
        const price = Number(addFormState.price);

        if (quantity <= 0) {
            alert("La cantidad debe ser mayor que cero.");
            return;
        };

        setCart(currentCart => {
            const existingItemIndex = currentCart.findIndex(item => item.productId === productToAdd.id && item.price === price);

            if (existingItemIndex > -1) {
                const updatedCart = [...currentCart];
                const existingItem = updatedCart[existingItemIndex];
                updatedCart[existingItemIndex] = {
                    ...existingItem,
                    quantity: existingItem.quantity + quantity,
                };
                return updatedCart;
            } else {
                const newItem: POSCartItem = {
                    id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    productId: productToAdd.id,
                    name: productToAdd.name,
                    price: price,
                    quantity: quantity,
                    image: productToAdd.image
                };
                return [...currentCart, newItem];
            }
        });

        setAddModalOpen(false);
        setProductToAdd(null);
    };
    
    const updateCartQuantity = (itemId: string, quantity: number) => {
        if (quantity < 1) { removeFromCart(itemId); return; }
        setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const adjustmentValue = useMemo(() => {
        const percentage = parseFloat(adjustmentPercentage);
        if (isNaN(percentage)) return 0;
        return (cartTotal * percentage) / 100;
    }, [cartTotal, adjustmentPercentage]);

    const finalTotal = useMemo(() => {
        return cartTotal + adjustmentValue;
    }, [cartTotal, adjustmentValue]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            alert("El carrito está vacío.");
            return;
        }
        // Reset modal state on open
        setAdjustmentPercentage('0');
        setIsCasualCustomer(true);
        setSelectedClientId('');
        setCasualCustomerName('');
        setCasualCustomerPhone('');
        setConfirmModalOpen(true);
    };

    const confirmSale = () => {
        let customerData;
        if (isCasualCustomer) {
            if (!casualCustomerPhone) {
                alert("El teléfono del cliente es obligatorio para clientes ocasionales.");
                return;
            }
            customerData = {
                customerName: casualCustomerName || 'Cliente Ocasional',
                customerPhone: casualCustomerPhone,
                clientId: undefined,
            };
        } else {
            if (!selectedClient) {
                alert("Por favor, seleccione un cliente válido.");
                return;
            }
            customerData = {
                customerName: selectedClient.name,
                customerPhone: selectedClient.phone,
                clientId: selectedClient.id,
            };
        }

        const percentage = parseFloat(adjustmentPercentage) || 0;
        const multiplier = 1 + (percentage / 100);

        const saleItems = cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price * multiplier,
        }));
        
        addSale({ 
            ...customerData, 
            items: saleItems, 
            paymentMethod: 'card', 
            origin: 'pos' 
        }, () => {
            setCart([]);
            setConfirmModalOpen(false);
            alert('¡Venta completada con éxito!');
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Products Grid */}
            <div className="flex-1 flex flex-col">
                <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    containerClassName="mb-4 flex-shrink-0"
                />
                <div className="flex-grow overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(p => <POSProductCard key={p.id} product={p} onProductClick={() => handleProductClick(p)} />)}
                    </div>
                </div>
            </div>

            {/* Sale Cart */}
            <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
                <div className="md:sticky md:top-6">
                    <div className="bg-white rounded-lg shadow-md flex flex-col" style={{height: 'calc(100vh - 8rem)'}}>
                        <h2 className="text-xl font-bold p-4 border-b flex-shrink-0">Venta Actual</h2>
                        <div className="flex-1 p-4 overflow-y-auto">
                            {cart.length > 0 ? (
                                cart.map(item => (
                                    <POSCartItem 
                                        key={item.id}
                                        item={item}
                                        onUpdate={updateCartQuantity}
                                        onRemove={removeFromCart}
                                    />
                                ))
                            ) : (
                                <p className="text-center text-gray-500 mt-10">El carrito está vacío</p>
                            )}
                        </div>
                        <div className="p-4 border-t space-y-4 flex-shrink-0">
                            <div className="flex justify-between font-bold text-2xl">
                                <span>Total:</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <Button className="w-full" size="lg" onClick={handleCompleteSale} disabled={cart.length === 0}>
                                Completar Venta
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title={`Añadir ${productToAdd?.name}`}>
                <div className="space-y-4">
                    <Input
                        label="Cantidad"
                        type="number"
                        name="quantity"
                        value={addFormState.quantity}
                        onChange={handleAddFormChange}
                        min="1"
                    />
                    <Input
                        label="Precio Unitario"
                        type="number"
                        name="price"
                        step="0.01"
                        value={addFormState.price}
                        onChange={handleAddFormChange}
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAddToCart}>Añadir al Carrito</Button>
                </div>
            </Modal>
            
             <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirmar Venta">
                <div className="space-y-4">
                    <div className="p-4 border rounded-md space-y-3">
                        <div className="flex justify-between items-center text-lg">
                            <span>Subtotal:</span>
                            <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center gap-4">
                            <Input
                                label="Ajuste % (- dcto, + recargo)"
                                type="number"
                                step="0.01"
                                value={adjustmentPercentage}
                                onChange={(e) => setAdjustmentPercentage(e.target.value)}
                                containerClassName="flex-grow"
                            />
                            <div className="text-lg text-right pt-5 w-28">
                                <span className={`font-semibold ${adjustmentValue < 0 ? 'text-green-600' : (adjustmentValue > 0 ? 'text-red-600' : 'text-gray-800')}`}>
                                    {adjustmentValue.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-2xl font-bold border-t pt-3 mt-3">
                            <span>Total a Pagar:</span>
                            <span>${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                            <label className="font-semibold">Tipo de Cliente</label>
                             <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input type="radio" name="customerType" checked={isCasualCustomer} onChange={() => setIsCasualCustomer(true)} className="form-radio"/>
                                    <span className="ml-2">Ocasional</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="customerType" checked={!isCasualCustomer} onChange={() => setIsCasualCustomer(false)} className="form-radio"/>
                                    <span className="ml-2">Registrado</span>
                                </label>
                             </div>
                        </div>

                        {isCasualCustomer ? (
                            <div className="mt-4 space-y-4">
                                 <Input 
                                    label="Nombre del Cliente (Opcional)"
                                    value={casualCustomerName}
                                    onChange={(e) => setCasualCustomerName(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                />
                                <Input 
                                    label="Teléfono del Cliente"
                                    type="tel"
                                    value={casualCustomerPhone}
                                    onChange={(e) => setCasualCustomerPhone(e.target.value)}
                                    placeholder="Requerido para la venta"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="mt-4">
                                <label htmlFor="client-select" className="block text-sm font-medium text-gray-700">Seleccionar Cliente</label>
                                <select 
                                    id="client-select" 
                                    value={selectedClientId} 
                                    onChange={e => setSelectedClientId(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="">-- Seleccione --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>Cancelar</Button>
                    <Button onClick={confirmSale}>Confirmar Venta</Button>
                </div>
            </Modal>
        </div>
    );
};

export default POSView;
