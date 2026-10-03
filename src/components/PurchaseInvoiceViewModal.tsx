import React from 'react';
import {
  SupplierPurchaseInvoice,
  WorkshopSettings,
  PURCHASE_CATEGORY_LABELS,
  PURCHASE_PAYMENT_STATUS_LABELS,
} from '../types';
import {
  X,
  Printer,
  Share2,
  Calendar,
  Building,
  Phone,
  FileText,
  CreditCard,
  Package,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

interface Props {
  invoice: SupplierPurchaseInvoice;
  settings: WorkshopSettings;
  currency: string;
  onClose: () => void;
}

export const PurchaseInvoiceViewModal: React.FC<Props> = ({
  invoice,
  settings,
  currency,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*فاتورة شراء رقم: ${invoice.invoiceNumber}*
المورد: ${invoice.supplierName}
التاريخ: ${invoice.invoiceDate}
عدد البنود: ${invoice.items.length}
الإجمالي: ${formatCurrency(invoice.totalAmount, currency)}
المدفوع: ${formatCurrency(invoice.paidAmount, currency)}
المتبقي: ${formatCurrency(invoice.remainingAmount, currency)}
الحالة: ${PURCHASE_PAYMENT_STATUS_LABELS[invoice.paymentStatus]?.label || invoice.paymentStatus}
مستلمة لـ: ${settings.workshopName}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const categoryInfo = PURCHASE_CATEGORY_LABELS[invoice.category] || {
    label: 'مشتريات عامة',
  };

  const statusInfo = PURCHASE_PAYMENT_STATUS_LABELS[invoice.paymentStatus] || {
    label: invoice.paymentStatus,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right">
        {/* Modal Top Bar (Non-printed) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">معاينة فاتورة الشراء والتوريد</span>
            <span className="font-mono text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-bold">
              {invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الفاتورة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors mr-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white print:p-0 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-amber-500 pb-5 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 mb-2">
                <Package className="w-3.5 h-3.5" />
                <span>سند استلام بضاعة وفاتورة شراء خامات</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {settings.workshopName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                إدارة الورشة: {settings.ownerName} • هاتف: {settings.phone}
              </p>
            </div>

            <div className="text-left sm:text-left">
              <div className="text-sm font-black text-slate-800 font-mono">
                رقم الفاتورة: {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 justify-end sm:justify-start">
                <Calendar className="w-3.5 h-3.5" />
                <span>تاريخ التوريد: {invoice.invoiceDate}</span>
              </div>
              <div className="mt-2">
                <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-500 block mb-1">المورد / شركة التوريد:</span>
              <span className="font-bold text-slate-900 text-sm block">{invoice.supplierName}</span>
              {invoice.supplierAddress && (
                <span className="text-slate-600 block mt-0.5">{invoice.supplierAddress}</span>
              )}
              {invoice.supplierPhone && (
                <span className="text-slate-600 block mt-0.5 dir-ltr text-right">
                  هاتف: {invoice.supplierPhone}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-slate-500 font-bold">صنف التوريد: </span>
                <span className="font-semibold text-slate-800">{categoryInfo.label}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold">طريقة السداد: </span>
                <span className="font-semibold text-slate-800">
                  {invoice.paymentMethod === 'cash'
                    ? 'نقداً (كاش)'
                    : invoice.paymentMethod === 'bank'
                    ? 'تحويل بنكي'
                    : invoice.paymentMethod === 'check'
                    ? 'شيك بنكي'
                    : 'آجل / ذمة'}
                </span>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-slate-500 font-bold">تاريخ استحقاق الرصيد: </span>
                  <span className="font-mono text-rose-700 font-bold">{invoice.dueDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5">بيان الخامة / البضاعة</th>
                  <th className="p-2.5 w-24 text-center">الكمية</th>
                  <th className="p-2.5 w-24 text-center">الوحدة</th>
                  <th className="p-2.5 w-28 text-left">سعر الوحدة</th>
                  <th className="p-2.5 w-28 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-slate-900">{item.description}</td>
                    <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="p-2.5 text-center text-slate-600">{item.unit}</td>
                    <td className="p-2.5 text-left font-mono text-slate-700">
                      {formatCurrency(item.unitPrice, currency)}
                    </td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-900">
                      {formatCurrency(item.totalPrice, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Balances */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
            <div className="text-xs text-slate-600 max-w-sm">
              {invoice.notes ? (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">ملاحظات الفاتورة:</span>
                  <p className="text-slate-600">{invoice.notes}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic">تم استلام الخامات ومطابقتها للمواصفات الفنية للورشة.</p>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="font-bold">إجمالي فاتورة الشراء:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(invoice.totalAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60 text-emerald-800">
                <span className="font-bold">المبلغ المسدد للمورد:</span>
                <span className="font-mono font-bold text-sm">
                  {formatCurrency(invoice.paidAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1 font-bold">
                <span className={invoice.remainingAmount > 0 ? 'text-rose-700' : 'text-slate-700'}>
                  الرصيد المتبقي للمورد:
                </span>
                <span
                  className={`font-mono text-base font-black ${
                    invoice.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(invoice.remainingAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600">
            <div>
              <p className="font-bold mb-8">توقيع المستلم (الورشة)</p>
              <div className="w-32 border-b border-dashed border-slate-400 mx-auto" />
            </div>
            <div>
              <p className="font-bold mb-8">توقيع مندوب المورد / السائق</p>
              <div className="w-32 border-b border-dashed border-slate-400 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
