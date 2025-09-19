import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, TrashIcon, XIcon } from '../ui/Icon';
import CartView from './CartView';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { CartItem } from '../../types';

const CatalogProductCard: React.FC<{
    product: {id: string; name: string; image?: string; sellingPrice: number; stock: number;};
    onAddToCart: () => void;
}> = ({ product, onAddToCart }) => (
    <Card className="flex flex-col">
        <img src={product.image || 'https://picsum.photos/300/200'} alt={product.name} className="h-48 w-full object-cover"/>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-semibold truncate">{product.name}</h3>
            <p className="text-gray-500 mt-1">${product.sellingPrice.toFixed(2)}</p>
            <div className="mt-auto pt-4">
                <Button onClick={onAddToCart} className="w-full">
                   <><PlusIcon className="h-5 w-5 mr-2"/> Añadir al Carrito</>
                </Button>
            </div>
        </div>
    </Card>
);

const CartItemRow: React.FC<{
    item: CartItem;
    onUpdate: (id: string, qty: number) => void;
    onRemove: (id: string) => void;
}> = ({ item, onUpdate, onRemove }) => (
     <div className="flex items-center space-x-4">
        <img src={item.image || 'https://picsum.photos/80/80'} alt={item.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{item.name}</p>
            <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
            <div className="flex items-center mt-2">
                <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdate(item.productId, parseInt(e.target.value))}
                    className="w-16 text-center border rounded-md"
                />
            </div>
        </div>
        <button onClick={() => onRemove(item.productId)} className="p-1 text-gray-500 hover:text-red-600">
            <TrashIcon className="h-5 w-5" />
        </button>
    </div>
);

const CatalogView: React.FC = () => {
    const { products, cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, addOnlineOrder } = useApp();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleConfirmCheckout = () => {
        if (!customerName || !customerEmail || !customerPhone) {
            alert('Por favor, ingrese su nombre, correo electrónico y teléfono.');
            return;
        }
        addOnlineOrder({ customerName, customerEmail, customerPhone, items: cart });
        alert('¡Gracias por tu pedido! Nos pondremos en contacto contigo pronto para confirmar los detalles del pago y envío.');
        clearCart();
        setCheckoutModalOpen(false);
        setIsCartOpen(false);
    };

    const CartContents = () => (
         <>
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                <h2 className="text-xl font-semibold">Tu Carrito</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-full hover:bg-gray-200 lg:hidden">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            {cart.length > 0 ? (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.map(item => (
                    <CartItemRow 
                        key={item.productId}
                        item={item}
                        onUpdate={updateCartItemQuantity}
                        onRemove={removeFromCart}
                    />
                ))}
                </div>
                <div className="p-4 border-t space-y-4 bg-gray-50 flex-shrink-0">
                <div className="flex justify-between font-bold text-lg">
                    <span>Subtotal:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={() => setCheckoutModalOpen(true)}>
                    Proceder al Pago
                </Button>
                <Button variant="ghost" className="w-full" onClick={clearCart}>
                    Vaciar Carrito
                </Button>
                </div>
            </>
            ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                <span className="text-4xl mb-4">🛒</span>
                <p className="text-lg font-semibold text-gray-700">Tu carrito está vacío</p>
                <p className="text-gray-500">Añade productos del catálogo para empezar.</p>
            </div>
            )}
         </>
    );

    return (
        <div className="relative">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Products */}
                <div className="flex-1">
                     <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Catálogo Online</h1>
                        <Button onClick={() => setIsCartOpen(true)} className="lg:hidden">
                            🛒 Carrito ({cartTotalItems})
                        </Button>
                    </div>
                    <p className="text-gray-600 mb-6">
                        ¡Bienvenido a nuestra tienda en línea! Explora nuestros productos a continuación.
                        <span className="font-semibold"> Nota:</span> Esta es una demostración y el proceso de pago no es funcional.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map(product => (
                            <CatalogProductCard key={product.id} product={product} onAddToCart={() => addToCart(product, 1)} />
                        ))}
                    </div>
                </div>

                {/* Desktop Cart */}
                <div className="hidden lg:block w-full lg:w-96 flex-shrink-0">
                     <div className="lg:sticky lg:top-6">
                        <div className="bg-white shadow-xl flex flex-col rounded-lg" style={{ height: 'calc(100vh - 8rem)' }}>
                            <CartContents />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Cart Panel */}
            <CartView isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}>
                <CartContents />
            </CartView>
            
             <Modal isOpen={isCheckoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="Finalizar Pedido">
                <div className="space-y-4">
                    <p>Por favor, ingrese sus datos para completar el pedido. Nos comunicaremos con usted para coordinar el pago y el envío.</p>
                    <Input 
                        label="Nombre Completo"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        required
                    />
                    <Input 
                        label="Correo Electrónico"
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        required
                    />
                    <Input 
                        label="Teléfono"
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        required
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => setCheckoutModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmCheckout}>Confirmar Pedido</Button>
                </div>
            </Modal>
        </div>
    );
};

export default CatalogView;