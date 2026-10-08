import React, { useState } from 'react';
import { CustomerOrder, WorkshopSettings, CATEGORY_LABELS, OrderPaymentRecord } from '../types';
import { formatCurrency, getOrderPayments } from '../utils/calculator';
import {
  generateCustomerInvoiceText,
  openWhatsApp,
} from '../utils/shareUtils';
import {
  Printer,
  Share2,
  X,
  Wrench,
  CheckCircle,
  Briefcase,
  MessageSquare,
  PenTool,
  RotateCcw,
  Sparkles,
  DollarSign,
  Receipt,
  Plus,
  Trash2,
} from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { CustomerPaymentModal } from './CustomerPaymentModal';

interface Props {
  order: CustomerOrder | null;
  settings: WorkshopSettings;
  currency: string;
  onUpdateOrder?: (order: CustomerOrder) => void;
  onClose: () => void;
}

export const InvoiceModal: React.FC<Props> = ({
  order: initialOrder,
  settings,
  currency: defaultCurrency,
  onUpdateOrder,
  onClose,
}) => {
  if (!initialOrder) return null;

  // Local state for immediate signature updates
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder>(initialOrder);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [signingTarget, setSigningTarget] = useState<'customer' | 'workshop' | null>(null);
  const [isCollectingPayment, setIsCollectingPayment] = useState(false);

  const currency = currentOrder.currency || defaultCurrency;
  const messageText = generateCustomerInvoiceText(currentOrder, settings.workshopName, currency);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickStandardWA = () => {
    openWhatsApp({
      phone: currentOrder.customerPhone,
      text: messageText,
      type: 'standard',
    });
  };

  const handleQuickBusinessWA = () => {
    openWhatsApp({
      phone: currentOrder.customerPhone,
      text: messageText,
      type: 'business',
    });
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (!signingTarget) return;

    const updated: CustomerOrder = {
      ...currentOrder,
      [signingTarget === 'customer' ? 'customerSignature' : 'workshopSignature']: signatureDataUrl,
    };

    setCurrentOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
    setSigningTarget(null);
  };

  const handleRemoveSignature = (target: 'customer' | 'workshop') => {
    const updated: CustomerOrder = {
      ...currentOrder,
      [target === 'customer' ? 'customerSignature' : 'workshopSignature']: undefined,
    };
    setCurrentOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  const payments = getOrderPayments(currentOrder);

  const handleDeletePayment = (paymentId: string) => {
    if (!confirm('هل تريد بالتأكيد حذف هذه الدفعة وإعادة احتساب رصيد الزبون؟')) return;
    const currentPayments = getOrderPayments(currentOrder);
    const remainingList = currentPayments.filter((p) => p.id !== paymentId);
    const newDeposit = Number(remainingList.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
    const newRemaining = Math.max(0, Number((currentOrder.finalSellingPrice - newDeposit).toFixed(2)));
    let running = 0;
    const recalculated = remainingList.map((p) => {
      running += p.amount;
      return {
        ...p,
        remainingAfter: Math.max(0, Number((currentOrder.finalSellingPrice - running).toFixed(2))),
      };
    });
    const updated: CustomerOrder = {
      ...currentOrder,
      deposit: newDeposit,
      remainingBalance: newRemaining,
      payments: recalculated,
      status: currentOrder.status === 'completed' && newRemaining > 0 ? 'in_progress' : currentOrder.status,
    };
    setCurrentOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
          {/* Actions Bar (hidden when printing) */}
          <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 bg-slate-900 text-white gap-2 no-print">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">معاينة فاتورة البيع</span>
              <span className="text-xs text-slate-400 font-mono">({currentOrder.orderNumber})</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Quick Collect Payment Button if Remaining > 0 */}
              {currentOrder.remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCollectingPayment(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="تسجيل تحصيل دفعة أو تسديد من الزبون"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">تحصيل دفعة</span>
                  <span className="xs:hidden">تحصيل</span>
                </button>
              )}

              {/* WhatsApp Standard Quick Button */}
              <button
                type="button"
                onClick={handleQuickStandardWA}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="إرسال عبر تطبيق واتساب العادي"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">واتساب عادي</span>
                <span className="xs:hidden">واتساب</span>
              </button>

              {/* WhatsApp Business Quick Button */}
              <button
                type="button"
                onClick={handleQuickBusinessWA}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="إرسال عبر تطبيق واتساب للأعمال (WhatsApp Business)"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">واتساب أعمال 💼</span>
                <span className="xs:hidden">أعمال</span>
              </button>

              {/* Share Options Dialog Button */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                title="خيارات المشاركة والنسخ المتقدمة"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">خيارات المشاركة</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة / PDF</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Paper Document */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-10 bg-white text-slate-900 font-['Cairo',sans-serif]">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header / Brand */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt={settings.workshopName}
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-0.5"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                        <Wrench className="w-5 h-5" />
                      </div>
                    )}
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                      {settings.workshopName}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {settings.ownerName ? `إدارة: ${settings.ownerName} | ` : ''}هاتف: {settings.phone}
                    {settings.email ? ` | إيميل: ${settings.email}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {settings.address} • تخصص ألمنيوم، أبواب أكرديون، ستائر زيبرا، أباجورات
                  </p>
                </div>

                <div className="text-left space-y-1">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded">
                    {currentOrder.status === 'quotation' ? 'عرض سعر مبدئي' : 'فاتورة بيع معتمدة'}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700">
                    رقم: {currentOrder.orderNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    التاريخ: {new Date(currentOrder.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">اسم الزبون:</span>
                  <span className="font-bold text-slate-900 text-sm">{currentOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">رقم الهاتف:</span>
                  <span className="font-semibold text-slate-800 font-mono" dir="ltr">
                    {currentOrder.customerPhone || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">العنوان وموقع التركيب:</span>
                  <span className="font-semibold text-slate-800">{currentOrder.customerAddress || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">موعد التركيب المتوقع:</span>
                  <span className="font-semibold text-slate-800">{currentOrder.deliveryDate || 'حسب الاتفاق'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="p-2 border border-slate-700 w-8 text-center">#</th>
                      <th className="p-2 border border-slate-700">البيان</th>
                      <th className="p-2 border border-slate-700 text-center">المقاس</th>
                      <th className="p-2 border border-slate-700 text-center">العدد</th>
                      <th className="p-2 border border-slate-700 text-center">القياس (م² / متر جر)</th>
                      <th className="p-2 border border-slate-700 text-center">سعر المتر</th>
                      <th className="p-2 border border-slate-700 text-left">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.items.map((item, idx) => {
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                          <td className="p-2 border border-slate-200 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-200">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{item.name}</span>
                              {item.category === 'kitchens' && (
                                <span className="text-[10px] bg-orange-100 text-orange-900 border border-orange-300 font-bold px-1.5 py-0.5 rounded">
                                  تفصيل وتصنيع مطبخ (متر جر)
                                </span>
                              )}
                            </div>

                            {/* Kitchen Specific Specifications & Components */}
                            {item.category === 'kitchens' && item.options && (
                              <div className="mt-1 space-y-1 text-[11px] text-slate-700 bg-orange-50/60 p-2 rounded border border-orange-200/80">
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-800">
                                  {item.options.kitchenLayout && (
                                    <span><strong className="text-orange-950">التصميم:</strong> {item.options.kitchenLayout}</span>
                                  )}
                                  {item.options.kitchenDoorsType && (
                                    <span><strong className="text-orange-950">الدرف:</strong> {item.options.kitchenDoorsType}</span>
                                  )}
                                  {item.options.kitchenCountertop && (
                                    <span><strong className="text-orange-950">الرخام:</strong> {item.options.kitchenCountertop}</span>
                                  )}
                                  {item.options.kitchenCabinetBody && (
                                    <span><strong className="text-orange-950">الهيكل:</strong> {item.options.kitchenCabinetBody}</span>
                                  )}
                                </div>

                                {/* Kitchen Included Components / Bill of Materials */}
                                {item.options.kitchenComponents && item.options.kitchenComponents.length > 0 && (
                                  <div className="mt-1.5 pt-1.5 border-t border-orange-200/60">
                                    <div className="font-bold text-[10px] text-orange-950 mb-0.5">
                                      الإضافات ومستلزمات تصنيع المطبخ المشمولة ({item.options.kitchenComponents.length} إضافات):
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
                                      {item.options.kitchenComponents.map((c, cIdx) => (
                                        <div key={c.id || cIdx} className="flex items-center justify-between bg-white/80 px-2 py-0.5 rounded border border-orange-200/50">
                                          <span className="truncate max-w-[200px] font-medium text-slate-800">• {c.name}</span>
                                          <span className="font-mono text-slate-600 shrink-0 font-bold">
                                            {c.quantity} {c.unit} {c.totalPrice > 0 ? `(${formatCurrency(c.totalPrice, currency)})` : ''}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {(item.additionalPrice > 0 || item.additionalName) && item.category !== 'kitchens' && (
                              <div className="text-[11px] text-amber-900 font-semibold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 inline-flex items-center gap-1">
                                <span>+ إضافات متفق عليها:</span>
                                <span className="font-bold">{item.additionalName || 'مسكات باب / قفل / إكسسوار'}</span>
                                <span>(+{formatCurrency(item.additionalPrice, currency)}{item.quantity > 1 ? ` × ${item.quantity}` : ''})</span>
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">ملاحظة: {item.notes}</div>
                            )}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-mono text-slate-700 whitespace-nowrap font-bold">
                            {item.category === 'kitchens'
                              ? `${item.unit === 'cm' ? (item.width / 100).toFixed(1) : item.width} متر جر`
                              : `${item.width} × ${item.height} ${item.unit === 'cm' ? 'سم' : 'م'}`}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                            {item.quantity}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-900">
                            {item.totalArea} {item.category === 'kitchens' ? 'متر جر' : 'م²'}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-mono">
                            {formatCurrency(item.pricePerMeter, currency)}
                          </td>
                          <td className="p-2 border border-slate-200 text-left font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(item.totalPrice, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Calculation Box */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
                <div className="flex-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 mb-1">الشروط والأحكام:</div>
                  <p className="leading-relaxed">{settings.invoiceNotes}</p>
                  {currentOrder.notes && (
                    <p className="text-amber-800 pt-1 border-t border-slate-200 font-medium">
                      ملاحظات فاتورة البيع: {currentOrder.notes}
                    </p>
                  )}
                </div>

                <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الإجمالي:</span>
                    <span className="font-bold font-mono text-slate-800">
                      {formatCurrency(currentOrder.subtotal, currency)}
                    </span>
                  </div>

                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>خصم خاص:</span>
                      <span className="font-bold font-mono">
                        -{formatCurrency(currentOrder.discount, currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-300 text-sm">
                    <span>الصافي المطلوب:</span>
                    <span className="font-mono text-blue-700">
                      {formatCurrency(currentOrder.finalSellingPrice, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>
                      {payments.length > 1
                        ? `إجمالي المقبوض (${payments.length} دفعات):`
                        : 'الدفعة المقدمة (العربون):'}
                    </span>
                    <span className="font-mono">{formatCurrency(currentOrder.deposit, currency)}</span>
                  </div>

                  <div className="flex justify-between text-amber-900 font-bold bg-amber-100/70 p-2 rounded-lg mt-1 text-xs">
                    <span>المتبقي عند التركيب:</span>
                    <span className="font-mono text-sm">
                      {formatCurrency(currentOrder.remainingBalance, currency)}
                    </span>
                  </div>

                  {currentOrder.remainingBalance > 0 && (
                    <div className="no-print pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCollectingPayment(true)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>تحصيل دفعة من الزبون الآن</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Payments Breakdown Section (تفصيل الدفعات كل واحدة على حدة) */}
              {payments.length > 0 && (
                <div className="pt-5 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        تفصيل وسجل الدفعات المسددة ({payments.length} {payments.length === 1 ? 'دفعة' : 'دفعات'})
                      </h4>
                    </div>
                    {currentOrder.remainingBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCollectingPayment(true)}
                        className="no-print text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>تحصيل دفعة جديدة</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 text-center w-12 font-mono">#</th>
                          <th className="p-2.5">بيان وتفصيل الدفعة</th>
                          <th className="p-2.5 text-center">طريقة الدفع</th>
                          <th className="p-2.5 text-center">تاريخ السداد</th>
                          <th className="p-2.5 text-left font-mono">المبلغ المسدد</th>
                          <th className="p-2.5 text-left font-mono">المتبقي بعدها</th>
                          <th className="p-2.5 text-center w-12 no-print">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((pmt, idx) => (
                          <tr key={pmt.id} className="hover:bg-slate-50/60">
                            <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900">
                              {pmt.note || (idx === 0 ? 'الدفعة الأولى (العربون)' : `دفعة سداد #${idx + 1}`)}
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
                            <td className="p-2.5 text-center no-print">
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(pmt.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="حذف هذه الدفعة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-800">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right font-bold">
                            إجمالي المقبوض المسدد حتى الآن:
                          </td>
                          <td className="p-2.5 text-left font-mono text-emerald-700 text-sm">
                            {formatCurrency(currentOrder.deposit, currency)}
                          </td>
                          <td colSpan={2} className="p-2.5 text-left font-mono text-rose-600 text-xs">
                            المتبقي: {formatCurrency(currentOrder.remainingBalance, currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Signatures Section (Interactive on Mobile Screen + High Quality Print) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t-2 border-slate-200 text-xs">
                {/* 1. Workshop Signature */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 text-center flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      ختم وتوقيع إدارة الورشة:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {settings.ownerName || settings.workshopName}
                    </span>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center min-h-[70px]">
                    {currentOrder.workshopSignature ? (
                      <div className="relative group">
                        <img
                          src={currentOrder.workshopSignature}
                          alt="توقيع الورشة"
                          className="max-h-20 max-w-full object-contain mx-auto"
                        />
                        <div className="no-print mt-1 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSigningTarget('workshop')}
                            className="text-[10px] text-blue-600 hover:underline px-1 cursor-pointer"
                          >
                            إعادة التوقيع
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature('workshop')}
                            className="text-[10px] text-rose-600 hover:underline px-1 cursor-pointer"
                          >
                            مسح
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-1.5">
                        <div className="w-36 border-b border-dashed border-slate-400 my-2"></div>
                        <button
                          type="button"
                          onClick={() => setSigningTarget('workshop')}
                          className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5 text-blue-600" />
                          <span>توقيع الورشة باللمس ✍️</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    معتمد رسمياً
                  </div>
                </div>

                {/* 2. Customer Signature */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 text-center flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      توقيع وموافقة الزبون:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {currentOrder.customerName}
                    </span>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center min-h-[70px]">
                    {currentOrder.customerSignature ? (
                      <div className="relative group">
                        <img
                          src={currentOrder.customerSignature}
                          alt="توقيع الزبون"
                          className="max-h-20 max-w-full object-contain mx-auto"
                        />
                        <div className="no-print mt-1 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSigningTarget('customer')}
                            className="text-[10px] text-blue-600 hover:underline px-1 cursor-pointer"
                          >
                            إعادة التوقيع
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature('customer')}
                            className="text-[10px] text-rose-600 hover:underline px-1 cursor-pointer"
                          >
                            مسح
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-1.5">
                        <div className="w-36 border-b border-dashed border-slate-400 my-2"></div>
                        <button
                          type="button"
                          onClick={() => setSigningTarget('customer')}
                          className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 hover:border-blue-400 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5 text-blue-600" />
                          <span>توقيع الزبون من شاشة الموبايل ✍️</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    موافقة على القياسات والأسعار
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal for Touch Signing */}
      {signingTarget && (
        <SignaturePadModal
          isOpen={!!signingTarget}
          title={signingTarget === 'customer' ? 'توقيع الزبون على الفاتورة' : 'ختم وتوقيع إدارة الورشة'}
          signerName={signingTarget === 'customer' ? currentOrder.customerName : (settings.ownerName || settings.workshopName)}
          initialSignature={signingTarget === 'customer' ? currentOrder.customerSignature : currentOrder.workshopSignature}
          onSave={handleSaveSignature}
          onClose={() => setSigningTarget(null)}
        />
      )}

      {/* Advanced WhatsApp Sharing Modal */}
      {isShareModalOpen && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          title="مشاركة فاتورة البيع"
          subtitle={`فاتورة رقم: ${currentOrder.orderNumber} - الزبون: ${currentOrder.customerName}`}
          defaultPhone={currentOrder.customerPhone}
          messageText={messageText}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
      {/* Customer Payment Modal for Collecting Balance/Installments */}
      {isCollectingPayment && (
        <CustomerPaymentModal
          isOpen={isCollectingPayment}
          order={currentOrder}
          settings={settings}
          onClose={() => setIsCollectingPayment(false)}
          onConfirm={(collectedAmount, note) => {
            const existingPayments = getOrderPayments(currentOrder);
            const newDeposit = Math.min(
              currentOrder.finalSellingPrice,
              Number(((currentOrder.deposit || 0) + collectedAmount).toFixed(2))
            );
            const newRemaining = Math.max(
              0,
              Number((currentOrder.finalSellingPrice - newDeposit).toFixed(2))
            );

            const pmtRecord: OrderPaymentRecord = {
              id: 'pmt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              amount: collectedAmount,
              date: new Date().toISOString(),
              note: note || `دفعة سداد #${existingPayments.length + 1}`,
              paymentMethod: 'cash',
              remainingAfter: newRemaining,
            };

            const updatedPayments = [...existingPayments, pmtRecord];

            let updatedNotes = currentOrder.notes || '';
            if (note) {
              const dateStr = new Date(pmtRecord.date).toLocaleDateString('ar-EG');
              const noteEntry = `[تحصيل دفعة: +${collectedAmount} ${currency} (${note}) بتاريخ ${dateStr}]`;
              updatedNotes = updatedNotes ? `${updatedNotes}\n${noteEntry}` : noteEntry;
            }

            const updated: CustomerOrder = {
              ...currentOrder,
              deposit: newDeposit,
              remainingBalance: newRemaining,
              payments: updatedPayments,
              notes: updatedNotes,
              status: currentOrder.status,
            };
            setCurrentOrder(updated);
            if (onUpdateOrder) {
              onUpdateOrder(updated);
            }
            setIsCollectingPayment(false);
          }}
        />
      )}
    </>
  );
};
