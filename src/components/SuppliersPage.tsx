import React, { useState } from 'react';
import {
  SupplierPurchaseInvoice,
  WorkshopSettings,
  PURCHASE_CATEGORY_LABELS,
  PURCHASE_PAYMENT_STATUS_LABELS,
  PurchaseCategory,
  PurchasePaymentStatus,
} from '../types';
import { formatCurrency } from '../utils/calculator';
import {
  Package,
  Search,
  Filter,
  Plus,
  Truck,
  Phone,
  Calendar,
  Layers,
  FileText,
  Printer,
  Edit2,
  Trash2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Building,
  Clock,
} from 'lucide-react';

interface Props {
  invoices: SupplierPurchaseInvoice[];
  settings: WorkshopSettings;
  currency: string;
  onNewInvoice: () => void;
  onEditInvoice: (invoice: SupplierPurchaseInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onViewInvoice: (invoice: SupplierPurchaseInvoice) => void;
  onQuickPay: (invoiceId: string, amount: number) => void;
}

export const SuppliersPage: React.FC<Props> = ({
  invoices,
  settings,
  currency,
  onNewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onViewInvoice,
  onQuickPay,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Quick Pay Modal State
  const [quickPayInvoice, setQuickPayInvoice] = useState<SupplierPurchaseInvoice | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number | ''>('');

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !searchQuery.trim() ||
      inv.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.supplierPhone && inv.supplierPhone.includes(searchQuery)) ||
      inv.items.some((item) => item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || inv.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleConfirmQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayInvoice || !quickPayAmount || quickPayAmount <= 0) return;
    onQuickPay(quickPayInvoice.id, Number(quickPayAmount));
    setQuickPayInvoice(null);
    setQuickPayAmount('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Suppliers Header & Action Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              سجل فواتير الشراء والتوريد للموردين
            </h2>
            <span className="text-xs text-slate-500">
              إجمالي {invoices.length} فاتورة شراء مسجلة (التقارير المالية والذمم ضمن صفحة الأرباح والميزانية)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewInvoice}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل فاتورة شراء جديدة</span>
        </button>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المورد، رقم الفاتورة، أو اسم الخامة..."
            className="w-full text-xs sm:text-sm pl-3 pr-9 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>حالة السداد:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مسدد بالكامل</option>
            <option value="partial">مسدد جزئياً</option>
            <option value="unpaid">غير مسدد (آجل)</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
            <span>الصنف:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="all">جميع الأصناف</option>
            <option value="aluminum">ألمنيوم وبروفايلات</option>
            <option value="glass">زجاج ودبل جلاس</option>
            <option value="accordion">أبواب أكرديون</option>
            <option value="zebra">ستائر زيبرا</option>
            <option value="shutters">محركات وشتر</option>
            <option value="accessories">خردوات وإكسسوارات</option>
          </select>

          <button
            type="button"
            onClick={onNewInvoice}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors mr-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>فاتورة شراء جديدة</span>
          </button>
        </div>
      </div>

      {/* 3. Invoices List / Cards Grid */}
      {filteredInvoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInvoices.map((invoice, index) => {
            const statusInfo = PURCHASE_PAYMENT_STATUS_LABELS[invoice.paymentStatus] || {
              label: invoice.paymentStatus,
              color: 'text-slate-700',
              bg: 'bg-slate-50',
            };
            const catInfo = PURCHASE_CATEGORY_LABELS[invoice.category] || {
              label: 'مشتريات عامة',
            };
            const invCurrency = invoice.currency || currency;

            return (
              <div
                key={`${invoice.id}-${index}`}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {invoice.invoiceNumber}
                        </span>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            invCurrency === '$'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : invCurrency === 'ل.س'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {invCurrency === '$' ? '💵 دولار ($)' : invCurrency === 'ل.س' ? '🇸🇾 ليرة (ل.س)' : invCurrency}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {catInfo.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {invoice.supplierName}
                      </h3>
                      {invoice.supplierPhone && (
                        <span className="text-[11px] text-slate-400 block mt-0.5 dir-ltr text-right">
                          {invoice.supplierPhone}
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${statusInfo.bg} ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{invoice.invoiceDate}</span>
                    </span>
                    {invoice.dueDate && (
                      <span className="flex items-center gap-1 text-rose-600 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>استحقاق: {invoice.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items preview */}
                <div className="p-4 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">
                    البنود والمشتريات ({invoice.items.length}):
                  </span>
                  <div className="space-y-1.5">
                    {invoice.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="text-slate-700 font-medium truncate max-w-[180px]">
                          {item.description}
                        </span>
                        <span className="font-mono text-slate-900 font-bold shrink-0">
                          {item.quantity} {item.unit} • {formatCurrency(item.totalPrice, invCurrency)}
                        </span>
                      </div>
                    ))}
                    {invoice.items.length > 3 && (
                      <span className="text-[10px] text-slate-400 block text-center pt-0.5">
                        +{invoice.items.length - 3} بنود أخرى في الفاتورة
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="px-4 py-3 bg-amber-50/40 border-t border-b border-amber-100/70 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500 font-bold">إجمالي الفاتورة:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(invoice.totalAmount, invCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-emerald-800">
                    <span className="font-bold">المسدد:</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(invoice.paidAmount, invCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 font-bold">
                    <span className={invoice.remainingAmount > 0 ? 'text-rose-700' : 'text-slate-600'}>
                      المتبقي للمورد:
                    </span>
                    <span
                      className={`font-mono text-sm font-black ${
                        invoice.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(invoice.remainingAmount, invCurrency)}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-white flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(invoice)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="معاينة وطباعة الفاتورة"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">طباعة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditInvoice(invoice)}
                      className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="تعديل الفاتورة"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteInvoice(invoice.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف الفاتورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {invoice.remainingAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPayInvoice(invoice);
                        setQuickPayAmount(invoice.remainingAmount);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>سداد دفعة</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 mb-3 border border-amber-100">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">
            لا توجد فواتير شراء مطابقة للبحث أو الفلتر
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            يمكنك تسجيل فواتير شراء وتوريد خامات الورشة (الألمنيوم، الزجاج، الأكرديون، الشتر) لمتابعة التكاليف والمستحقات.
          </p>
          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل فاتورة شراء جديدة الآن</span>
          </button>
        </div>
      )}

      {/* Quick Pay Mini Modal */}
      {quickPayInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-slate-200 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              تسجيل دفعة سداد للمورد
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              المورد: {quickPayInvoice.supplierName} • فاتورة: {quickPayInvoice.invoiceNumber}
            </p>

            <form onSubmit={handleConfirmQuickPay} className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">المتبقي حالياً:</span>
                  <span className="font-bold font-mono text-rose-600">
                    {formatCurrency(quickPayInvoice.remainingAmount, currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المدفوع الآن ({currency}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={quickPayInvoice.remainingAmount}
                  step="any"
                  required
                  value={quickPayAmount}
                  onChange={(e) => setQuickPayAmount(Number(e.target.value) || '')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickPayInvoice(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                >
                  تأكيد السداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
