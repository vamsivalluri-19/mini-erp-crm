import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface ProductItem {
  id: string;
  productName: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface SelectedItem {
  productId: string;
  quantity: number;
  productName: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

export const ChallanForm: React.FC = () => {
  const navigate = useNavigate();

  // Database list states
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form selections
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Item build temporary state
  const [tempProductId, setTempProductId] = useState('');
  const [tempQty, setTempQty] = useState<number>(1);

  // Action status
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmStatusType, setConfirmStatusType] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers', { params: { limit: 100 } }),
          api.get('/products', { params: { limit: 100 } }),
        ]);

        if (custRes.data.success) setCustomers(custRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load customers and products catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    setFormError(null);
    if (!tempProductId) {
      setFormError('Please select a product from the options.');
      return;
    }

    // Find product details
    const prod = products.find((p) => p.id === tempProductId);
    if (!prod) return;

    if (tempQty <= 0) {
      setFormError('Quantity must be positive.');
      return;
    }

    // Duplicates check (though we disable selected in options, double check)
    const existing = selectedItems.find((item) => item.productId === tempProductId);
    if (existing) {
      setFormError('Product already added to the challan.');
      return;
    }

    setSelectedItems([
      ...selectedItems,
      {
        productId: prod.id,
        productName: prod.productName,
        sku: prod.sku,
        unitPrice: prod.unitPrice,
        currentStock: prod.currentStock,
        quantity: tempQty,
      },
    ]);

    // Reset item picker
    setTempProductId('');
    setTempQty(1);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const updated = [...selectedItems];
    updated[index].quantity = newQty;
    setSelectedItems(updated);
  };

  // Calculations
  const totalQuantity = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmount = selectedItems.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);

  const triggerSubmit = (status: 'DRAFT' | 'CONFIRMED') => {
    setFormError(null);
    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (selectedItems.length === 0) {
      setFormError('Please add at least 1 product to the challan.');
      return;
    }

    // Verify stock availability beforehand if submitting as CONFIRMED
    if (status === 'CONFIRMED') {
      const insufficient = selectedItems.find((item) => item.currentStock < item.quantity);
      if (insufficient) {
        setFormError(
          `Insufficient stock for '${insufficient.productName}'. Available: ${insufficient.currentStock}, Requested: ${insufficient.quantity}`
        );
        return;
      }
    }

    setConfirmStatusType(status);
    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setFormError(null);

    const payload = {
      customerId: selectedCustomerId,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      status: confirmStatusType,
    };

    try {
      const response = await api.post('/challans', payload);
      if (response.data.success) {
        navigate(`/challans/${response.data.data.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to submit sales challan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  // Get list of products not yet selected
  const availableProducts = products.filter(
    (p) => !selectedItems.some((selected) => selected.productId === p.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/challans')}
          className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h3 className="text-xl font-bold text-slate-800">New Sales Challan</h3>
          <p className="text-xs text-slate-400">Generate a new delivery note receipt with stock snapshot reserves</p>
        </div>
      </div>

      {formError && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800">
          <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">{formError}</p>
        </div>
      )}

      {/* Main Grid: Info capsule on left, items editor on right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 text-xs">
        {/* Left Column: Customer details */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5 h-fit">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Client Details
          </h4>

          {/* Customer selection */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wide">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">— Select Customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} ({c.businessName})
                </option>
              ))}
            </select>
          </div>

          {selectedCustomerId && (
            <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-semibold text-slate-700 animate-fadeIn">
              {(() => {
                const cust = customers.find((c) => c.id === selectedCustomerId);
                if (!cust) return null;
                return (
                  <>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Business Profile</span>
                      <span className="text-slate-900 font-extrabold">{cust.businessName}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Mobile</span>
                      <span>{cust.mobile}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">GST Number</span>
                      <span className="uppercase font-mono text-slate-900">{cust.gstNumber || 'No GST Registered'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Address</span>
                      <span className="font-normal text-slate-600 leading-relaxed">{cust.address || '—'}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Right Columns: Items registry */}
        <div className="space-y-6 lg:col-span-2">
          {/* Item Builder Box */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2.5">
              Select Products
            </h4>

            {/* Picker builder bar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  Product Name / SKU
                </label>
                <select
                  value={tempProductId}
                  onChange={(e) => setTempProductId(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 bg-white font-semibold text-slate-700"
                >
                  <option value="">— Choose Product —</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.sku}) | Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  Quantity Units
                </label>
                <input
                  type="number"
                  min={1}
                  value={tempQty}
                  onChange={(e) => setTempQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="block w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            {/* Selected Items Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="px-4 py-3">Product Spec</th>
                    <th className="px-4 py-3 font-mono text-[10px] text-slate-400">SKU</th>
                    <th className="px-4 py-3 text-center">In Stock</th>
                    <th className="px-4 py-3 text-center" style={{ width: '90px' }}>Quantity</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {selectedItems.map((item, index) => {
                    const isExceeded = item.quantity > item.currentStock;
                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-900 leading-snug">{item.productName}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{item.sku}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.currentStock === 0
                              ? 'bg-red-100 text-red-800'
                              : item.currentStock <= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.currentStock} Units
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(index, Math.max(1, parseInt(e.target.value) || 1))}
                              className={`block w-full rounded-lg border py-1 px-2 text-center text-xs outline-none ${
                                isExceeded ? 'border-red-300 focus:border-red-500 bg-red-50 text-red-800 font-bold' : 'border-slate-200 focus:border-indigo-500'
                              }`}
                            />
                            {isExceeded && (
                              <span className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-0.5">
                                <AlertTriangle className="h-3.5 w-3.5" /> Overdraft
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          ₹{(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {selectedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                        No products added to this challan. Add items using the selection form.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations and Actions Footer */}
            {selectedItems.length > 0 && (
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5 text-slate-500 font-semibold">
                  <p>Total Items Count: <span className="text-slate-900 font-extrabold">{totalQuantity} Units</span></p>
                  <p className="text-sm">Total Valuation: <span className="text-slate-950 font-extrabold text-base">₹{totalAmount.toLocaleString([], { minimumFractionDigits: 2 })}</span></p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/challans')}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => triggerSubmit('DRAFT')}
                    disabled={submitting}
                    className="rounded-xl border border-indigo-200 text-indigo-600 px-4 py-2.5 font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => triggerSubmit('CONFIRMED')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    Confirm Challan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 relative animate-zoomIn">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  {confirmStatusType === 'CONFIRMED' ? 'Confirm Sales Challan?' : 'Save Challan Draft?'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {confirmStatusType === 'CONFIRMED'
                    ? 'This action will instantly deduct product stock units from the warehouse. Are you sure you want to proceed?'
                    : 'This action saves the challan list as a draft. Stock inventory remains untouched until confirmed. Proceed?'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 text-xs">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/2 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSubmit}
                  className="w-1/2 rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-md hover:bg-indigo-700"
                >
                  Yes, Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
