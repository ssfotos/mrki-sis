import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Product, CartItem, Client } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { PlusIcon, TrashIcon } from '../ui/Icon';

const POSProductCard: React.FC<{ product: Product; onAddToCart: () => void }> = ({ product, onAddToCart }) => (
    <Card className="flex flex-col text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={onAddToCart}>
        <div className="relative">
            <img src={product.image || 'https://picsum.photos/300/200'} alt={product.name} className="h-32 w-full object-cover"/>
            {/* Se eliminó la capa de "AGOTADO" para permitir ventas con stock negativo */}
        </div>
        <div className="p-2 flex-grow flex flex-col justify-between">
            <h3 className="text-sm font-semibold truncate">{product.name}</h3>
            <p className="text-lg font-bold text-indigo-600">${product.sellingPrice.toFixed(2)}</p>
        </div>
    </Card>
);

const POSCartItem: React.FC<{ item: CartItem; onUpdate: (qty: number) => void; onRemove: () => void }> = ({ item, onUpdate, onRemove }) => (
    <div className="flex items-center py-2">
        <div className="flex-1">
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
        </div>
        <input 
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate(parseInt(e.target.value))}
            className="w-16 mx-2 text-center border rounded"
            min="1"
        />
        <Button variant="ghost" size="sm" onClick={onRemove}><TrashIcon className="h-4 w-4 text-red-500"/></Button>
    </div>
);

const POSView: React.FC = () => {
    const { products, addSale, clients } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    
    // State for the checkout modal
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isCasualCustomer, setIsCasualCustomer] = useState(true);
    const [casualCustomerName, setCasualCustomerName] = useState('');
    const [casualCustomerPhone, setCasualCustomerPhone] = useState('');

    const selectedClient = useMemo(() => {
        if (!isCasualCustomer && selectedClientId) {
            return clients.find(c => c.id === selectedClientId);
        }
        return null;
    }, [clients, selectedClientId, isCasualCustomer]);

    const addToCart = (product: Product) => {
        setCart(currentCart => {
            const existingItemIndex = currentCart.findIndex(item => item.productId === product.id);

            if (existingItemIndex > -1) {
                // Si el artículo ya existe, crea un nuevo array del carrito
                const updatedCart = [...currentCart];
                // Y en ese nuevo array, reemplaza el artículo existente con una versión actualizada
                const updatedItem = {
                    ...updatedCart[existingItemIndex],
                    quantity: updatedCart[existingItemIndex].quantity + 1,
                };
                updatedCart[existingItemIndex] = updatedItem;
                return updatedCart;
            } else {
                // Si el artículo no existe, añádelo al carrito
                const newItem = {
                    productId: product.id,
                    name: product.name,
                    price: product.sellingPrice,
                    quantity: 1,
                    image: product.image
                };
                return [...currentCart, newItem];
            }
        });
    };
    
    const updateCartQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) { removeFromCart(productId); return; }
        setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.productId !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            alert("El carrito está vacío.");
            return;
        }
        // Reset modal state on open
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

        const saleItems = cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
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
        <div className="flex flex-col md:flex-row gap-6">
            {/* Products Grid */}
            <div className="flex-1">
                <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    containerClassName="mb-4"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map(p => <POSProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} />)}
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
                                        key={item.productId}
                                        item={item}
                                        onUpdate={(qty) => updateCartQuantity(item.productId, qty)}
                                        onRemove={() => removeFromCart(item.productId)}
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
            
             <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirmar Venta">
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
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