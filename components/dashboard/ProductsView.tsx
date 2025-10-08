import React, { useState, ChangeEvent, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, StockHistory } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { PlusIcon, TrashIcon } from '../ui/Icon';
import * as XLSX from 'xlsx';

export const ProductForm: React.FC<{ // Exported for use in PurchasesView
    product?: Product | null;
    onSave: (product: Omit<Product, 'id'> | Product) => void;
    onClose: () => void;
}> = ({ product, onSave, onClose }) => {
    const { suppliers, categories } = useApp();
    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        category: product?.category || '',
        supplierId: product?.supplierId || '',
        stock: product?.stock || 0,
        lowStockThreshold: product?.lowStockThreshold || 10,
        costPrice: product?.costPrice || 0,
        sellingPrice: product?.sellingPrice || 0,
        image: product?.image || '',
        description: product?.description || '',
    });
    const [profitMargin, setProfitMargin] = useState<string | number>('');

    useEffect(() => {
        const cost = formData.costPrice;
        const selling = formData.sellingPrice;
        if (cost > 0 && selling > 0) {
            const margin = ((selling - cost) / cost) * 100;
            setProfitMargin(margin.toFixed(2));
        } else {
            setProfitMargin('');
        }
    }, [formData.costPrice, formData.sellingPrice]);

    const handleMarginChange = (e: ChangeEvent<HTMLInputElement>) => {
        const marginValue = e.target.value;
        setProfitMargin(marginValue);

        const newMargin = parseFloat(marginValue);
        if (!isNaN(newMargin) && formData.costPrice > 0) {
            const newSellingPrice = formData.costPrice * (1 + newMargin / 100);
            setFormData(prev => ({
                ...prev,
                sellingPrice: parseFloat(newSellingPrice.toFixed(2))
            }));
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['stock', 'lowStockThreshold', 'costPrice', 'sellingPrice'];
        
        setFormData(prev => {
            const isNumeric = numericFields.includes(name);
            const parsedValue = isNumeric ? Number(value) : value;
            return { ...prev, [name]: parsedValue };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
            onSave({ ...product, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" label="Nombre del Producto" value={formData.name} onChange={handleChange} required />
                <Input name="sku" label="SKU" value={formData.sku} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría (Rubro)</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value="">Sin Rubro</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Proveedor</label>
                    <select
                        id="supplierId"
                        name="supplierId"
                        value={formData.supplierId}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    >
                        <option value="">Seleccione un Proveedor</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="stock" label="Stock Actual" type="number" value={formData.stock} onChange={handleChange} required />
                <Input name="lowStockThreshold" label="Umbral Stock Bajo" type="number" value={formData.lowStockThreshold} onChange={handleChange} required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input name="costPrice" label="Precio de Costo" type="number" step="0.01" value={formData.costPrice} onChange={handleChange} />
                <Input name="profitMargin" label="Porcentaje de Ganancia (%)" type="number" step="0.01" value={profitMargin} onChange={handleMarginChange} />
                <Input name="sellingPrice" label="Precio de Venta" type="number" step="0.01" value={formData.sellingPrice} onChange={handleChange} required />
            </div>
             <Input name="image" label="URL de la Imagen" value={formData.image} onChange={handleChange} />
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{product ? 'Guardar Cambios' : 'Crear Producto'}</Button>
            </div>
        </form>
    );
};

const ProductDetailModal: React.FC<{
    product: Product | null;
    onClose: () => void;
    onEdit: (product: Product) => void;
}> = ({ product, onClose, onEdit }) => {
    const { suppliers, stockHistory } = useApp();
    const [activeTab, setActiveTab] = useState('details');

    if (!product) return null;

    const supplierName = suppliers.find(s => s.id === product.supplierId)?.name || 'N/A';
    const productHistory = stockHistory.filter(h => h.productId === product.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
    const typeLabels: { [key in StockHistory['type']]: string } = {
        sale: 'Venta',
        purchase: 'Compra',
        manual_adjustment: 'Ajuste Manual',
        initial_stock: 'Stock Inicial',
        sale_cancellation: 'Venta Anulada',
    };
    
    const typeStyles: { [key in StockHistory['type']]: string } = {
        sale: 'bg-red-100 text-red-800',
        purchase: 'bg-green-100 text-green-800',
        manual_adjustment: 'bg-yellow-100 text-yellow-800',
        initial_stock: 'bg-blue-100 text-blue-800',
        sale_cancellation: 'bg-purple-100 text-purple-800',
    };

    const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
        <button
            onClick={onClick}
            className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                active
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <Modal isOpen={!!product} onClose={onClose} title="Detalles del Producto">
            <div className="border-b border-gray-200 -mt-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
                        Detalles
                    </TabButton>
                    <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                        Historial de Stock
                    </TabButton>
                </nav>
            </div>
            
            <div className="mt-4">
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <img 
                                src={product.image || 'https://via.placeholder.com/150'} 
                                alt={product.name} 
                                className="w-full sm:w-40 h-40 rounded-lg object-cover flex-shrink-0" 
                            />
                            <div className="flex-1 space-y-2">
                                <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
                                <p className="text-gray-600">{product.description || 'Sin descripción.'}</p>
                            </div>
                        </div>
                        <div className="border-t my-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div><strong className="font-medium text-gray-500">SKU:</strong> {product.sku || 'N/A'}</div>
                            <div><strong className="font-medium text-gray-500">Categoría:</strong> {product.category || 'N/A'}</div>
                            <div><strong className="font-medium text-gray-500">Proveedor:</strong> {supplierName}</div>
                            <div><strong className="font-medium text-gray-500">Stock Actual:</strong> <span className={product.stock <= product.lowStockThreshold ? 'font-bold text-red-600' : 'text-gray-800'}>{product.stock}</span></div>
                            <div><strong className="font-medium text-gray-500">Umbral Stock Bajo:</strong> {product.lowStockThreshold}</div>
                            <div><strong className="font-medium text-gray-500">Precio de Costo:</strong> ${product.costPrice.toFixed(2)}</div>
                            <div className="col-span-full"><strong className="font-medium text-gray-500">Precio de Venta:</strong> <span className="font-bold text-lg text-indigo-600">${product.sellingPrice.toFixed(2)}</span></div>
                        </div>
                    </div>
                )}
                {activeTab === 'history' && (
                    <div>
                        <div className="max-h-96 overflow-y-auto">
                            {productHistory.length > 0 ? (
                                <Table headers={['Fecha', 'Tipo', 'Cambio', 'Stock Resultante', 'Notas']}>
                                    {productHistory.map(entry => (
                                        <tr key={entry.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(entry.date).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeStyles[entry.type]}`}>
                                                    {typeLabels[entry.type]}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${entry.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.newStockLevel}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </Table>
                            ) : (
                                <p className="text-center text-gray-500 py-4">No hay historial de stock para este producto.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                 <Button type="button" variant="secondary" onClick={onClose}>Cerrar</Button>
                 <Button type="button" onClick={() => { onEdit(product); onClose(); }}>Editar Producto</Button>
            </div>
        </Modal>
    );
};


const ProductsView: React.FC = () => {
    const { products, suppliers, addProduct, updateProduct, deleteProduct, categories } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importPreview, setImportPreview] = useState<{ valid: Omit<Product, 'id'>[], invalid: { row: any, error: string }[] }>({ valid: [], invalid: [] });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return products;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowercasedTerm) ||
            (product.description && product.description.toLowerCase().includes(lowercasedTerm))
        );
    }, [products, searchTerm]);

    const handleSave = (data: Omit<Product, 'id'> | Product) => {
        if ('id' in data) {
            updateProduct(data);
        } else {
            addProduct(data);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleView = (product: Product) => {
        setViewingProduct(product);
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [{
            name: "Producto de Ejemplo",
            sku: "SKU-EJEMPLO-001",
            category: "Categoría de Ejemplo",
            stock: 100,
            lowStockThreshold: 10,
            costPrice: 50.00,
            sellingPrice: 99.99,
            image: "https://example.com/image.jpg",
            description: "Esta es una descripción de ejemplo."
        }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla de Productos");
        XLSX.writeFile(workbook, "plantilla_productos_mrk.xlsx");
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleExportAll = () => {
        const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
        const dataToExport = products.map(p => ({
            'Nombre': p.name,
            'SKU': p.sku,
            'Categoría (Rubro)': p.category,
            'Proveedor': supplierMap.get(p.supplierId) || 'N/A',
            'Stock Actual': p.stock,
            'Umbral Stock Bajo': p.lowStockThreshold,
            'Precio de Costo': p.costPrice,
            'Precio de Venta': p.sellingPrice,
            'URL de Imagen': p.image,
            'Descripción': p.description,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario de Productos");
        XLSX.writeFile(workbook, `inventario_completo_mrk_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet) as any[];

            const validRows: Omit<Product, 'id'>[] = [];
            const invalidRows: { row: any, error: string }[] = [];
            const existingSkus = new Set(products.map(p => p.sku).filter(Boolean));
            const validCategories = new Set(categories.map(c => c.name));

            json.forEach(row => {
                if (!row.name || !row.sellingPrice) {
                    invalidRows.push({ row, error: "Faltan campos obligatorios (nombre, precio de venta)." });
                } else if (row.sku && existingSkus.has(row.sku)) {
                    invalidRows.push({ row, error: `SKU duplicado: ${row.sku}` });
                } else {
                    const category = String(row.category || '');
                    if (category && !validCategories.has(category)) {
                        if (window.confirm(`El rubro "${category}" no existe. ¿Desea crearlo?`)) {
                           // For simplicity, we won't create it here, but we will allow the product to be imported.
                           // A more complex implementation could add it.
                        }
                    }

                    validRows.push({
                        name: String(row.name),
                        sku: String(row.sku || ''),
                        category,
                        supplierId: suppliers[0]?.id || '', // Default to first supplier
                        stock: Number(row.stock || 0),
                        lowStockThreshold: Number(row.lowStockThreshold || 10),
                        costPrice: Number(row.costPrice || 0),
                        sellingPrice: Number(row.sellingPrice),
                        image: String(row.image || ''),
                        description: String(row.description || '')
                    });
                }
            });
            setImportPreview({ valid: validRows, invalid: invalidRows });
            setIsImportModalOpen(true);
        };
        reader.readAsArrayBuffer(file);
        if(event.target) event.target.value = ''; // Reset file input
    };
    
    const handleConfirmImport = () => {
        importPreview.valid.forEach(product => {
            addProduct(product);
        });
        setIsImportModalOpen(false);
        setImportPreview({ valid: [], invalid: [] });
        alert(`${importPreview.valid.length} productos importados con éxito.`);
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
                 <div className="flex space-x-2">
                    <Button onClick={handleExportAll} variant="secondary">Exportar Todo (XLS)</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
                    <Button onClick={handleImportClick} variant="secondary">Importar desde XLS</Button>
                    <Button onClick={handleDownloadTemplate} variant="secondary">Descargar Plantilla</Button>
                    <Button onClick={handleAddNew}>
                        <PlusIcon className="h-5 w-5 mr-2" /> Añadir Producto
                    </Button>
                </div>
            </div>

            <div className="flex-shrink-0">
                <Input
                    type="search"
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    containerClassName="w-full md:w-2/5"
                />
            </div>
            
            <div className="flex-grow overflow-hidden">
                <div className="bg-white shadow-md rounded-lg h-full flex flex-col">
                    <div className="flex-grow overflow-y-auto" style={{ overflowX: 'scroll' }}>
                        <Table headers={['Producto', 'Precio Venta', 'Acciones']}>
                            {filteredProducts.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={p.image || 'https://picsum.photos/40/40'} alt={p.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{p.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${p.sellingPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleView(p)}>Ver</Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>Editar</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setProductToDelete(p)}>
                                            <TrashIcon className="h-5 w-5 text-red-500" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                         {filteredProducts.length === 0 && (
                            <div className="text-center p-16 text-gray-500">
                                <p className="text-lg font-semibold">{searchTerm ? 'No se encontraron productos' : 'Aún no hay productos'}</p>
                                <p className="mt-1 text-sm">{searchTerm ? 'Intenta con otra búsqueda.' : 'Puedes empezar añadiendo un nuevo producto o importando desde un archivo XLS.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}>
                <ProductForm
                    product={editingProduct}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
            
            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Previsualización de Importación">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-green-700 mb-2">
                            {importPreview.valid.length} Registros Válidos para Importar
                        </h3>
                        {importPreview.valid.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 text-sm">
                                <ul>
                                    {importPreview.valid.map((p, i) => <li key={i}>{p.name} (SKU: {p.sku || 'N/A'})</li>)}
                                </ul>
                            </div>
                        ) : <p className="text-sm text-gray-500">No hay registros válidos en el archivo.</p>}
                    </div>
                     <div>
                        <h3 className="font-semibold text-red-700 mb-2">
                             {importPreview.invalid.length} Registros con Errores (No se importarán)
                        </h3>
                        {importPreview.invalid.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 text-sm">
                                <ul>
                                    {importPreview.invalid.map((item, i) => <li key={i}>{item.row.name || 'Fila sin nombre'} - <span className="text-red-600">{item.error}</span></li>)}
                                </ul>
                            </div>
                        ) : <p className="text-sm text-gray-500">¡Genial! No se encontraron errores.</p>}
                    </div>
                </div>
                 <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmImport} disabled={importPreview.valid.length === 0}>
                        Confirmar e Importar {importPreview.valid.length} Productos
                    </Button>
                </div>
            </Modal>

            <Modal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                title="Confirmar Eliminación"
            >
                <p>
                    ¿Estás seguro de que quieres eliminar el producto <strong>"{productToDelete?.name}"</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => setProductToDelete(null)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>
                        Eliminar
                    </Button>
                </div>
            </Modal>

            <ProductDetailModal
                product={viewingProduct}
                onClose={() => setViewingProduct(null)}
                onEdit={handleEdit}
            />
        </div>
    );
};

export default ProductsView;