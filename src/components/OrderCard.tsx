import React, { useState } from 'react';
import { CustomerOrder, OrderStatus, STATUS_LABELS } from '../types';
import { formatCurrency, generateWhatsAppMessage, getOrderPayments } from '../utils/calculator';
import { CategoryBadge } from './CategoryBadge';
import {
  Phone,
  MapPin,
  Calendar,
  Printer,
  Edit,
  Trash2,
  Share2,
  TrendingUp,
  Wallet,
  Clock,
  ArrowUpRight,
  Eye,
  EyeOff,
  Lock,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { generateCustomerInvoiceText } from '../utils/shareUtils';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface Props {
  order: CustomerOrder;
  currency: string;
  workshopName: string;
  onEdit: (order: CustomerOrder) => void;
  onDelete: (orderId: string) => void;
  onViewInvoice: (order: CustomerOrder) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onQuickCollect?: (order: CustomerOrder) => void;
}

export const OrderCard: React.FC<Props> = ({
  order,
  currency: defaultCurrency,
  workshopName,
  onEdit,
  onDelete,
  onViewInvoice,
  onStatusChange,
  onQuickCollect,
}) => {
  const currency = order.currency || defaultCurrency;
  const statusInfo = STATUS_LABELS[order.status];
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showPaymentsBreakdown, setShowPaymentsBreakdown] = useState(false);

  const payments = getOrderPayments(order);

  // Group items count by category
  const categoriesCount = order.items.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const invoiceText = generateCustomerInvoiceText(order, workshopName, currency);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded">
                فاتورة بيع #{order.orderNumber}
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  currency === '$'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : currency === 'ل.س'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
                title="عملة هذه الفاتورة"
              >
                <span>{currency === '$' ? '💵 دولار ($)' : currency === 'ل.س' ? '🇸🇾 ليرة (ل.س)' : currency}</span>
              </span>
              <span className="text-xs text-slate-400">
                {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {(order.customerSignature || order.workshopSignature) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1" title="موقعة ومعتمدة باللمس على الشاشة">
                  <span>موقّعة ✍️</span>
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {order.customerName || 'زبون بدون اسم'}
            </h3>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border appearance-none cursor-pointer focus:outline-hidden pr-2 pl-6 ${statusInfo.bg} ${statusInfo.color}`}
            >
              <option value="quotation">عرض سعر</option>
              <option value="in_progress">قيد التصنيع</option>
              <option value="ready">جاهز للتركيب</option>
              <option value="completed">تم التسليم والتحصيل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        {/* Customer Contact Details */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span dir="ltr">{order.customerPhone}</span>
            </a>
          )}
          {order.customerAddress && (
            <span className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[200px]">{order.customerAddress}</span>
            </span>
          )}
          {order.deliveryDate && (
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>موعد التركيب: {order.deliveryDate}</span>
            </span>
          )}
        </div>
      </div>

      {/* Items list preview */}
      <div className="p-4 sm:p-5 bg-slate-50/50 flex-1">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(categoriesCount).map(([category, count]) => (
            <div key={category} className="flex items-center gap-1">
              <CategoryBadge category={category as any} size="sm" />
              <span className="text-xs font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ×{count}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Item Rows (compact) */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {order.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="text-xs flex items-center justify-between py-1 px-2 rounded bg-white border border-slate-100 text-slate-700"
            >
              <div className="truncate max-w-[190px]">
                <span className="font-medium block truncate">
                  {item.quantity > 1 ? `(${item.quantity}×) ` : ''}
                  {item.name}
                </span>
                {(item.additionalPrice > 0 || item.additionalName) && (
                  <span className="block text-[10px] text-amber-700 font-semibold truncate">
                    + {item.additionalName || 'إضافة مسكة/قفل'} (+{formatCurrency(item.additionalPrice * item.quantity, currency)})
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-[11px] font-mono whitespace-nowrap">
                {item.width}×{item.height} {item.unit === 'cm' ? 'سم' : 'م'} ({item.totalArea}م²)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Overview */}
      <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Selling Price */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">سعر البيع النهائي</span>
            <span className="text-base font-bold text-slate-900">
              {formatCurrency(order.finalSellingPrice, currency)}
            </span>
          </div>

          {/* Remaining Balance */}
          <div
            className={`p-2.5 rounded-lg border ${
              order.remainingBalance > 0
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <span className="text-[11px] font-medium block">
              {order.remainingBalance > 0 ? 'المتبقي للتحصيل' : 'مدفوع بالكامل'}
            </span>
            <span className="text-base font-bold">
              {formatCurrency(order.remainingBalance, currency)}
            </span>
          </div>
        </div>

        {/* Payment Summary & Collect Button */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>
              {payments.length > 1 ? 'المقبوض:' : 'العربون / المقبوض:'}{' '}
              <strong className="text-emerald-700 font-mono">{formatCurrency(order.deposit || 0, currency)}</strong>
            </span>
            {payments.length > 1 && (
              <button
                type="button"
                onClick={() => setShowPaymentsBreakdown(!showPaymentsBreakdown)}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
                title="عرض تفصيل الدفعات"
              >
                <Receipt className="w-2.5 h-2.5" />
                <span>{payments.length} دفعات</span>
                {showPaymentsBreakdown ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
            )}
            {order.discount > 0 && (
              <span className="text-amber-700 text-[11px]">خصم: {formatCurrency(order.discount, currency)}</span>
            )}
          </div>

          {order.remainingBalance > 0 && onQuickCollect && (
            <button
              type="button"
              onClick={() => onQuickCollect(order)}
              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-xs shrink-0 cursor-pointer"
              title="تحصيل دفعة مالية من الزبون"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>تحصيل دفعة</span>
            </button>
          )}
        </div>

        {/* Detailed Payments Dropdown Preview on OrderCard */}
        {showPaymentsBreakdown && payments.length > 0 && (
          <div className="mb-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 animate-in fade-in">
            <div className="font-bold text-[11px] text-slate-700 mb-1 flex items-center justify-between border-b border-slate-200/60 pb-1">
              <span>تفصيل الدفعات المسددة ({payments.length} دفعات):</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700">
                إجمالي: {formatCurrency(order.deposit || 0, currency)}
              </span>
            </div>
            <div className="divide-y divide-slate-200/60 max-h-32 overflow-y-auto">
              {payments.map((p, idx) => (
                <div key={p.id} className="py-1 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 font-medium">{p.note || `دفعة #${idx + 1}`}</span>
                    <span className="text-slate-400 text-[10px]">
                      ({p.date ? new Date(p.date).toLocaleDateString('ar-EG') : '—'})
                    </span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-emerald-700 text-xs">+{formatCurrency(p.amount, currency)}</span>
                    {p.remainingAfter !== undefined && (
                      <span className="text-[9px] text-slate-400 block">متبقي: {formatCurrency(p.remainingAfter, currency)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            {order.remainingBalance > 0 && onQuickCollect && (
              <button
                onClick={() => onQuickCollect(order)}
                title="تحصيل دفعة مالية من الزبون"
                className="p-2 text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">تحصيل</span>
              </button>
            )}

            <button
              onClick={() => onViewInvoice(order)}
              title="عرض وطباعة الفاتورة"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              title="مشاركة الفاتورة عبر واتساب العادي أو الأعمال"
              className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(order)}
              title="تعديل فاتورة البيع"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">تعديل</span>
            </button>

            <button
              onClick={() => onDelete(order.id)}
              title="حذف الطلب"
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced WhatsApp Sharing Modal */}
      {isShareModalOpen && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          title="مشاركة فاتورة البيع"
          subtitle={`فاتورة #${order.orderNumber} - الزبون: ${order.customerName}`}
          defaultPhone={order.customerPhone}
          messageText={invoiceText}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};
