// Fix: Implement the main AppContext to provide state management for the entire application.
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Product, Supplier, Sale, Purchase, CartItem, SaleItem, OnlineOrder, Category, Client, PurchaseItem, StockHistory } from '../types';

// Initial data for demonstration purposes
const initialSuppliersData: Supplier[] = [
    { id: 'sup-1', name: 'Gourmet Foods Inc.', contactName: 'John Doe', email: 'john@gourmet.com', phone: '123-456-7890' },
    { id: 'sup-2', name: 'Bebidas Frescas Co.', contactName: 'Jane Smith', email: 'jane@bebidas.com', phone: '987-654-3210' },
    { id: 'sup-3', name: 'Panadería del Sol', contactName: 'Maria Garcia', email: 'maria@pansol.com', phone: '555-123-4567' },
];

const initialCategoriesData: Category[] = [
    { id: 'cat-1', name: 'Bebidas' },
    { id: 'cat-2', name: 'Panadería' },
    { id: 'cat-3', name: 'Snacks' },
];

const initialClientsData: Client[] = [
    { id: 'cli-1', name: 'Cliente de Prueba', address: 'Calle Falsa 123', phone: '555-5555', email: 'cliente@ejemplo.com', dni: '12345678' },
    { id: 'cli-2', name: 'Consumidor Final', address: '', phone: '000-0000', email: '', dni: '' },
];

