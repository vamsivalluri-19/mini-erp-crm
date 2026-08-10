import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  User,
  Printer,
  CheckCircle,
  AlertTriangle,
  Loader2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export const ChallanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const isSales = role === 'ADMIN' || role === 'SALES';

  const [challan, setChallan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChallanDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/challans/${id}`);
      if (response.data.success) {
        setCustomerInfo(response.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load challan invoice details.');
    } finally {
      setLoading(false);
    }
  };

  // Helper setter
  const setCustomerInfo = (data: any) => {
    setChallan(data);
  };

  useEffect(() => {
    fetchChallanDetails();
  }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm('Are you sure you want to CONFIRM this challan? Stock units will be deducted from warehouse inventory.')) {
      return;
    }
    try {
      setActionLoading(true);
      const response = await api.post(`/challans/${id}/confirm`);
      if (response.data.success) {
        fetchChallanDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stock deduction failed. Check product stock volumes.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to CANCEL this challan? This action is irreversible.')) {
      return;
    }
    try {
      setActionLoading(true);
      const response = await api.post(`/challans/${id}/cancel`);
      if (response.data.success) {
        fetchChallanDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !challan) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <p className="font-bold">{error || 'Challan invoice not found'}</p>
        <Link to="/challans" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Challans List
        </Link>
      </div>
    );
  }

  const isDraft = challan.status === 'DRAFT';
  const isConfirmed = challan.status === 'CONFIRMED';

  const totalAmount = challan.items.reduce((acc: number, curr: any) => acc + curr.total, 0);

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/challans"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Challans Ledger
        </Link>

        {/* Action Button Bar */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </button>

          {isSales && isDraft && (
            <>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 px-3 py-2 font-bold hover:bg-red-50 transition-colors shadow-sm"
              >
                <XCircle className="h-4 w-4" /> Cancel Draft
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm Challan
              </button>
            </>
          )}

          {isSales && isConfirmed && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 px-3.5 py-2 font-bold hover:bg-red-50 transition-colors shadow-sm"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel & Restock
            </button>
          )}
        </div>
      </div>

      {/* Main Print container */}
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm space-y-8 font-sans text-xs text-slate-700 print:shadow-none print:border-none print:p-0">
        {/* Invoice Branding and Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
              OpsFlow ERP
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Wholesale Distribution Delivery Challan
            </p>
          </div>

          <div className="text-left sm:text-right font-semibold space-y-1">
            <p className="text-sm font-black text-slate-900">{challan.challanNumber}</p>
            <div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                isConfirmed
                  ? 'bg-emerald-100 text-emerald-800'
                  : isDraft
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {challan.status}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] mt-2">
              Date:{' '}
              {new Date(challan.createdAt).toLocaleDateString([], {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Customer vs Company Addresses grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Company address block */}
          <div className="space-y-2 border-r border-slate-100/50 pr-4">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sender / Dispatch Depot</h4>
            <p className="font-extrabold text-slate-900">OpsFlow Distribution Ltd</p>
            <p className="text-slate-500 font-normal leading-relaxed">
              Industrial Estate Sector 5, Block B,<br />
              Depot Warehouse Complex,<br />
              Maharashtra, India
            </p>
            <p className="text-slate-400 text-[10px] pt-1">GSTIN: 27OPSFL1234F1Z0</p>
          </div>

          {/* Customer address block */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bill To / Consignee</h4>
            <p className="font-extrabold text-slate-900">{customerInfoParsed(challan.customer.customerName)}</p>
            <p className="text-slate-500 font-normal leading-relaxed">
              {challan.customer.businessName}<br />
              {challan.customer.address || 'No billing address provided.'}
            </p>
            <p className="text-slate-800">Phone: {challan.customer.mobile}</p>
            <p className="text-slate-400 text-[10px] pt-1">GSTIN: {challan.customer.gstNumber || 'No GST Registered'}</p>
          </div>
        </div>

        {/* Items List Table */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden mt-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3 font-mono text-[10px] text-slate-400">SKU</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-center">Quantity</th>
                <th className="px-5 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {challan.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/20">
                  <td className="px-5 py-3.5 font-bold text-slate-900 leading-snug">{item.productName}</td>
                  <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">{item.sku}</td>
                  <td className="px-5 py-3.5 text-right text-slate-900">
                    ₹{item.unitPrice.toLocaleString([], { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    ₹{item.total.toLocaleString([], { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary block */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-4 border-t border-slate-100">
          {/* Creator tag */}
          <div className="flex items-center gap-2 text-slate-400 font-semibold py-1">
            <User className="h-4 w-4" />
            <span>Generated by: {challan.creator.name} ({challan.creator.role})</span>
          </div>

          {/* Grand totals box */}
          <div className="w-full sm:w-80 bg-slate-50 rounded-2xl border border-slate-100 p-4 font-bold text-slate-700 space-y-2 self-end">
            <div className="flex justify-between text-xs">
              <span>Total Quantity Units:</span>
              <span className="text-slate-950 font-black">{challan.totalQuantity} Units</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200/60 pt-2 text-indigo-900">
              <span>Grand Total Valuation:</span>
              <span className="text-slate-950 text-base font-black">
                ₹{totalAmount.toLocaleString([], { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer block */}
        <div className="pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-normal leading-relaxed text-center">
          <p>
            * This is a computer generated delivery challan and does not require physical signature. <br />
            Goods received in good condition. All disputes subject to local jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );

  function customerInfoParsed(name: string) {
    return name;
  }
};
