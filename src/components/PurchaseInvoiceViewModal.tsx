import React, { useState } from 'react';
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
  MessageSquare,
  Briefcase,
  PenTool,
  Receipt,
} from 'lucide-react';
import { formatCurrency, getSupplierPayments } from '../utils/calculator';
import {
  generatePurchaseInvoiceText,
  openWhatsApp,
} from '../utils/shareUtils';
import { SignaturePadModal } from './SignaturePadModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface Props {
  invoice: SupplierPurchaseInvoice;
  settings: WorkshopSettings;
  currency: string;
  onUpdateInvoice?: (invoice: SupplierPurchaseInvoice) => void;
  onClose: () => void;
}

export const PurchaseInvoiceViewModal: React.FC<Props> = ({
  invoice: initialInvoice,
  settings,
  currency: defaultCurrency,
  onUpdateInvoice,
  onClose,
}) => {
  const [currentInvoice, setCurrentInvoice] = useState<SupplierPurchaseInvoice>(initialInvoice);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [signingTarget, setSigningTarget] = useState<'receiver' | 'supplier' | null>(null);

  const currency = currentInvoice.currency || defaultCurrency;
  const messageText = generatePurchaseInvoiceText(currentInvoice, settings.workshopName, currency);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickStandardWA = () => {
    openWhatsApp({
      phone: currentInvoice.supplierPhone,
      text: messageText,
      type: 'standard',
    });
  };

  const handleQuickBusinessWA = () => {
    openWhatsApp({
      phone: currentInvoice.supplierPhone,
      text: messageText,
      type: 'business',
    });
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (!signingTarget) return;

    const updated: SupplierPurchaseInvoice = {
      ...currentInvoice,
      [signingTarget === 'receiver' ? 'receiverSignature' : 'supplierSignature']: signatureDataUrl,
    };

    setCurrentInvoice(updated);
    if (onUpdateInvoice) {
      onUpdateInvoice(updated);
    }
    setSigningTarget(null);
  };

  const handleRemoveSignature = (target: 'receiver' | 'supplier') => {
    const updated: SupplierPurchaseInvoice = {
      ...currentInvoice,
      [target === 'receiver' ? 'receiverSignature' : 'supplierSignature']: undefined,
    };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) {
      onUpdateInvoice(updated);
    }
  };

  const categoryInfo = PURCHASE_CATEGORY_LABELS[currentInvoice.category] || {
    label: 'مشتريات عامة',
  };

  const statusInfo = PURCHASE_PAYMENT_STATUS_LABELS[currentInvoice.paymentStatus] || {
    label: currentInvoice.paymentStatus,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right">
          {/* Modal Top Bar (Non-printed) */}
          <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50 no-print gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">معاينة فاتورة الشراء والتوريد</span>
              <span className="font-mono text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-bold">
                {currentInvoice.invoiceNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* WhatsApp Standard */}
              <button
                type="button"
                onClick={handleQuickStandardWA}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="إرسال عبر واتساب العادي"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">واتساب عادي</span>
                <span className="xs:hidden">واتساب</span>
              </button>

              {/* WhatsApp Business */}
              <button
                type="button"
                onClick={handleQuickBusinessWA}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="إرسال عبر واتساب للأعمال (WhatsApp Business)"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">واتساب أعمال 💼</span>
                <span className="xs:hidden">أعمال</span>
              </button>

              {/* Advanced Share Options */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="خيارات المشاركة والنسخ"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مشاركة</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors mr-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white print:p-0 space-y-6">
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
                  {settings.address} {settings.phone ? `• هاتف: ${settings.phone}` : ''}
                </p>
              </div>

              <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 min-w-[200px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-slate-900">{currentInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">تاريخ الشراء:</span>
                  <span className="font-mono text-slate-700">{currentInvoice.invoiceDate}</span>
                </div>
                {currentInvoice.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">تاريخ الاستحقاق:</span>
                    <span className="font-mono text-rose-600 font-bold">{currentInvoice.dueDate}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">حالة السداد:</span>
                  <span className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
              </div>
            </div>

            {/* Supplier & Info Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  <span>بيانات المورد والتاجر</span>
                </div>
                <p className="font-black text-slate-950 text-base">{currentInvoice.supplierName}</p>
                {currentInvoice.supplierPhone && (
                  <p className="text-slate-700 flex items-center gap-1 font-mono font-bold" dir="ltr">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {currentInvoice.supplierPhone}
                  </p>
                )}
                {currentInvoice.supplierAddress && (
                  <p className="text-slate-500">{currentInvoice.supplierAddress}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:border-r sm:border-slate-200 sm:pr-4">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>تصنيف المشتريات وطريقة الدفع</span>
                </div>
                <p className="font-semibold text-slate-800">
                  التصنيف:{' '}
                  <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                    {categoryInfo.label}
                  </span>
                </p>
                {currentInvoice.paymentMethod && (
                  <p className="text-slate-600 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-400" />
                    <span>
                      طريقة السداد:{' '}
                      {currentInvoice.paymentMethod === 'cash'
                        ? 'نقداً كاش'
                        : currentInvoice.paymentMethod === 'credit'
                        ? 'آجل على الحساب'
                        : currentInvoice.paymentMethod === 'check'
                        ? 'شيك مصرفي'
                        : 'تحويل بنكي'}
                    </span>
                  </p>
                )}
                {currentInvoice.notes && (
                  <p className="text-slate-500 italic mt-1 text-[11px]">ملاحظات: {currentInvoice.notes}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5">بيان المادة / البضاعة المشتراة</th>
                    <th className="p-2.5 w-24 text-center">التصنيف</th>
                    <th className="p-2.5 w-24 text-center">الكمية</th>
                    <th className="p-2.5 w-28 text-center">سعر الوحدة</th>
                    <th className="p-2.5 w-32 text-left">المجموع الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentInvoice.items.map((item, idx) => {
                    const itemCat = PURCHASE_CATEGORY_LABELS[item.category]?.label || item.category;
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{item.description}</td>
                        <td className="p-2.5 text-center text-slate-600 text-[11px]">{itemCat}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-700">
                          {formatCurrency(item.unitPrice, currency)}
                        </td>
                        <td className="p-2.5 text-left font-mono font-bold text-slate-900">
                          {formatCurrency(item.totalPrice, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-700">
                  <span className="font-bold">إجمالي قيمة المشتريات:</span>
                  <span className="font-mono font-black text-slate-950 text-sm">
                    {formatCurrency(currentInvoice.totalAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-emerald-800 font-bold border-t border-slate-200">
                  <span>
                    {getSupplierPayments(currentInvoice).length > 1
                      ? `إجمالي المسدد (${getSupplierPayments(currentInvoice).length} دفعات):`
                      : 'المبلغ المدفوع كاش:'}
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {formatCurrency(currentInvoice.paidAmount, currency)}
                  </span>
                </div>
                <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
                  currentInvoice.remainingAmount > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  <span className="font-black">
                    {currentInvoice.remainingAmount > 0 ? 'الرصيد المتبقي للمورد:' : 'حالة الفاتورة:'}
                  </span>
                  <span
                    className={`font-mono text-base sm:text-lg font-black ${
                      currentInvoice.remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {currentInvoice.remainingAmount > 0
                      ? formatCurrency(currentInvoice.remainingAmount, currency)
                      : 'مسدد بالكامل ✅'}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Payments Breakdown Section (سجل وتفصيل دفعات المورد) */}
            {getSupplierPayments(currentInvoice).length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    سجل وتفصيل دفعات السداد للمورد ({getSupplierPayments(currentInvoice).length} دفعات):
                  </h4>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 text-center w-12 font-mono">#</th>
                        <th className="p-2.5">بيان الدفعة</th>
                        <th className="p-2.5 text-center">طريقة السداد</th>
                        <th className="p-2.5 text-center">تاريخ السداد</th>
                        <th className="p-2.5 text-left font-mono">قيمة الدفعة</th>
                        <th className="p-2.5 text-left font-mono">المتبقي بعدها</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getSupplierPayments(currentInvoice).map((pmt, idx) => (
                        <tr key={pmt.id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {pmt.note || `دفعة سداد للمورد #${idx + 1}`}
                          </td>
                          <td className="p-2.5 text-center text-slate-600">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium border border-slate-200">
                              {pmt.paymentMethod === 'bank'
                                ? '🏦 تحويل بنكي'
                                : pmt.paymentMethod === 'check'
                                ? '🧾 شيك'
                                : '💵 نقداً (كاش)'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-slate-600 font-mono text-[11px]">
                            {pmt.date
                              ? new Date(pmt.date).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="p-2.5 text-left font-mono font-bold text-emerald-700">
                            +{formatCurrency(pmt.amount, currency)}
                          </td>
                          <td className="p-2.5 text-left font-mono text-slate-600">
                            {pmt.remainingAfter !== undefined
                              ? formatCurrency(pmt.remainingAfter, currency)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-800">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right font-bold">
                          إجمالي المسدد للمورد:
                        </td>
                        <td className="p-2.5 text-left font-mono text-emerald-700 text-sm">
                          {formatCurrency(currentInvoice.paidAmount, currency)}
                        </td>
                        <td className="p-2.5 text-left font-mono text-rose-600 text-xs">
                          المتبقي: {formatCurrency(currentInvoice.remainingAmount, currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Signatures Section with Touch Support */}
            <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center text-xs text-slate-600">
              {/* Receiver (Workshop) */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[130px]">
                <p className="font-bold text-slate-800">توقيع المستلم (الورشة)</p>
                <div className="my-2 flex flex-col items-center justify-center min-h-[60px]">
                  {currentInvoice.receiverSignature ? (
                    <div>
                      <img
                        src={currentInvoice.receiverSignature}
                        alt="توقيع المستلم"
                        className="max-h-16 max-w-full object-contain mx-auto block"
                        style={{ minHeight: '40px', display: 'block' }}
                        crossOrigin="anonymous"
                      />
                      <div className="no-print mt-1 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSigningTarget('receiver')}
                          className="text-[10px] text-blue-600 hover:underline px-1 cursor-pointer"
                        >
                          إعادة التوقيع
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSignature('receiver')}
                          className="text-[10px] text-rose-600 hover:underline px-1 cursor-pointer"
                        >
                          مسح
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-1">
                      <div className="w-32 border-b border-dashed border-slate-400 my-2" />
                      <button
                        type="button"
                        onClick={() => setSigningTarget('receiver')}
                        className="no-print inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-blue-600" />
                        <span>توقيع باللمس ✍️</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">استلام المواد سليمة ومطابقة</span>
              </div>

              {/* Supplier Driver */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[130px]">
                <p className="font-bold text-slate-800">توقيع مندوب المورد / السائق</p>
                <div className="my-2 flex flex-col items-center justify-center min-h-[60px]">
                  {currentInvoice.supplierSignature ? (
                    <div>
                      <img
                        src={currentInvoice.supplierSignature}
                        alt="توقيع المورد"
                        className="max-h-16 max-w-full object-contain mx-auto block"
                        style={{ minHeight: '40px', display: 'block' }}
                        crossOrigin="anonymous"
                      />
                      <div className="no-print mt-1 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSigningTarget('supplier')}
                          className="text-[10px] text-blue-600 hover:underline px-1 cursor-pointer"
                        >
                          إعادة التوقيع
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSignature('supplier')}
                          className="text-[10px] text-rose-600 hover:underline px-1 cursor-pointer"
                        >
                          مسح
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-1">
                      <div className="w-32 border-b border-dashed border-slate-400 my-2" />
                      <button
                        type="button"
                        onClick={() => setSigningTarget('supplier')}
                        className="no-print inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-amber-700" />
                        <span>توقيع السائق باللمس ✍️</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">تسليم البضاعة وقبض الدفعة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Touch Signature Modal */}
      {signingTarget && (
        <SignaturePadModal
          isOpen={!!signingTarget}
          title={signingTarget === 'receiver' ? 'توقيع مستلم المواد بالورشة' : 'توقيع مندوب وسائق المورد'}
          signerName={signingTarget === 'receiver' ? (settings.ownerName || settings.workshopName) : currentInvoice.supplierName}
          initialSignature={signingTarget === 'receiver' ? currentInvoice.receiverSignature : currentInvoice.supplierSignature}
          onSave={handleSaveSignature}
          onClose={() => setSigningTarget(null)}
        />
      )}

      {/* WhatsApp Share Modal */}
      {isShareModalOpen && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          title="مشاركة فاتورة الشراء والتوريد"
          subtitle={`فاتورة: ${currentInvoice.invoiceNumber} - المورد: ${currentInvoice.supplierName}`}
          defaultPhone={currentInvoice.supplierPhone}
          messageText={messageText}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  );
};
