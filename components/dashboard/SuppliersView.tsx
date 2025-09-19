import React, { useState, ChangeEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { PlusIcon, TrashIcon } from '../ui/Icon';

const SupplierForm: React.FC<{
    supplier?: Supplier | null;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void;
    onClose: () => void;
}> = ({ supplier, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        contactName: supplier?.contactName || '',
        phone: supplier?.phone || '',
        email: supplier?.email || '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (supplier) {
            onSave({ ...supplier, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" label="Nombre del Proveedor" value={formData.name} onChange={handleChange} required />
                <Input name="contactName" label="Nombre de Contacto" value={formData.contactName} onChange={handleChange} />
                <Input name="phone" label="Teléfono" type="tel" value={formData.phone} onChange={handleChange} />
                <Input name="email" label="Email" type="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{supplier ? 'Guardar Cambios' : 'Crear Proveedor'}</Button>
            </div>
        </form>
    );
};

const SuppliersView: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const handleSave = (data: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in data) {
            updateSupplier(data);
        } else {
            addSupplier(data);
        }
    };
    
    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h1>
                <Button onClick={handleAddNew}>
                    <PlusIcon className="h-5 w-5 mr-2" /> Añadir Proveedor
                </Button>
            </div>
            <Card>
                <Table headers={['Nombre Proveedor', 'Contacto', 'Teléfono', 'Email', 'Acciones']}>
                    {suppliers.map(s => (
                        <tr key={s.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.contactName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>Editar</Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteSupplier(s.id)}>
                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}>
                <SupplierForm
                    supplier={editingSupplier}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default SuppliersView;
