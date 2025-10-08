// Fix: Create the SettingsView component.
import React, { useState, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

const SettingsView: React.FC = () => {
    const { 
        products, suppliers, sales, purchases, onlineOrders,
        setProducts, setSuppliers, setSales, setPurchases, setOnlineOrders, setCart,
        categories, setCategories,
        clients, setClients,
        updatePassword
    } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    
    const [importPreviewData, setImportPreviewData] = useState<any>(null);
    const [isImportConfirmModalOpen, setImportConfirmModalOpen] = useState(false);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordChangeMessage, setPasswordChangeMessage] = useState({ type: '', text: '' });


    const handleExport = () => {
        const dataToExport = {
            products,
            suppliers,
            sales,
            purchases,
            onlineOrders,
            categories,
            clients, // Also export clients
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(dataToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `mrk-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                const data = JSON.parse(text as string);
                setImportPreviewData(data);
                setImportConfirmModalOpen(true);
            } catch (error) {
                alert("Error al leer el archivo. Asegúrate de que es un archivo de copia de seguridad válido.");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
        if(event.target) event.target.value = ''; // Reset file input
    };
    
    const handleConfirmImport = async () => {
        if (!importPreviewData) return;

        await setProducts(importPreviewData.products || []);
        await setSuppliers(importPreviewData.suppliers || []);
        await setSales(importPreviewData.sales || []);
        await setPurchases(importPreviewData.purchases || []);
        await setOnlineOrders(importPreviewData.onlineOrders || []);
        await setCategories(importPreviewData.categories || []);
        await setClients(importPreviewData.clients || []);
        setCart([]);
        
        setImportConfirmModalOpen(false);
        setImportPreviewData(null);
        alert("¡Tarea completada! Los datos han sido restaurados desde la copia de seguridad.");
    };
    
    const openConfirmModal = () => {
        setAdminPassword('');
        setPasswordError('');
        setConfirmModalOpen(true);
    };

    const handleClearData = async () => {
        // The password for clearing data should also be dynamic
        const success = updatePassword(adminPassword, adminPassword);
        if (!success) {
            setPasswordError('Contraseña incorrecta.');
            return;
        }
        
        await setProducts([]);
        await setSuppliers([]);
        await setSales([]);
        await setPurchases([]);
        await setOnlineOrders([]);
        await setCategories([]);
        await setClients([]);
        setCart([]);
        
        setConfirmModalOpen(false);
        alert("Todos los datos han sido borrados.");
    };
    
    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordChangeMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setPasswordChangeMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
            return;
        }
        if (newPassword.length < 4) {
             setPasswordChangeMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 4 caracteres.' });
            return;
        }

        const success = updatePassword(currentPassword, newPassword);

        if (success) {
            setPasswordChangeMessage({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordChangeMessage({ type: 'error', text: 'La contraseña actual es incorrecta.' });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>

            <Card title="Cambiar Contraseña">
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                        label="Contraseña Actual"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Nueva Contraseña"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Confirmar Nueva Contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {passwordChangeMessage.text && (
                        <p className={`text-sm ${passwordChangeMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordChangeMessage.text}
                        </p>
                    )}
                    <div className="flex justify-end">
                        <Button type="submit">Actualizar Contraseña</Button>
                    </div>
                </form>
            </Card>

            <Card title="Gestión de Datos">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Gestiona los datos de tu inventario. Puedes exportar tus datos actuales como una copia de seguridad o importar datos para restaurar el sistema.
                    </p>
                    <div className="flex space-x-4">
                        <Button onClick={handleExport} variant="secondary">Descargar Copia de Seguridad</Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
                        <Button onClick={handleImportClick} variant="secondary">Restaurar desde Copia</Button>
                    </div>
                </div>
            </Card>

            <Card title="Zona de Peligro">
                 <div className="space-y-4 p-4 border border-red-300 rounded-lg bg-red-50">
                    <h3 className="font-semibold text-red-800">Borrar Todos los Datos</h3>
                    <p className="text-red-700">
                        Esta acción borrará permanentemente todos los productos, proveedores, clientes, ventas, compras y pedidos.
                        Esta acción no se puede deshacer.
                    </p>
                    <Button onClick={openConfirmModal} variant="danger">
                        Borrar Todos los Datos
                    </Button>
                </div>
            </Card>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirmación Requerida">
                <div className="space-y-4">
                    <p>Esta acción es irreversible. Para confirmar que deseas borrar todos los datos de la aplicación, por favor ingresa tu contraseña de administrador.</p>
                    <Input
                        label="Contraseña de Administrador"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                </div>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={handleClearData}>Confirmar y Borrar Datos</Button>
                </div>
            </Modal>
            
            <Modal isOpen={isImportConfirmModalOpen} onClose={() => setImportConfirmModalOpen(false)} title="Confirmar Importación de Datos">
                {importPreviewData && (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                           <p className="font-semibold text-red-700">
                                ¡Advertencia! Esta acción reemplazará TODOS los datos actuales en la aplicación con el contenido del archivo de respaldo.
                           </p>
                        </div>
                        <div>
                            <h3 className="font-bold mb-2">Resumen de datos a importar:</h3>
                            <ul className="list-disc list-inside bg-gray-100 p-3 rounded-md text-sm">
                                <li><strong>Productos:</strong> {importPreviewData.products?.length || 0}</li>
                                <li><strong>Proveedores:</strong> {importPreviewData.suppliers?.length || 0}</li>
                                <li><strong>Clientes:</strong> {importPreviewData.clients?.length || 0}</li>
                                <li><strong>Rubros:</strong> {importPreviewData.categories?.length || 0}</li>
                                <li><strong>Ventas:</strong> {importPreviewData.sales?.length || 0}</li>
                                <li><strong>Compras:</strong> {importPreviewData.purchases?.length || 0}</li>
                                <li><strong>Pedidos Online:</strong> {importPreviewData.onlineOrders?.length || 0}</li>
                            </ul>
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={() => { setImportConfirmModalOpen(false); setImportPreviewData(null); }}>Cancelar</Button>
                    <Button variant="danger" onClick={handleConfirmImport}>Sí, Sobrescribir y Restaurar</Button>
                </div>
            </Modal>
        </div>
    );
};

export default SettingsView;