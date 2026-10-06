import React from 'react';
import { CustomerOrder } from '../types';
import { formatCurrency } from '../utils/calculator';
import { Wallet, CheckCircle2, Clock, CircleDollarSign, ArrowUpRight, Lock } from 'lucide-react';

interface Props {
  orders: CustomerOrder[];
  currency: string;
  onNavigateToFinances?: () => void;
}

export const StatsCards: React.FC<Props> = ({ orders, currency, onNavigateToFinances }) => {
  const distinctCurrencies = Array.from(new Set(orders.map((o) => o.currency || currency)));
  const hasMultipleCurrencies = distinctCurrencies.length > 1;

  const totalSales = orders.reduce((sum, o) => sum + (o.finalSellingPrice || 0), 0);
  const totalRemaining = orders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);
  const totalCollected = orders.reduce((sum, o) => sum + (o.deposit || 0), 0);
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress' || o.status === 'ready').length;

  return (
    <div className="space-y-3 mb-6">
      {/* Top Cards (Safe for customer view: No costs or profits displayed here) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Sales */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">إجمالي قيمة الأعمال والطلبات</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight font-mono">
            {hasMultipleCurrencies ? (
              <div className="space-y-0.5">
                {distinctCurrencies.map((c) => {
                  const s = orders.filter((o) => (o.currency || currency) === c).reduce((sum, o) => sum + (o.finalSellingPrice || 0), 0);
                  return (
                    <div key={c} className="text-base sm:text-lg font-black text-slate-900">
                      {formatCurrency(s, c)}
                    </div>
                  );
                })}
              </div>
            ) : (
              formatCurrency(totalSales, currency)
            )}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500 gap-1.5">
            <span>إجمالي {orders.length} فاتورة بيع مسجلة</span>
          </div>
        </div>

        {/* Collected Deposits */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">العربونات والدفعات المستلمة</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight font-mono">
            {hasMultipleCurrencies ? (
              <div className="space-y-0.5">
                {distinctCurrencies.map((c) => {
                  const dep = orders.filter((o) => (o.currency || currency) === c).reduce((sum, o) => sum + (o.deposit || 0), 0);
                  return (
                    <div key={c} className="text-base sm:text-lg font-black text-emerald-600">
                      {formatCurrency(dep, c)}
                    </div>
                  );
                })}
              </div>
            ) : (
              formatCurrency(totalCollected, currency)
            )}
          </div>
          <div className="mt-1 flex items-center text-xs text-emerald-700 font-medium gap-1">
            <span>تم قبضها كدفعات أولى وعربونات</span>
          </div>
        </div>

        {/* Remaining Collections */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">مبالغ متبقية للتحصيل</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 tracking-tight font-mono">
            {hasMultipleCurrencies ? (
              <div className="space-y-0.5">
                {distinctCurrencies.map((c) => {
                  const rem = orders.filter((o) => (o.currency || currency) === c).reduce((sum, o) => sum + (o.remainingBalance || 0), 0);
                  return (
                    <div key={c} className="text-base sm:text-lg font-black text-amber-600">
                      {formatCurrency(rem, c)}
                    </div>
                  );
                })}
              </div>
            ) : (
              formatCurrency(totalRemaining, currency)
            )}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500 gap-1">
            <span>تُستحق عند التسليم والتركيب</span>
          </div>
        </div>

        {/* Orders Status Count */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">حالة التنفيذ بالورشة</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 font-mono">{inProgressOrders}</span>
            <span className="text-xs text-slate-500">طلب قيد التصنيع والتركيب</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span className="text-emerald-600 font-medium">
              {completedOrders} تم التسليم بنجاح
            </span>
          </div>
        </div>
      </div>

      {/* Discrete Private Access link for Craftsman */}
      {onNavigateToFinances && (
        <div className="bg-slate-900 text-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-400/20 text-amber-400 rounded">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <span>
              التكاليف وصافي الأرباح وميزانية الورشة محفوظة في صفحة خاصة ومحمية عن أنظار الزبائن.
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToFinances}
            className="flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors mr-2"
          >
            <span>فتح حسابات الأرباح والميزانية</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