const initialProductsData: Product[] = [
    { id: 'prod-1', name: 'Granos de Café Premium', sku: 'CAFE-001', category: 'Bebidas', supplierId: 'sup-1', stock: 50, lowStockThreshold: 10, costPrice: 10.50, sellingPrice: 22.99, image: 'https://images.unsplash.com/photo-1559924994-03c6b24068ce?q=80&w=400', description: 'Granos de café arábica de tueste medio de origen único de las altas montañas de Colombia.' },
    { id: 'prod-2', name: 'Té Verde Orgánico', sku: 'TE-001', category: 'Bebidas', supplierId: 'sup-2', stock: 35, lowStockThreshold: 10, costPrice: 5.00, sellingPrice: 12.50, image: 'https://images.unsplash.com/photo-1627435601361-ec25f2b74411?q=80&w=400', description: 'Hojas de té verde orgánico seleccionadas a mano, ricas en antioxidantes.' },
    { id: 'prod-3', name: 'Croissant de Mantequilla', sku: 'PAN-001', category: 'Panadería', supplierId: 'sup-3', stock: 24, lowStockThreshold: 8, costPrice: 1.20, sellingPrice: 3.50, image: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?q=80&w=400', description: 'Croissant hojaldrado y mantecoso, horneado fresco todas las mañanas.' },
    { id: 'prod-4', name: 'Jugo de Naranja Natural', sku: 'JUGO-001', category: 'Bebidas', supplierId: 'sup-2', stock: 40, lowStockThreshold: 15, costPrice: 2.00, sellingPrice: 4.50, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=400', description: 'Jugo 100% natural recién exprimido, sin azúcares añadidos.' },
    { id: 'prod-5', name: 'Tableta de Chocolate Oscuro 70%', sku: 'CHOC-001', category: 'Snacks', supplierId: 'sup-1', stock: 60, lowStockThreshold: 20, costPrice: 2.50, sellingPrice: 5.99, image: 'https://images.unsplash.com/photo-1549472093-b26a3a4a15a0?q=80&w=400', description: 'Chocolate oscuro intenso y rico con un 70% de cacao de origen sostenible.' },
    { id: 'prod-6', name: 'Pan de Masa Madre', sku: 'PAN-002', category: 'Panadería', supplierId: 'sup-3', stock: 15, lowStockThreshold: 5, costPrice: 3.00, sellingPrice: 7.00, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a8e2d6?q=80&w=400', description: 'Pan artesanal de masa madre con una corteza crujiente y una miga suave y aireada.' },
];

interface AppContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
    
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => Product;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    lowStockProducts: Product[];

    suppliers: Supplier[];
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;

    sales: Sale[];
    addSale: (sale: Omit<Sale, 'id' | 'date' | 'total' | 'items'> & { items: Omit<SaleItem, 'costPrice'>[] }, callback?: () => void) => void;
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;

    purchases: Purchase[];
    addPurchase: (purchase: Omit<Purchase, 'id'| 'date' | 'total'>) => void;
    updatePurchase: (purchase: Purchase) => void;
    deletePurchase: (id: string) => void;
    setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
    
    cart: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    updateCartItemQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;

    onlineOrders: OnlineOrder[];
    addOnlineOrder: (orderData: { customerName: string; customerEmail: string; customerPhone: string; items: CartItem[] }) => void;
    confirmAndProcessOrder: (orderId: string) => void;
    setOnlineOrders: React.Dispatch<React.SetStateAction<OnlineOrder[]>>;

    categories: Category[];
    addCategory: (category: Omit<Category, 'id'>) => Category;
    updateCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;

    clients: Client[];
    addClient: (client: Omit<Client, 'id'>) => Client;
    updateClient: (client: Client) => void;
    deleteClient: (id: string) => void;
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    
    stockHistory: StockHistory[];
    addStockHistory: (productId: string, type: StockHistory['type'], quantityChange: number, newStockLevel: number, notes?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateUniqueId = (prefix: string) => {
    // Combine timestamp with a random string to ensure uniqueness, especially in fast loops
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const [products, setProducts] = useLocalStorage<Product[]>('products', initialProductsData);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', initialSuppliersData);
    const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
    const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);
    const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
    const [onlineOrders, setOnlineOrders] = useLocalStorage<OnlineOrder[]>('onlineOrders', []);
    const [categories, setCategories] = useLocalStorage<Category[]>('categories', initialCategoriesData);
    const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClientsData);
    const [stockHistory, setStockHistory] = useLocalStorage<StockHistory[]>('stockHistory', []);
    
    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.stock <= p.lowStockThreshold);
    }, [products]);

    const login = (password: string): boolean => {
        if (password === 'admin') {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
    };
    
    // Stock History Management
    const addStockHistory = (productId: string, type: StockHistory['type'], quantityChange: number, newStockLevel: number, notes?: string) => {
        const newEntry: StockHistory = {
            id: generateUniqueId('hist'),
            productId,
            date: new Date().toISOString(),
            type,
            quantityChange,
            newStockLevel,
            notes
        };
        setStockHistory(prev => [newEntry, ...prev]);
    };

    // Product Management
    const addProduct = (product: Omit<Product, 'id'>): Product => {
        const newProduct: Product = { ...product, id: generateUniqueId('prod') };
        setProducts(prev => [...prev, newProduct]);
        addStockHistory(newProduct.id, 'initial_stock', newProduct.stock, newProduct.stock, 'Creación de producto');
        return newProduct;
    };
    
    const updateProduct = (updatedProduct: Product) => {
        setProducts(prev => {
            const originalProduct = prev.find(p => p.id === updatedProduct.id);
            if (originalProduct && originalProduct.stock !== updatedProduct.stock) {
                const quantityChange = updatedProduct.stock - originalProduct.stock;
                addStockHistory(updatedProduct.id, 'manual_adjustment', quantityChange, updatedProduct.stock, 'Edición manual de producto');
            }
            return prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
        });
    };

    const deleteProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };
    
    // Supplier Management
    const addSupplier = (supplier: Omit<Supplier, 'id'>): Supplier => {
        const newSupplier = { ...supplier, id: generateUniqueId('sup') };
        setSuppliers(prev => [...prev, newSupplier]);
        return newSupplier;
    };
    
    const updateSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    };

    const deleteSupplier = (id: string) => {
        if (products.some(p => p.supplierId === id)) {
            alert("No se puede eliminar un proveedor que tiene productos asociados.");
            return;
        }
        if (window.confirm("¿Estás seguro de que quieres eliminar este proveedor?")) {
            setSuppliers(prev => prev.filter(s => s.id !== id));
        }
    };
    
    // Sales Management
    const addSale = (saleData: Omit<Sale, 'id' | 'date' | 'total' | 'items'> & { items: Omit<SaleItem, 'costPrice'>[] }, callback?: () => void) => {
        const itemsWithCost = saleData.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                ...item,
                costPrice: product ? product.costPrice : 0, // Snapshot the cost price at time of sale
            };
        });

        const total = itemsWithCost.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        const newSale: Sale = {
            ...saleData,
            id: generateUniqueId('sale'),
            date: new Date().toISOString(),
            total,
            items: itemsWithCost, // Use the enriched items array
        };
        
        // Update stock
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            newSale.items.forEach(item => {
                const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    updatedProducts[productIndex].stock -= item.quantity;
                    const newStock = updatedProducts[productIndex].stock;
                    addStockHistory(item.productId, 'sale', -item.quantity, newStock, `Venta ID: ${newSale.id.slice(-6)}`);
                }
            });
            return updatedProducts;
        });

        setSales(prev => [newSale, ...prev]);
        if (callback) callback();
    };

    // Purchase Management
    const updateStockFromPurchase = (items: PurchaseItem[], purchaseId: string) => {
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            items.forEach(item => {
                const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    updatedProducts[productIndex].stock += item.quantity;
                    const newStock = updatedProducts[productIndex].stock;
                    updatedProducts[productIndex].costPrice = item.cost;
                    addStockHistory(item.productId, 'purchase', item.quantity, newStock, `Compra ID: ${purchaseId.slice(-6)}`);
                }
            });
            return updatedProducts;
        });
    }

    const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'date' | 'total'>) => {
        const total = purchaseData.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
        const newPurchase: Purchase = {
            ...purchaseData,
            id: generateUniqueId('purch'),
            date: new Date().toISOString(),
            total,
            status: 'pending', // Always create purchases as pending
        };

        setPurchases(prev => [newPurchase, ...prev]);
    };

    const updatePurchase = (updatedPurchase: Purchase) => {
        const originalPurchase = purchases.find(p => p.id === updatedPurchase.id);

        if (!originalPurchase) return;

        // If status is changing from pending to received, update the stock
        if (originalPurchase.status === 'pending' && updatedPurchase.status === 'received') {
            updateStockFromPurchase(updatedPurchase.items, updatedPurchase.id);
        }
        
        setPurchases(prev => prev.map(p => p.id === updatedPurchase.id ? updatedPurchase : p));
    };

    const deletePurchase = (id: string) => {
         if (window.confirm("¿Estás seguro de que quieres eliminar esta compra? Esta acción no afectará el stock actual.")) {
            setPurchases(prev => prev.filter(p => p.id !== id));
        }
    };
    
    // Cart Management
    const addToCart = (product: Product, quantity: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, quantity, image: product.image }];
        });
    };
    
    const updateCartItemQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };
    
    // Online Order Management
    const addOnlineOrder = (orderData: { customerName: string; customerEmail: string; customerPhone: string; items: CartItem[] }) => {
        const total = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newOrder: OnlineOrder = {
            ...orderData,
            id: generateUniqueId('order'),
            date: new Date().toISOString(),
            total,
            status: 'pending',
        };
        setOnlineOrders(prev => [newOrder, ...prev]);
    };

    const confirmAndProcessOrder = (orderId: string) => {
        const order = onlineOrders.find(o => o.id === orderId);
        if (!order || order.status !== 'pending') return;

        // Find or create client
        let client = clients.find(c => c.email === order.customerEmail || c.phone === order.customerPhone);
        if (!client) {
            client = addClient({
                name: order.customerName,
                email: order.customerEmail,
                phone: order.customerPhone,
                address: '',
                dni: ''
            });
        }

        const saleItems = order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
        }));
        
        addSale({
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items: saleItems,
            paymentMethod: 'card',
            clientId: client.id,
            origin: 'online'
        });

        setOnlineOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'paid' } : o));
        alert('Pedido confirmado y procesado. El stock ha sido actualizado.');
    };

    // Category Management
    const addCategory = (category: Omit<Category, 'id'>): Category => {
        const newCategory: Category = { ...category, id: generateUniqueId('cat') };
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
    };

    const updateCategory = (updatedCategory: Category) => {
        const oldCategory = categories.find(c => c.id === updatedCategory.id);
        if (!oldCategory || oldCategory.name === updatedCategory.name) {
            setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
            return;
        }

        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
        
        // Bulk update products
        setProducts(prevProducts => prevProducts.map(p => {
            if (p.category === oldCategory.name) {
                return { ...p, category: updatedCategory.name };
            }
            return p;
        }));
    };

    const deleteCategory = (id: string) => {
        const categoryToDelete = categories.find(c => c.id === id);
        if (!categoryToDelete) return;

        if (window.confirm(`¿Estás seguro de que quieres eliminar el rubro "${categoryToDelete.name}"? Los productos asociados quedarán sin rubro.`)) {
            setCategories(prev => prev.filter(c => c.id !== id));

            // Bulk update products
            setProducts(prevProducts => prevProducts.map(p => {
                if (p.category === categoryToDelete.name) {
                    return { ...p, category: '' };
                }
                return p;
            }));
        }
    };
    
    // Client Management
    const addClient = (client: Omit<Client, 'id'>): Client => {
        const newClient = { ...client, id: generateUniqueId('cli') };
        setClients(prev => [...prev, newClient]);
        return newClient;
    };
    
    const updateClient = (updatedClient: Client) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    const deleteClient = (id: string) => {
         if (sales.some(s => s.clientId === id)) {
            alert("No se puede eliminar un cliente que tiene ventas asociadas.");
            return;
        }
        if (window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
            setClients(prev => prev.filter(c => c.id !== id));
        }
    };


    const value = {
        isAuthenticated,
        login,
        logout,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        setProducts,
        lowStockProducts,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        setSuppliers,
        sales,
        addSale,
        setSales,
        purchases,
        addPurchase,
        updatePurchase,
        deletePurchase,
        setPurchases,
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        setCart,
        onlineOrders,
        addOnlineOrder,
        confirmAndProcessOrder,
        setOnlineOrders,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        setCategories,
        clients,
        addClient,
        updateClient,
        deleteClient,
        setClients,
        stockHistory,
        addStockHistory,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};