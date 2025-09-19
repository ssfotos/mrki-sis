import React, { useState, ChangeEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { PlusIcon, TrashIcon } from '../ui/Icon';

const ClientForm: React.FC<{
    client?: Client | null;
    onSave: (client: Omit<Client, 'id'> | Client) => void;
    onClose: () => void;
}> = ({ client, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: client?.name || '',
        address: client?.address || '',
        phone: client?.phone || '',
        email: client?.email || '',
        dni: client?.dni || '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (client) {
            onSave({ ...client, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" label="Nombre Completo" value={formData.name} onChange={handleChange} required />
                <Input name="dni" label="DNI / CUIT" value={formData.dni} onChange={handleChange} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="phone" label="Teléfono" type="tel" value={formData.phone} onChange={handleChange} required />
                <Input name="email" label="Email" type="email" value={formData.email} onChange={handleChange} />
            </div>
             <Input name="address" label="Dirección" value={formData.address} onChange={handleChange} />

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{client ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
            </div>
        </form>
    );
};

const ClientsView: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const handleSave = (data: Omit<Client, 'id'> | Client) => {
        if ('id' in data) {
            updateClient(data);
        } else {
            addClient(data);
        }
    };
    
    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
                <Button onClick={handleAddNew}>
                    <PlusIcon className="h-5 w-5 mr-2" /> Añadir Cliente
                </Button>
            </div>
            <Card>
                <Table headers={['Nombre', 'Teléfono', 'Email', 'DNI / CUIT', 'Acciones']}>
                    {clients.map(c => (
                        <tr key={c.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.dni}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>Editar</Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteClient(c.id)}>
                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </Table>
                 {clients.length === 0 && <p className="text-center text-gray-500 py-4">No hay clientes registrados.</p>}
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}>
                <ClientForm
                    client={editingClient}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ClientsView;