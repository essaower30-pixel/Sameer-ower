import React from 'react';
import { CustomerOrder, WorkshopSettings, CATEGORY_LABELS } from '../types';
import { formatCurrency, generateWhatsAppMessage } from '../utils/calculator';
import { Printer, Share2, X, Wrench, CheckCircle } from 'lucide-react';

interface Props {
  order: CustomerOrder | null;
  settings: WorkshopSettings;
  currency: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<Props> = ({ order, settings, currency, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = generateWhatsAppMessage(order, settings.workshopName, currency);
    let phone = order.customerPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Actions Bar (hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">معاينة فاتورة البيع</span>
            <span className="text-xs text-slate-400 font-mono">({order.orderNumber})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / PDF</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-['Cairo',sans-serif]">
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
                  {order.status === 'quotation' ? 'عرض سعر مبدئي' : 'فاتورة بيع معتمدة'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-700">
                  رقم: {order.orderNumber}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  التاريخ: {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>

            {/* Customer Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">اسم الزبون:</span>
                <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">رقم الهاتف:</span>
                <span className="font-semibold text-slate-800 font-mono" dir="ltr">
                  {order.customerPhone || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">العنوان وموقع التركيب:</span>
                <span className="font-semibold text-slate-800">{order.customerAddress || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">موعد التركيب المتوقع:</span>
                <span className="font-semibold text-slate-800">{order.deliveryDate || 'حسب الاتفاق'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-2 border border-slate-700 w-8 text-center">#</th>
                    <th className="p-2 border border-slate-700">البيان</th>
                    <th className="p-2 border border-slate-700 text-center">المقاس (عرض×ارتفاع)</th>
                    <th className="p-2 border border-slate-700 text-center">العدد</th>
                    <th className="p-2 border border-slate-700 text-center">المساحة (م²)</th>
                    <th className="p-2 border border-slate-700 text-center">سعر المتر</th>
                    <th className="p-2 border border-slate-700 text-left">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                        <td className="p-2 border border-slate-200 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-slate-200">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {(item.additionalPrice > 0 || item.additionalName) && (
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
                        <td className="p-2 border border-slate-200 text-center font-mono text-slate-700 whitespace-nowrap">
                          {item.width} × {item.height} {item.unit === 'cm' ? 'سم' : 'م'}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                          {item.quantity}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-mono">
                          {item.totalArea} م²
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
                {order.notes && (
                  <p className="text-amber-800 pt-1 border-t border-slate-200 font-medium">
                    ملاحظات فاتورة البيع: {order.notes}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الإجمالي:</span>
                  <span className="font-bold font-mono text-slate-800">
                    {formatCurrency(order.subtotal, currency)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>خصم خاص:</span>
                    <span className="font-bold font-mono">
                      -{formatCurrency(order.discount, currency)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-300 text-sm">
                  <span>الصافي المطلوب:</span>
                  <span className="font-mono text-blue-700">
                    {formatCurrency(order.finalSellingPrice, currency)}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                  <span>الدفعة المقدمة (العربون):</span>
                  <span className="font-mono">{formatCurrency(order.deposit, currency)}</span>
                </div>

                <div className="flex justify-between text-amber-900 font-bold bg-amber-100/70 p-2 rounded-lg mt-1 text-xs">
                  <span>المتبقي عند التركيب:</span>
                  <span className="font-mono text-sm">
                    {formatCurrency(order.remainingBalance, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
              <div className="text-center space-y-10">
                <span className="font-bold text-slate-700 block">ختم وتوقيع الورشة:</span>
                <div className="w-36 mx-auto border-b border-dashed border-slate-400"></div>
              </div>
              <div className="text-center space-y-10">
                <span className="font-bold text-slate-700 block">توقيع وموافقة الزبون:</span>
                <div className="w-36 mx-auto border-b border-dashed border-slate-400"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
