import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  ShoppingBag,
  MapPin,
  Tag,
  AlertCircle
} from 'lucide-react';

const productFormSchema = z.object({
  productName: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  unitPrice: z.number().min(0, 'Price cannot be negative'),
  currentStock: z.number().int().min(0, 'Current stock cannot be negative').optional(),
  minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative').optional(),
  warehouseLocation: z.string().optional(),
});

type ProductFormInput = z.infer<typeof productFormSchema>;

export const Products: React.FC = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const isEditable = role === 'ADMIN' || role === 'WAREHOUSE';
  const isAdmin = role === 'ADMIN';

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search / Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 8 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockFilter) params.lowStock = 'true';

      const response = await api.get('/products', { params });
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch product catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories list', err);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, categoryFilter, lowStockFilter, page]);

  useEffect(() => {
    fetchCategories();
  }, [isModalOpen]);

  const handleAddOpen = () => {
    setEditingProduct(null);
    reset({
      productName: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 5,
      warehouseLocation: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (p: any) => {
    setEditingProduct(p);
    setValue('productName', p.productName);
    setValue('sku', p.sku);
    setValue('category', p.category);
    setValue('unitPrice', p.unitPrice);
    setValue('currentStock', p.currentStock);
    setValue('minimumStock', p.minimumStock);
    setValue('warehouseLocation', p.warehouseLocation || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: ProductFormInput) => {
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingProduct) {
        const response = await api.put(`/products/${editingProduct.id}`, data);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchProducts();
        }
      } else {
        const response = await api.post('/products', data);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Operation failed. Check input formatting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete product '${name}'? This cannot be undone.`)) {
      return;
    }
    try {
      const response = await api.delete(`/products/${id}`);
      if (response.data.success) {
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot delete product with transactional history.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Products Catalog</h3>
          <p className="text-xs text-slate-400">Manage item pricing details, SKUs, and stock tracking parameters</p>
        </div>
        {isEditable && (
          <button
            onClick={handleAddOpen}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-600 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock checkbox wrapper */}
        <div className="flex items-center pl-2">
          <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => { setLowStockFilter(e.target.checked); setPage(1); }}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
            />
            Show Low Stock Warnings
          </label>
        </div>
      </div>

      {/* Grid List */}
      {loading && products.length === 0 ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Products Registered</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search criteria or add new items to the catalog.
          </p>
          {isEditable && (
            <button
              onClick={handleAddOpen}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
            >
              <Plus className="h-4.5 w-4.5" /> Add Product
            </button>
          )}
        </div>
      ) : (
        /* Data grid */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">SKU / Code</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Unit Price</th>
                  <th className="px-6 py-4 text-center">Available Stock</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-900 leading-tight">{p.productName}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{p.sku}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          <Tag className="h-3 w-3" />
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 font-bold">
                        ₹{p.unitPrice.toLocaleString([], { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            p.currentStock === 0
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.currentStock} Units
                          </span>
                          {isLow && (
                            <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" /> Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {p.warehouseLocation ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {p.warehouseLocation}
                          </div>
                        ) : (
                          <span className="text-slate-300">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {isEditable && (
                            <button
                              onClick={() => handleEditOpen(p)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p.id, p.productName)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <span className="font-bold text-slate-800">{products.length}</span> of <span className="font-bold text-slate-800">{total}</span> items</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700"
              >
                Previous
              </button>
              <span className="px-3 font-semibold text-slate-800">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Form drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between smooth-transition">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingProduct ? 'Modify Product Specifications' : 'Add New Product to Catalog'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800 mb-6">
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              {/* Form Input fields */}
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                {/* Product name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    {...register('productName')}
                    className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                      errors.productName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.productName && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.productName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* SKU */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      placeholder="E.g. CAB-CAT6-300"
                      disabled={!!editingProduct}
                      {...register('sku')}
                      className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all uppercase placeholder:normal-case disabled:bg-slate-50 disabled:text-slate-400 ${
                        errors.sku ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.sku && (
                      <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.sku.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      placeholder="E.g. Cables, Networking"
                      {...register('category')}
                      className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                        errors.category ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.category && (
                      <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Unit price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Unit Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('unitPrice', { valueAsNumber: true })}
                      className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                        errors.unitPrice ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.unitPrice && (
                      <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.unitPrice.message}</p>
                    )}
                  </div>

                  {/* Minimum stock */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Min Stock Warning level
                    </label>
                    <input
                      type="number"
                      {...register('minimumStock', { valueAsNumber: true })}
                      className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                        errors.minimumStock ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.minimumStock && (
                      <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.minimumStock.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Opening stock (hides during editing) */}
                  {!editingProduct && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Opening stock Units
                      </label>
                      <input
                        type="number"
                        {...register('currentStock', { valueAsNumber: true })}
                        className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                          errors.currentStock ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                      {errors.currentStock && (
                        <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.currentStock.message}</p>
                      )}
                    </div>
                  )}

                  {/* Location */}
                  <div className={editingProduct ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Warehouse Location / Shelf
                    </label>
                    <input
                      type="text"
                      placeholder="E.g. Shelf A4, Cabinet B2"
                      {...register('warehouseLocation')}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Submit button bar */}
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingProduct ? 'Update Product' : 'Register Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
