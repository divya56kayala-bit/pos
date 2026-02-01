
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface SubCategory {
    name: string;
    description?: string;
}

interface Category {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    subCategories?: SubCategory[];
}

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // For Sub-Category management in Modal
    const [tempSubCatName, setTempSubCatName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (err) {
            console.error(err);
            alert('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (category?: Category) => {
        setEditingCategory(category ? { ...category, subCategories: category.subCategories || [] } : {
            name: '',
            description: '',
            subCategories: []
        });
        setTempSubCatName('');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        try {
            if (editingCategory._id || editingCategory.id) {
                await api.updateCategory(editingCategory._id || editingCategory.id!, editingCategory);
            } else {
                await api.createCategory(editingCategory);
            }
            setIsModalOpen(false);
            loadCategories();
        } catch (err: any) {
            alert('Failed to save category: ' + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.deleteCategory(id);
            loadCategories();
        } catch (err: any) {
            alert('Failed to delete category: ' + err.message);
        }
    };

    const addSubCategory = () => {
        if (!tempSubCatName.trim()) return;
        if (editingCategory?.subCategories?.some(s => s.name === tempSubCatName)) {
            alert('Sub-category already exists');
            return;
        }
        setEditingCategory(prev => ({
            ...prev!,
            subCategories: [...(prev?.subCategories || []), { name: tempSubCatName }]
        }));
        setTempSubCatName('');
    };

    const removeSubCategory = (idx: number) => {
        setEditingCategory(prev => ({
            ...prev!,
            subCategories: prev?.subCategories?.filter((_, i) => i !== idx)
        }));
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
                    <p className="text-sm text-gray-500">Manage product categories and sub-categories</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-500 transition-all flex items-center gap-2"
                >
                    <span>+</span> Add Category
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(cat => (
                        <div key={cat._id || cat.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-gray-800">{cat.name}</h3>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(cat)} className="text-blue-600 font-bold text-sm">Edit</button>
                                    <button onClick={() => handleDelete(cat._id || cat.id!)} className="text-red-500 font-bold text-sm">Delete</button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{cat.description || 'No description'}</p>

                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Sub-Categories</p>
                                <div className="flex flex-wrap gap-2">
                                    {cat.subCategories && cat.subCategories.length > 0 ? (
                                        cat.subCategories.map((sub, i) => (
                                            <span key={i} className="bg-white border border-gray-200 px-2 py-1 rounded-md text-xs text-gray-700 font-medium">
                                                {sub.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">None</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white sticky top-0 z-10">
                            <h3 className="text-xl font-bold">{editingCategory?._id ? 'Edit Category' : 'New Category'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Category Name</label>
                                <input
                                    required
                                    value={editingCategory?.name || ''}
                                    onChange={e => setEditingCategory({ ...editingCategory!, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                                <input
                                    value={editingCategory?.description || ''}
                                    onChange={e => setEditingCategory({ ...editingCategory!, description: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Sub Categories</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        placeholder="Enter sub-category"
                                        value={tempSubCatName}
                                        onChange={e => setTempSubCatName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSubCategory();
                                            }
                                        }}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSubCategory}
                                        className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-slate-300"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {editingCategory?.subCategories?.map((sub, i) => (
                                        <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSubCategory(i)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full w-6 h-6 flex items-center justify-center"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    {(!editingCategory?.subCategories || editingCategory.subCategories.length === 0) && (
                                        <p className="text-xs text-slate-400 text-center py-2">No sub-categories added</p>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors mt-4">
                                Save Category
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
