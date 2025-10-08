// Fix: Implement the main AppContext to provide state management for the entire application.
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Product, Supplier, Sale, Purchase, CartItem, SaleItem, OnlineOrder, Category, Client, PurchaseItem, StockHistory } from '../types';
import { openDB, IDBPDatabase } from 'idb';

// --- IndexedDB Helper Functions ---
const DB_NAME = 'mrk-inventory-db';
const DB_VERSION = 1;
const STORES = ['products', 'suppliers', 'sales', 'purchases', 'onlineOrders', 'categories', 'clients', 'stockHistory'];

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

const getDb = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });
            },
        });
    }
    return dbPromise;
};

// Fix: Add a trailing comma to generic type parameters in arrow functions
// within this .tsx file to prevent ambiguity with JSX syntax, which was causing numerous parsing errors.
const db = {
    isFirstTime: async (): Promise<boolean> => {
        const dbInstance = await getDb();
        const count = await dbInstance.count('products');
        return count === 0;
    },
    bulkPut: async <T,>(storeName: string, data: T[]): Promise<void> => {
        const dbInstance = await getDb();
        const tx = dbInstance.transaction(storeName, 'readwrite');
        await Promise.all(data.map(item => tx.store.put(item)));
        await tx.done;
    },
    getAll: async <T,>(storeName: string): Promise<T[]> => {
        const dbInstance = await getDb();
        return dbInstance.getAll(storeName);
    },
    add: async <T,>(storeName: string, item: T): Promise<void> => {
        const dbInstance = await getDb();
        await dbInstance.add(storeName, item);
    },
    update: async <T,>(storeName: string, item: T): Promise<void> => {
        const dbInstance = await getDb();
        await dbInstance.put(storeName, item);
    },
    deleteById: async (storeName: string, id: string): Promise<void> => {
        const dbInstance = await getDb();
        await dbInstance.delete(storeName, id);
    },
    clearStore: async (storeName: string): Promise<void> => {
        const dbInstance = await getDb();
        await dbInstance.clear(storeName);
    }
};


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
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
    updatePassword: (oldPassword: string, newPassword: string) => boolean;
    
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    setProducts: (products: Product[]) => Promise<void>;
    lowStockProducts: Product[];

    suppliers: Supplier[];
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
    updateSupplier: (supplier: Supplier) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    setSuppliers: (suppliers: Supplier[]) => Promise<void>;

    sales: Sale[];
    addSale: (sale: Omit<Sale, 'id' | 'date' | 'total' | 'items'> & { items: Omit<SaleItem, 'costPrice'>[] }, callback?: () => void) => Promise<void>;
    cancelSale: (saleId: string) => Promise<void>;
    setSales: (sales: Sale[]) => Promise<void>;

    purchases: Purchase[];
    addPurchase: (purchase: Omit<Purchase, 'id'| 'date' | 'total'>) => Promise<void>;
    updatePurchase: (purchase: Purchase) => Promise<void>;
    deletePurchase: (id: string) => Promise<void>;
    setPurchases: (purchases: Purchase[]) => Promise<void>;
    
    cart: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    updateCartItemQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;

    onlineOrders: OnlineOrder[];
    addOnlineOrder: (orderData: { customerName: string; customerEmail: string; customerPhone: string; items: CartItem[] }) => Promise<void>;
    confirmAndProcessOrder: (orderId: string) => Promise<void>;
    setOnlineOrders: (orders: OnlineOrder[]) => Promise<void>;

    categories: Category[];
    addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
    updateCategory: (category: Category) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    setCategories: (categories: Category[]) => Promise<void>;

    clients: Client[];
    addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
    updateClient: (client: Client) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    setClients: (clients: Client[]) => Promise<void>;
    
    stockHistory: StockHistory[];
    addStockHistory: (productId: string, type: StockHistory['type'], quantityChange: number, newStockLevel: number, notes?: string) => Promise<void>;
    exportData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateUniqueId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useLocalStorage<string>('admin-password', 'admin');
    const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
    
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const isFirst = await db.isFirstTime();
                if (isFirst) {
                    await db.bulkPut('suppliers', initialSuppliersData);
                    await db.bulkPut('categories', initialCategoriesData);
                    await db.bulkPut('clients', initialClientsData);
                    await db.bulkPut('products', initialProductsData);
                }

                const [
                    loadedProducts, loadedSuppliers, loadedSales, loadedPurchases,
                    loadedOnlineOrders, loadedCategories, loadedClients, loadedStockHistory,
                ] = await Promise.all([
                    db.getAll<Product>('products'), db.getAll<Supplier>('suppliers'),
                    db.getAll<Sale>('sales'), db.getAll<Purchase>('purchases'),
                    db.getAll<OnlineOrder>('onlineOrders'), db.getAll<Category>('categories'),
                    db.getAll<Client>('clients'), db.getAll<StockHistory>('stockHistory'),
                ]);
                
                setProducts(loadedProducts);
                setSuppliers(loadedSuppliers);
                setSales(loadedSales);
                setPurchases(loadedPurchases);
                setOnlineOrders(loadedOnlineOrders);
                setCategories(loadedCategories);
                setClients(loadedClients);
                setStockHistory(loadedStockHistory);
            } catch (error) {
                console.error("Failed to load data from DB", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);
    
    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.stock <= p.lowStockThreshold);
    }, [products]);

    const login = (inputPassword: string): boolean => {
        if (inputPassword === password) { setIsAuthenticated(true); return true; }
        return false;
    };

    const logout = () => { setIsAuthenticated(false); };
    
    const updatePassword = (oldPassword: string, newPassword: string): boolean => {
        if (oldPassword === password) { setPassword(newPassword); return true; }
        return false;
    };
    
    // Stock History Management
    const addStockHistory = async (productId: string, type: StockHistory['type'], quantityChange: number, newStockLevel: number, notes?: string) => {
        const newEntry: StockHistory = {
            id: generateUniqueId('hist'), productId, date: new Date().toISOString(), type, quantityChange, newStockLevel, notes
        };
        await db.add('stockHistory', newEntry);
        setStockHistory(prev => [newEntry, ...prev]);
    };

    // Product Management
    const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
        const newProduct: Product = { ...product, id: generateUniqueId('prod') };
        await db.add('products', newProduct);
        setProducts(prev => [...prev, newProduct]);
        await addStockHistory(newProduct.id, 'initial_stock', newProduct.stock, newProduct.stock, 'Creación de producto');
        return newProduct;
    };
    
    const updateProduct = async (updatedProduct: Product) => {
        const originalProduct = products.find(p => p.id === updatedProduct.id);
        if (originalProduct && originalProduct.stock !== updatedProduct.stock) {
            const quantityChange = updatedProduct.stock - originalProduct.stock;
            await addStockHistory(updatedProduct.id, 'manual_adjustment', quantityChange, updatedProduct.stock, 'Edición manual de producto');
        }
        await db.update('products', updatedProduct);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const deleteProduct = async (id: string) => {
        await db.deleteById('products', id);
        setProducts(prev => prev.filter(p => p.id !== id));
    };
    
    // Supplier Management
    const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
        const newSupplier = { ...supplier, id: generateUniqueId('sup') };
        await db.add('suppliers', newSupplier);
        setSuppliers(prev => [...prev, newSupplier]);
        return newSupplier;
    };
    
    const updateSupplier = async (updatedSupplier: Supplier) => {
        await db.update('suppliers', updatedSupplier);
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    };

    const deleteSupplier = async (id: string) => {
        if (products.some(p => p.supplierId === id)) {
            alert("No se puede eliminar un proveedor que tiene productos asociados."); return;
        }
        if (window.confirm("¿Estás seguro de que quieres eliminar este proveedor?")) {
            await db.deleteById('suppliers', id);
            setSuppliers(prev => prev.filter(s => s.id !== id));
        }
    };
    
    // Sales Management
    const addSale = async (saleData: Omit<Sale, 'id' | 'date' | 'total' | 'items'> & { items: Omit<SaleItem, 'costPrice'>[] }, callback?: () => void) => {
        const itemsWithCost = saleData.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return { ...item, costPrice: product ? product.costPrice : 0 };
        });
        const total = itemsWithCost.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newSale: Sale = { ...saleData, id: generateUniqueId('sale'), date: new Date().toISOString(), total, items: itemsWithCost, status: 'completed' };
        
        const updatedProducts: Product[] = [];
        for (const item of newSale.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const newStock = product.stock - item.quantity;
                const updatedProduct = { ...product, stock: newStock };
                updatedProducts.push(updatedProduct);
                await addStockHistory(item.productId, 'sale', -item.quantity, newStock, `Venta ID: ${newSale.id.slice(-6)}`);
            }
        }
        await db.bulkPut('products', updatedProducts);
        setProducts(prev => prev.map(p => updatedProducts.find(up => up.id === p.id) || p));
        
        await db.add('sales', newSale);
        setSales(prev => [newSale, ...prev]);
        if (callback) callback();
    };

    const cancelSale = async (saleId: string) => {
        const saleToCancel = sales.find(s => s.id === saleId);
        if (!saleToCancel || saleToCancel.status === 'cancelled') {
            alert("Esta venta no se puede anular o ya ha sido anulada.");
            return;
        }

        const updatedProducts: Product[] = [];
        for (const item of saleToCancel.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const newStock = product.stock + item.quantity;
                const updatedProduct = { ...product, stock: newStock };
                updatedProducts.push(updatedProduct);
                await addStockHistory(item.productId, 'sale_cancellation', item.quantity, newStock, `Anulación Venta ID: ${saleToCancel.id.slice(-6)}`);
            }
        }
        
        if (updatedProducts.length > 0) {
            await db.bulkPut('products', updatedProducts);
            setProducts(prev => prev.map(p => updatedProducts.find(up => up.id === p.id) || p));
        }

        const cancelledSale = { ...saleToCancel, status: 'cancelled' as const };
        await db.update('sales', cancelledSale);
        setSales(prev => prev.map(s => s.id === saleId ? cancelledSale : s));

        alert(`Venta #${saleId.slice(-6)} anulada. El stock ha sido restaurado.`);
    };

    // Purchase Management
    const updateStockFromPurchase = async (items: PurchaseItem[], purchaseId: string) => {
        const updatedProducts: Product[] = [];
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const newStock = product.stock + item.quantity;
                const updatedProduct = { ...product, stock: newStock, costPrice: item.cost };
                updatedProducts.push(updatedProduct);
                await addStockHistory(item.productId, 'purchase', item.quantity, newStock, `Compra ID: ${purchaseId.slice(-6)}`);
            }
        }
        await db.bulkPut('products', updatedProducts);
        setProducts(prev => prev.map(p => updatedProducts.find(up => up.id === p.id) || p));
    }

    const addPurchase = async (purchaseData: Omit<Purchase, 'id' | 'date' | 'total'>) => {
        const total = purchaseData.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
        const newPurchase: Purchase = { ...purchaseData, id: generateUniqueId('purch'), date: new Date().toISOString(), total, status: 'pending' };
        await db.add('purchases', newPurchase);
        setPurchases(prev => [newPurchase, ...prev]);
    };

    const updatePurchase = async (updatedPurchase: Purchase) => {
        const originalPurchase = purchases.find(p => p.id === updatedPurchase.id);
        if (!originalPurchase) return;

        if (originalPurchase.status === 'pending' && updatedPurchase.status === 'received') {
            await updateStockFromPurchase(updatedPurchase.items, updatedPurchase.id);
        }
        await db.update('purchases', updatedPurchase);
        setPurchases(prev => prev.map(p => p.id === updatedPurchase.id ? updatedPurchase : p));
    };

    const deletePurchase = async (id: string) => {
         if (window.confirm("¿Estás seguro de que quieres eliminar esta compra? Esta acción no afectará el stock actual.")) {
            await db.deleteById('purchases', id);
            setPurchases(prev => prev.filter(p => p.id !== id));
        }
    };
    
    // Cart Management
    const addToCart = (product: Product, quantity: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, quantity, image: product.image }];
        });
    };
    
    const updateCartItemQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) { removeFromCart(productId); return; }
        setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const clearCart = () => { setCart([]); };
    
    // Online Order Management
    const addOnlineOrder = async (orderData: { customerName: string; customerEmail: string; customerPhone: string; items: CartItem[] }) => {
        const total = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newOrder: OnlineOrder = { ...orderData, id: generateUniqueId('order'), date: new Date().toISOString(), total, status: 'pending' };
        await db.add('onlineOrders', newOrder);
        setOnlineOrders(prev => [newOrder, ...prev]);
    };

    const confirmAndProcessOrder = async (orderId: string) => {
        const order = onlineOrders.find(o => o.id === orderId);
        if (!order || order.status !== 'pending') return;

        let client = clients.find(c => c.email === order.customerEmail || c.phone === order.customerPhone);
        if (!client) {
            client = await addClient({ name: order.customerName, email: order.customerEmail, phone: order.customerPhone, address: '', dni: '' });
        }

        const saleItems = order.items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price }));
        await addSale({ customerName: order.customerName, customerPhone: order.customerPhone, items: saleItems, paymentMethod: 'card', clientId: client.id, origin: 'online' });

        const updatedOrder = { ...order, status: 'paid' as const };
        await db.update('onlineOrders', updatedOrder);
        setOnlineOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        alert('Pedido confirmado y procesado. El stock ha sido actualizado.');
    };

    // Category Management
    const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
        const newCategory: Category = { ...category, id: generateUniqueId('cat') };
        await db.add('categories', newCategory);
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
    };

    const updateCategory = async (updatedCategory: Category) => {
        const oldCategory = categories.find(c => c.id === updatedCategory.id);
        
        await db.update('categories', updatedCategory);
        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
        
        if (oldCategory && oldCategory.name !== updatedCategory.name) {
            const productsToUpdate = products.filter(p => p.category === oldCategory.name).map(p => ({ ...p, category: updatedCategory.name }));
            if(productsToUpdate.length > 0) {
                await db.bulkPut('products', productsToUpdate);
                setProducts(prev => prev.map(p => productsToUpdate.find(up => up.id === p.id) || p));
            }
        }
    };

    const deleteCategory = async (id: string) => {
        const categoryToDelete = categories.find(c => c.id === id);
        if (!categoryToDelete) return;

        if (window.confirm(`¿Estás seguro de que quieres eliminar el rubro "${categoryToDelete.name}"? Los productos asociados quedarán sin rubro.`)) {
            await db.deleteById('categories', id);
            setCategories(prev => prev.filter(c => c.id !== id));
            
            const productsToUpdate = products.filter(p => p.category === categoryToDelete.name).map(p => ({ ...p, category: '' }));
            if (productsToUpdate.length > 0) {
                 await db.bulkPut('products', productsToUpdate);
                 setProducts(prev => prev.map(p => productsToUpdate.find(up => up.id === p.id) || p));
            }
        }
    };
    
    // Client Management
    const addClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
        const newClient = { ...client, id: generateUniqueId('cli') };
        await db.add('clients', newClient);
        setClients(prev => [...prev, newClient]);
        return newClient;
    };
    
    const updateClient = async (updatedClient: Client) => {
        await db.update('clients', updatedClient);
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    const deleteClient = async (id: string) => {
         if (sales.some(s => s.clientId === id)) {
            alert("No se puede eliminar un cliente que tiene ventas asociadas."); return;
        }
        if (window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
            await db.deleteById('clients', id);
            setClients(prev => prev.filter(c => c.id !== id));
        }
    };
    
    // Data setters for import/restore
    const createSetter = <T,>(storeName: string, stateSetter: React.Dispatch<React.SetStateAction<T[]>>) => async (data: T[]) => {
        await db.clearStore(storeName);
        await db.bulkPut(storeName, data);
        stateSetter(data);
    };

    const exportData = () => {
        const dataToExport = {
            products,
            suppliers,
            sales,
            purchases,
            onlineOrders,
            categories,
            clients,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(dataToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `mrk-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const value = {
        isLoading, isAuthenticated, login, logout, updatePassword,
        products, addProduct, updateProduct, deleteProduct, setProducts: createSetter('products', setProducts),
        lowStockProducts,
        suppliers, addSupplier, updateSupplier, deleteSupplier, setSuppliers: createSetter('suppliers', setSuppliers),
        sales, addSale, cancelSale, setSales: createSetter('sales', setSales),
        purchases, addPurchase, updatePurchase, deletePurchase, setPurchases: createSetter('purchases', setPurchases),
        cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, setCart,
        onlineOrders, addOnlineOrder, confirmAndProcessOrder, setOnlineOrders: createSetter('onlineOrders', setOnlineOrders),
        categories, addCategory, updateCategory, deleteCategory, setCategories: createSetter('categories', setCategories),
        clients, addClient, updateClient, deleteClient, setClients: createSetter('clients', setClients),
        stockHistory, addStockHistory,
        exportData,
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