import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Table from '../ui/Table';
import { PlusIcon, TrashIcon } from '../ui/Icon';
import { Category } from '../../types';

const CategoryForm: React.FC<{
    category?: Category | null;
    onSave: (category: Omit<Category, 'id'> | Category) => void;
    onClose: () => void;
}> = ({ category, onSave, onClose }) => {
    const [name, setName] = useState(category?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (category) {
            onSave({ ...category, name });
        } else {
            onSave({ name });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" label="Nombre del Rubro" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{category ? 'Guardar Cambios' : 'Crear Rubro'}</Button>
            </div>
        </form>
    );
};


const CategoriesView: React.FC = () => {
    const { categories, addCategory, updateCategory, deleteCategory } = useApp();
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleSaveCategory = (data: Omit<Category, 'id'> | Category) => {
        if ('id' in data) {
            updateCategory(data);
        } else {
            addCategory(data);
        }
    };
    
    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryModalOpen(true);
    };

    const handleAddNewCategory = () => {
        setEditingCategory(null);
        setCategoryModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Rubros</h1>
                <Button onClick={handleAddNewCategory}>
                    <PlusIcon className="h-5 w-5 mr-2" /> Añadir Rubro
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b">
                    <p className="text-gray-600">
                        Añade, edita o elimina los rubros de tus productos. Al editar o eliminar un rubro, todos los productos asociados se actualizarán automáticamente.
                    </p>
                </div>
                <Table headers={['Nombre del Rubro', 'Acciones']}>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleEditCategory(cat)}>Editar</Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)}>
                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </Table>
                {categories.length === 0 && <p className="text-center text-gray-500 py-4">No hay rubros definidos.</p>}
            </Card>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} title={editingCategory ? 'Editar Rubro' : 'Añadir Nuevo Rubro'}>
                <CategoryForm
                    category={editingCategory}
                    onSave={handleSaveCategory}
                    onClose={() => setCategoryModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default CategoriesView;