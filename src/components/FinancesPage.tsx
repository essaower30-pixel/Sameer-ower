import React, { useState } from 'react';
import {
  CustomerOrder,
  WorkshopSettings,
  WorkshopExpense,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  ProductCategory,
  CATEGORY_LABELS,
  SupplierPurchaseInvoice,
} from '../types';
import { formatCurrency } from '../utils/calculator';
import {
  TrendingUp,
  Wallet,
  Building,
  Users,
  Wrench,
  Truck,
  Receipt,
  Plus,
  Trash2,
  PieChart,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  CircleDollarSign,
  Clock,
  Scale,
  DollarSign,
} from 'lucide-react';

interface Props {
  orders: CustomerOrder[];
  expenses: WorkshopExpense[];
  purchaseInvoices?: SupplierPurchaseInvoice[];
  settings: WorkshopSettings;
  currency: string;
  onAddExpense: (expense: Omit<WorkshopExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

type FinanceViewTab = 'overview' | 'sales_report' | 'purchases_report' | 'profit_loss' | 'expenses';

export const FinancesPage: React.FC<Props> = ({
  orders,
  expenses,
  purchaseInvoices = [],
  settings,
  currency,
  onAddExpense,
  onDeleteExpense,
}) => {
  // Active report tab
  const [activeTab, setActiveTab] = useState<FinanceViewTab>('overview');

  // Privacy mask toggle (in case someone is standing nearby)
  const [isMasked, setIsMasked] = useState(false);

  // New expense form inline
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('rent');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');

  // 1. Sales Calculations (فواتير البيع للزبائن)
  const totalSales = orders.reduce((sum, o) => sum + (o.finalSellingPrice || 0), 0);
  const totalDeposits = orders.reduce((sum, o) => sum + (o.deposit || 0), 0);
  const totalReceivables = orders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress' || o.status === 'ready').length;
  const quotationOrders = orders.filter((o) => o.status === 'quotation').length;

  // 2. Purchases Calculations (فواتير الشراء للموردين)
  const totalPurchases = purchaseInvoices.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPaidToSuppliers = purchaseInvoices.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalPayablesToSuppliers = purchaseInvoices.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
  const supplierPaymentRatio = totalPurchases > 0 ? Math.round((totalPaidToSuppliers / totalPurchases) * 100) : 100;

  // 3. Profit & Loss Calculations (الأرباح والخسائر)
  const totalDirectCost = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  // Real material purchase baseline (uses purchase invoices if available, fallback to direct item cost)
  const effectiveMaterialCost = totalPurchases > 0 ? totalPurchases : totalDirectCost;
  const grossProfit = totalSales - effectiveMaterialCost;
  const grossMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '0';

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netRealProfit = grossProfit - totalExpenses;
  const netRealMargin = totalSales > 0 ? ((netRealProfit / totalSales) * 100).toFixed(1) : '0';

  // 4. Net Working Capital & Liquidity (الميزانية وصافي السيولة)
  const netCashFlow = totalDeposits - totalPaidToSuppliers - totalExpenses;
  const netWorkshopAssets = totalDeposits + totalReceivables - totalPayablesToSuppliers;

  // 5. Category breakdown
  const categoryStats: Record<
    ProductCategory,
    { sales: number; cost: number; profit: number; area: number; count: number }
  > = {
    aluminum: { sales: 0, cost: 0, profit: 0, area: 0, count: 0 },
    accordion: { sales: 0, cost: 0, profit: 0, area: 0, count: 0 },
    zebra: { sales: 0, cost: 0, profit: 0, area: 0, count: 0 },
    shutters: { sales: 0, cost: 0, profit: 0, area: 0, count: 0 },
  };

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (categoryStats[item.category]) {
        categoryStats[item.category].sales += item.totalPrice;
        categoryStats[item.category].cost += item.totalCost;
        categoryStats[item.category].profit += item.profit;
        categoryStats[item.category].area += item.totalArea;
        categoryStats[item.category].count += item.quantity;
      }
    });
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || Number(expenseAmount) <= 0) {
      alert('يرجى كتابة بيان المصروف والمبلغ بشكل صحيح.');
      return;
    }

    onAddExpense({
      title: expenseTitle.trim(),
      amount: Number(expenseAmount),
      category: expenseCategory,
      date: expenseDate,
      notes: expenseNotes.trim(),
    });

    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNotes('');
    setIsAddingExpense(false);
  };

  const maskValue = (val: string) => (isMasked ? '••••••' : val);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-amber-400/20 text-amber-400 rounded-lg">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              تقارير الأرباح والخسائر والميزانية التشغيلية (خاصة بالمعلم)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            التقارير المالية: فواتير البيع والشراء والأرباح والميزانية
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            تجميع شامل ودقيق لكافة تقارير فواتير البيع للزبائن، تقارير فواتير الشراء من الموردين،
            قائمة الأرباح والخسائر الفعلية، وميزانية السيولة النقدية للورشة.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMasked(!isMasked)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            title={isMasked ? 'إظهار الأرقام' : 'إخفاء وتمويه الأرقام'}
          >
            {isMasked ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span>{isMasked ? 'إظهار الأرقام' : 'تمويه الأرقام'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير المالي</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs for Financial Reports */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>الميزانية والمركز المالي الشامل</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales_report')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'sales_report'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>تقارير فواتير البيع للزبائن ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('purchases_report')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'purchases_report'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4 text-amber-400" />
          <span>تقارير فواتير الشراء للموردين ({purchaseInvoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profit_loss')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'profit_loss'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>قائمة الأرباح والخسائر (P&L)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4 text-purple-400" />
          <span>المصاريف التشغيلية ({expenses.length})</span>
        </button>
      </div>

      {/* SECTION 1: REPORT OF SALES INVOICES (تقارير فواتير البيع - تم نقلها من صفحة الزبائن) */}
      {(activeTab === 'overview' || activeTab === 'sales_report') && (
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CircleDollarSign className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تقرير فواتير البيع ومبيعات الزبائن
                </h3>
                <span className="text-xs text-slate-500">
                  متابعة الإيرادات، العربونات المقبوضة، والمبالغ المتبقية للتحصيل
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              إجمالي {orders.length} فاتورة بيع
            </span>
          </div>

          {/* The 4 Sales Report Cards (from screenshot 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* 1. Total Sales Value */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">إجمالي قيمة الأعمال والطلبات</span>
                <div className="p-2 bg-blue-100/80 rounded-lg text-blue-700">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {maskValue(formatCurrency(totalSales, currency))}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                إجمالي {orders.length} فاتورة بيع مسجلة
              </div>
            </div>

            {/* 2. Collected Deposits */}
            <div className="bg-emerald-50/50 rounded-xl border border-emerald-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900">العربونات والدفعات المستلمة</span>
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
                {maskValue(formatCurrency(totalDeposits, currency))}
              </div>
              <div className="mt-1 text-xs text-emerald-800 font-medium">
                تم قبضها كدفعات أولى وعربونات
              </div>
            </div>

            {/* 3. Remaining Collections (Receivables) */}
            <div className="bg-amber-50/50 rounded-xl border border-amber-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900">مبالغ متبقية للتحصيل</span>
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-700 tracking-tight font-mono">
                {maskValue(formatCurrency(totalReceivables, currency))}
              </div>
              <div className="mt-1 text-xs text-amber-800 font-medium">
                تُستحق عند التسليم والتركيب
              </div>
            </div>

            {/* 4. Orders Execution Status */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">حالة التنفيذ بالورشة</span>
                <div className="p-2 bg-indigo-100/80 rounded-lg text-indigo-700">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 font-mono">{inProgressOrders}</span>
                <span className="text-xs text-slate-500 font-semibold">طلب قيد التصنيع والتركيب</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                <span className="text-emerald-700 font-semibold">
                  {completedOrders} تم التسليم بنجاح
                </span>
                {quotationOrders > 0 && (
                  <span className="text-slate-400">({quotationOrders} عرض سعر)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: REPORT OF PURCHASE INVOICES (تقارير فواتير الشراء - تم نقلها من صفحة الموردين) */}
      {(activeTab === 'overview' || activeTab === 'purchases_report') && (
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تقرير فواتير الشراء ومشتريات الموردين
                </h3>
                <span className="text-xs text-slate-500">
                  متابعة تكلفة الخامات، المبالغ المسددة، والذمم الدائنة المتبقية للمصانع
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              إجمالي {purchaseInvoices.length} فاتورة شراء
            </span>
          </div>

          {/* The 3 Purchases Report Cards (from screenshot 2) + Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* 1. Total Purchases */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">إجمالي فواتير الشراء</span>
                <div className="p-2 bg-amber-100/80 rounded-lg text-amber-700">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {maskValue(formatCurrency(totalPurchases, currency))}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {purchaseInvoices.length} فاتورة مسجلة
              </div>
            </div>

            {/* 2. Total Paid to Suppliers */}
            <div className="bg-emerald-50/50 rounded-xl border border-emerald-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900">المدفوع للموردين (نقداً وبنك)</span>
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {maskValue(formatCurrency(totalPaidToSuppliers, currency))}
              </div>
              <div className="mt-1 text-xs text-emerald-800 font-medium">
                سداد الخامات والمستلزمات
              </div>
            </div>

            {/* 3. Remaining Payables to Suppliers */}
            <div className="bg-rose-50/50 rounded-xl border border-rose-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-900">المتبقي للموردين (ذمم دائنة)</span>
                <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {maskValue(formatCurrency(totalPayablesToSuppliers, currency))}
              </div>
              <div className="mt-1 text-xs text-rose-800 font-medium">
                مطلوب سدادها للمصانع
              </div>
            </div>

            {/* 4. Payment Rate */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">نسبة سداد الموردين</span>
                <div className="p-2 bg-blue-100/80 rounded-lg text-blue-700">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono">
                %{supplierPaymentRatio}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {totalPayablesToSuppliers === 0 ? 'تم سداد الموردين بالكامل' : 'يوجد دفعات جارية ومؤجلة'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PROFIT & LOSS REPORT (قائمة الأرباح والخسائر الشاملة) */}
      {(activeTab === 'overview' || activeTab === 'profit_loss') && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  قائمة الأرباح والخسائر الشاملة (P&L)
                </h3>
                <span className="text-xs text-slate-500">
                  المبيعات - تكلفة المشتريات = مجمل الربح - مصاريف الورشة = صافي الربح الحقيقي
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              هامش صافي الربح: +{netRealMargin}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue */}
            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-900 block mb-1">
                1. إجمالي المبيعات (فواتير البيع)
              </span>
              <div className="text-2xl font-black text-blue-950 font-mono">
                {maskValue(formatCurrency(totalSales, currency))}
              </div>
              <span className="text-[11px] text-blue-700 mt-1 block">
                {orders.length} طلبات معتمدة
              </span>
            </div>

            {/* Direct Cost / Purchases */}
            <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-200">
              <span className="text-xs font-bold text-rose-900 block mb-1">
                2. تكلفة المواد والخامات المشتراة
              </span>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {maskValue(formatCurrency(effectiveMaterialCost, currency))}
              </div>
              <span className="text-[11px] text-rose-700 mt-1 block">
                {totalPurchases > 0 ? `فواتير شراء الموردين (${purchaseInvoices.length})` : 'تكلفة المواد المباشرة'}
              </span>
            </div>

            {/* Operating Overhead Expenses */}
            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900 block mb-1">
                3. مصاريف الورشة والنثريات
              </span>
              <div className="text-2xl font-black text-amber-800 font-mono">
                {maskValue(formatCurrency(totalExpenses, currency))}
              </div>
              <span className="text-[11px] text-amber-700 mt-1 block">
                إيجارات، أجور، نقل، صيانة ({expenses.length} بنود)
              </span>
            </div>

            {/* Real Net Profit */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-xs">
              <span className="text-xs font-bold text-emerald-100 block mb-1">
                4. صافي ربح الورشة الفعلي
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {maskValue(formatCurrency(netRealProfit, currency))}
              </div>
              <span className="text-[11px] text-emerald-100 mt-1 block font-medium">
                هامش صافي الربح الفعلي: +{netRealMargin}%
              </span>
            </div>
          </div>

          {/* Visual Profit Formula Step Banner */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
            <div className="text-slate-700">
              <span className="text-slate-500 font-sans ml-1">المعادلة المحاسبية:</span>
              <span className="font-bold text-blue-900">{formatCurrency(totalSales, currency)}</span> (مبيعات)
              {' - '}
              <span className="font-bold text-rose-700">{formatCurrency(effectiveMaterialCost, currency)}</span> (مشتريات)
              {' = '}
              <span className="font-bold text-emerald-700">{formatCurrency(grossProfit, currency)}</span> (مجمل ربح)
              {' - '}
              <span className="font-bold text-amber-700">{formatCurrency(totalExpenses, currency)}</span> (مصاريف)
              {' = '}
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                {formatCurrency(netRealProfit, currency)} (صافي الربح)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: BALANCE SHEET & CASH FLOW (الميزانية والسيولة النقدية) */}
      {(activeTab === 'overview') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Scale className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تقرير الميزانية والسيولة النقدية والمركز المالي
                </h3>
                <span className="text-xs text-slate-500">
                  الأصول المتداولة (النقد والديون على الزبائن) مقابل الالتزامات (الديون للموردين)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-600 block">
                السيولة النقدية المحصلة بالصندوق (عربونات ودفعات)
              </span>
              <div className="text-2xl font-bold text-emerald-600 font-mono">
                {maskValue(formatCurrency(totalDeposits, currency))}
              </div>
              <p className="text-[11px] text-slate-500">
                مبالغ دخلت الصندوق وحسابات البنك من الزبائن
              </p>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-600 block">
                الذمم المدينة على الزبائن (أصول متداولة للتحصيل)
              </span>
              <div className="text-2xl font-bold text-blue-600 font-mono">
                {maskValue(formatCurrency(totalReceivables, currency))}
              </div>
              <p className="text-[11px] text-slate-500">
                متبقي مستحق للورشة على الزبائن عند التسليم والتركيب
              </p>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-600 block">
                الذمم الدائنة للموردين (التزامات وخصوم متداولة)
              </span>
              <div className="text-2xl font-bold text-rose-600 font-mono">
                {maskValue(formatCurrency(totalPayablesToSuppliers, currency))}
              </div>
              <p className="text-[11px] text-slate-500">
                مطلوب سداده للمصانع وموردي الخامات
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: CATEGORY MATRIX (مصفوفة أرباح الأصناف) */}
      {(activeTab === 'overview' || activeTab === 'sales_report') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                <span>تحليل الأرباح ومبيعات الأصناف (أي الأقسام أكثر ربحية للورشة؟)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مقارنة مبيعات وتكلفة وأرباح الألمنيوم، الأكرديون، الزيبرا، والأباجورات
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['aluminum', 'accordion', 'zebra', 'shutters'] as ProductCategory[]).map((cat) => {
              const stats = categoryStats[cat];
              const margin = stats.sales > 0 ? ((stats.profit / stats.sales) * 100).toFixed(0) : '0';

              const borderColors = {
                aluminum: 'border-blue-200 bg-blue-50/30',
                accordion: 'border-amber-200 bg-amber-50/30',
                zebra: 'border-emerald-200 bg-emerald-50/30',
                shutters: 'border-purple-200 bg-purple-50/30',
              }[cat];

              return (
                <div key={cat} className={`p-4 rounded-xl border ${borderColors} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">
                      {CATEGORY_LABELS[cat].title}
                    </span>
                    <span className="text-xs font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      {stats.count} قطع
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>إجمالي المبيعات:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {maskValue(formatCurrency(stats.sales, currency))}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>تكلفة المواد:</span>
                      <span className="font-mono font-bold">
                        {maskValue(formatCurrency(stats.cost, currency))}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-800 pt-1.5 border-t border-slate-200/80 font-bold">
                      <span>صافي الربح:</span>
                      <span className="font-mono">
                        {maskValue(formatCurrency(stats.profit, currency))}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>هامش الربح:</span>
                      <span className="font-mono font-bold text-emerald-600">+{margin}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 6: WORKSHOP EXPENSES TABLE (سجل المصروفات والنثريات) */}
      {(activeTab === 'overview' || activeTab === 'expenses') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <span>سجل مصاريف وتشغيل الورشة (الإيجار، أجور العمال، النقل، الصيانة)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تُخصم هذه المصاريف مباشرة من الأرباح الإجمالية لحساب الربح الصافي الحقيقي للورشة
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{isAddingExpense ? 'إلغاء' : 'تسجيل مصروف جديد'}</span>
            </button>
          </div>

          {/* Add Expense Form */}
          {isAddingExpense && (
            <form
              onSubmit={handleExpenseSubmit}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in"
            >
              <h4 className="text-xs font-bold text-slate-800">بيانات المصروف الجديد:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    بيان المصروف (السبب):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: دفعة أسبوعية لصنايعي، شفرات قص، بنزين سيارة..."
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    المبلغ ({currency}):
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.1"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    نوع المصروف:
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    تاريخ الصرف:
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ملاحظات إضافية (اختياري):
                  </label>
                  <input
                    type="text"
                    placeholder="ملاحظات توضيحية..."
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    حفظ المصروف
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Expenses List Table */}
          {expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-bold">التاريخ</th>
                    <th className="p-2.5 font-bold">بيان المصروف</th>
                    <th className="p-2.5 font-bold">التصنيف</th>
                    <th className="p-2.5 font-bold">المبلغ ({currency})</th>
                    <th className="p-2.5 font-bold">ملاحظات</th>
                    <th className="p-2.5 font-bold text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">{exp.date}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{exp.title}</td>
                      <td className="p-2.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {EXPENSE_CATEGORIES[exp.category]?.label || exp.category}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold font-mono text-amber-700">
                        {maskValue(formatCurrency(exp.amount, currency))}
                      </td>
                      <td className="p-2.5 text-slate-500 max-w-xs truncate">{exp.notes || '-'}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">
              لم يتم تسجيل أي مصاريف تشغيلية حتى الآن.
            </p>
          )}
        </div>
      )}

      {/* SECTION 7: ORDERS PROFIT BREAKDOWN TABLE (جدول أرباح فواتير البيع بالتفصيل) */}
      {(activeTab === 'overview' || activeTab === 'sales_report' || activeTab === 'profit_loss') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>سجل ربحية وتكاليف فواتير البيع (خاص بالمعلم)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تفاصيل سعر البيع وتكلفة المواد وصافي الربح ونسبته لكل فاتورة بيع مسجلة
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-bold">رقم الفاتورة</th>
                  <th className="p-2.5 font-bold">اسم الزبون</th>
                  <th className="p-2.5 font-bold">العدد</th>
                  <th className="p-2.5 font-bold">سعر البيع النهائي</th>
                  <th className="p-2.5 font-bold text-rose-700">تكلفة المواد</th>
                  <th className="p-2.5 font-bold text-emerald-700">صافي الربح</th>
                  <th className="p-2.5 font-bold">نسبة الربح</th>
                  <th className="p-2.5 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const margin =
                    order.finalSellingPrice > 0
                      ? ((order.netProfit / order.finalSellingPrice) * 100).toFixed(0)
                      : '0';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-mono font-bold text-slate-500">{order.orderNumber}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{order.customerName}</td>
                      <td className="p-2.5 text-slate-600">{order.items.length} بنود</td>
                      <td className="p-2.5 font-bold font-mono text-slate-900">
                        {maskValue(formatCurrency(order.finalSellingPrice, currency))}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-rose-600 bg-rose-50/30">
                        {maskValue(formatCurrency(order.totalCost, currency))}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-emerald-600 bg-emerald-50/30">
                        {maskValue(formatCurrency(order.netProfit, currency))}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-emerald-700">+{margin}%</td>
                      <td className="p-2.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {order.status === 'completed'
                            ? 'مسلّم ومحصل'
                            : order.status === 'in_progress'
                            ? 'قيد التصنيع'
                            : order.status === 'ready'
                            ? 'جاهز للتركيب'
                            : order.status === 'quotation'
                            ? 'عرض سعر'
                            : 'ملغي'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
