import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  MapPin,
  AlertCircle
} from 'lucide-react';
// No unused Link import

const adjustmentFormSchema = z.object({
  productId: z.string().uuid('Select a product'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Enter adjustment reason details'),
});

type AdjustmentFormInput = z.infer<typeof adjustmentFormSchema>;

export const Inventory: React.FC = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const isWarehouse = role === 'ADMIN' || role === 'WAREHOUSE';

  // Stats
  const [summary, setSummary] = useState<any>({
    totalProducts: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  // Table Data
  const [items, setItems] = useState<any[]>([]);
  const [productListAll, setProductListAll] = useState<any[]>([]); // for dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormInput>({
    resolver: zodResolver(adjustmentFormSchema),
  });

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 8 };
      if (search) params.search = search;
      if (statusFilter === 'LOW') params.lowStock = 'true';
      // If filtering for out of stock, we can do client side or build parameter.
      // LowStock includes Out of Stock. Let's do client side if needed or standard.

      const response = await api.get('/products', { params });
      if (response.data.success) {
        let listData = response.data.data;
        if (statusFilter === 'OUT') {
          listData = listData.filter((p: any) => p.currentStock === 0);
        }
        setItems(listData);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }

      // Fetch dashboard metrics for the mini summary boxes
      const statsRes = await api.get('/dashboard/stats');
      if (statsRes.data.success) {
        const stats = statsRes.data.data;
        setSummary({
          totalProducts: stats.products.total,
          totalUnits: stats.products.totalStockUnits,
          lowStockCount: stats.products.lowStock,
          outOfStockCount: stats.products.outOfStock,
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch inventory registers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 100 } });
      if (response.data.success) {
        setProductListAll(response.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [search, statusFilter, page]);

  useEffect(() => {
    if (isModalOpen) {
      fetchDropdownProducts();
    }
  }, [isModalOpen]);

  const handleAdjustmentSubmit = async (data: AdjustmentFormInput) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await api.post('/stock/movements', data);
      if (response.data.success) {
        setIsModalOpen(false);
        reset();
        fetchInventoryData(); // Refresh list and stats
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Stock adjustment rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Inventory Status</h3>
          <p className="text-xs text-slate-400">View stocks volumes, warning levels, and post ledger adjustments</p>
        </div>
        {isWarehouse && (
          <button
            onClick={() => { reset({ quantity: 0, reason: '' }); setFormError(null); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Stock Adjustment
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Mini Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Box 1 */}
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-400">Products Catalog</span>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{summary.totalProducts}</p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Boxes className="h-5 w-5" />
          </div>
        </div>

        {/* Box 2 */}
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-400">Total Units Stocked</span>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{summary.totalUnits}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Box 3 */}
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-400">Low Stock Warning</span>
            <p className="text-xl font-extrabold text-amber-500 mt-1">{summary.lowStockCount}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Box 4 */}
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-400">Out of Stock Items</span>
            <p className="text-xl font-extrabold text-red-500 mt-1">{summary.outOfStockCount}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-red-600">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
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

        {/* Stock Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-600 font-medium"
          >
            <option value="">All Stock Levels</option>
            <option value="LOW">LOW STOCK WARNINGS</option>
            <option value="OUT">OUT OF STOCK</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Boxes className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Inventory Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            All database items are listed in the catalog, but none matched your query parameters.
          </p>
        </div>
      ) : (
        /* Data grid table */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-6 py-4">Product Specifications</th>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4 text-center">Available Stock</th>
                  <th className="px-6 py-4 text-center">Min Threshold</th>
                  <th className="px-6 py-4">Warehouse Location</th>
                  <th className="px-6 py-4 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((item) => {
                  const isOut = item.currentStock === 0;
                  const isLow = item.currentStock <= item.minimumStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-900 leading-tight">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{item.sku}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {item.currentStock.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {item.minimumStock}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.warehouseLocation ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {item.warehouseLocation}
                          </div>
                        ) : (
                          <span className="text-slate-300">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isOut
                            ? 'bg-red-100 text-red-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <span className="font-bold text-slate-800">{items.length}</span> of <span className="font-bold text-slate-800">{total}</span> items</span>
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

      {/* Manual Stock Adjustment Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative overflow-y-auto animate-zoomIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-indigo-500" />
                Post Stock Adjustment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 mb-5">
                <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-semibold">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(handleAdjustmentSubmit)} className="space-y-4 text-xs">
              {/* Product selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Product *
                </label>
                <select
                  {...register('productId')}
                  className={`block w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500 text-slate-700 font-semibold ${
                    errors.productId ? 'border-red-300' : 'border-slate-200'
                  }`}
                >
                  <option value="">— Select item from catalog —</option>
                  {productListAll.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.sku}) | Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.productId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Movement type */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Movement Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50 font-bold text-emerald-600">
                      <input
                        type="radio"
                        value="IN"
                        {...register('movementType')}
                        className="text-emerald-500 focus:ring-emerald-500 h-4 w-4 border-slate-300"
                      />
                      <ArrowUpRight className="h-4 w-4" /> Stock IN
                    </label>
                    <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50 font-bold text-red-600">
                      <input
                        type="radio"
                        value="OUT"
                        {...register('movementType')}
                        className="text-red-500 focus:ring-red-500 h-4 w-4 border-slate-300"
                      />
                      <ArrowDownLeft className="h-4 w-4" /> Stock OUT
                    </label>
                  </div>
                  {errors.movementType && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.movementType.message}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantity Units *
                  </label>
                  <input
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                    className={`block w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500 ${
                      errors.quantity ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.quantity.message}</p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adjustment Reason *
                </label>
                <input
                  type="text"
                  placeholder="E.g. Purchase Delivery Recieved, Stock Audit Correction"
                  {...register('reason')}
                  className={`block w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500 ${
                    errors.reason ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.reason && (
                  <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.reason.message}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
