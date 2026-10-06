import React, { useState, useEffect } from 'react';
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
  Coins,
  ArrowLeftRight,
  Save,
} from 'lucide-react';

export type FinanceViewTab =
  | 'overview'
  | 'dual_currency'
  | 'sales_report'
  | 'purchases_report'
  | 'profit_loss'
  | 'expenses';

interface Props {
  orders: CustomerOrder[];
  expenses: WorkshopExpense[];
  purchaseInvoices?: SupplierPurchaseInvoice[];
  settings: WorkshopSettings;
  currency: string;
  onAddExpense: (expense: Omit<WorkshopExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onSaveSettings?: (settings: WorkshopSettings) => void;
  initialTab?: FinanceViewTab;
}

export const FinancesPage: React.FC<Props> = ({
  orders,
  expenses,
  purchaseInvoices = [],
  settings,
  currency,
  onAddExpense,
  onDeleteExpense,
  onSaveSettings,
  initialTab,
}) => {
  // Active report tab
  const [activeTab, setActiveTab] = useState<FinanceViewTab>(initialTab || 'profit_loss');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Privacy mask toggle (in case someone is standing nearby)
  const [isMasked, setIsMasked] = useState(false);

  // New expense form inline
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('rent');
  const [expenseCurrency, setExpenseCurrency] = useState<string>(currency || settings.currency || '$');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');

  // Dual Currency & Exchange Rate State
  const [exchangeRate, setExchangeRate] = useState<number>(settings.usdToSypRate || 14500);
  const [rateSavedNotice, setRateSavedNotice] = useState(false);
  const [combinedCurrencyUnit, setCombinedCurrencyUnit] = useState<'$' | 'ل.س'>('$');
  const [dualViewSubTab, setDualViewSubTab] = useState<'summary' | 'orders' | 'purchases' | 'expenses'>('summary');

  const handleSaveRateToSettings = () => {
    if (onSaveSettings) {
      onSaveSettings({ ...settings, usdToSypRate: exchangeRate });
      setRateSavedNotice(true);
      setTimeout(() => setRateSavedNotice(false), 3000);
    }
  };

  // Helper to determine the currency of each record
  const getOrderCurrency = (o: CustomerOrder) => o.currency || currency || settings.currency || '$';
  const getPurchaseCurrency = (p: SupplierPurchaseInvoice) => p.currency || currency || settings.currency || '$';
  const getExpenseCurrency = (e: WorkshopExpense) => e.currency || currency || settings.currency || '$';

  // ── USD ($) Calculations ──────────────────────────────────────
  const usdOrders = orders.filter((o) => getOrderCurrency(o) === '$');
  const usdPurchases = purchaseInvoices.filter((p) => getPurchaseCurrency(p) === '$');
  const usdExpenses = expenses.filter((e) => getExpenseCurrency(e) === '$');

  const usdSales = usdOrders.reduce((sum, o) => sum + (o.finalSellingPrice || 0), 0);
  const usdDeposits = usdOrders.reduce((sum, o) => sum + (o.deposit || 0), 0);
  const usdReceivables = usdOrders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);
  const usdPurchasesTotal = usdPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const usdPaidToSuppliers = usdPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const usdPayablesToSuppliers = usdPurchases.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
  const usdExpensesTotal = usdExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const usdDirectCost = usdOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const usdEffectiveCost = usdPurchasesTotal > 0 ? usdPurchasesTotal : usdDirectCost;
  const usdGrossProfit = usdSales - usdEffectiveCost;
  const usdNetProfit = usdGrossProfit - usdExpensesTotal;

  // ── SYP (ل.س) Calculations ────────────────────────────────────
  const sypOrders = orders.filter((o) => getOrderCurrency(o) === 'ل.س');
  const sypPurchases = purchaseInvoices.filter((p) => getPurchaseCurrency(p) === 'ل.س');
  const sypExpenses = expenses.filter((e) => getExpenseCurrency(e) === 'ل.س');

  const sypSales = sypOrders.reduce((sum, o) => sum + (o.finalSellingPrice || 0), 0);
  const sypDeposits = sypOrders.reduce((sum, o) => sum + (o.deposit || 0), 0);
  const sypReceivables = sypOrders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);
  const sypPurchasesTotal = sypPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const sypPaidToSuppliers = sypPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const sypPayablesToSuppliers = sypPurchases.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
  const sypExpensesTotal = sypExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const sypDirectCost = sypOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const sypEffectiveCost = sypPurchasesTotal > 0 ? sypPurchasesTotal : sypDirectCost;
  const sypGrossProfit = sypSales - sypEffectiveCost;
  const sypNetProfit = sypGrossProfit - sypExpensesTotal;

  // ── Combined Conversion Calculations (وفق سعر الصرف) ───────────
  const rate = Math.max(1, exchangeRate || 14500);

  // Unified in USD ($):
  const combinedSalesUSD = usdSales + (sypSales / rate);
  const combinedCostUSD = usdEffectiveCost + (sypEffectiveCost / rate);
  const combinedPurchasesInUSD = usdPurchasesTotal + (sypPurchasesTotal / rate);
  const combinedExpensesUSD = usdExpensesTotal + (sypExpensesTotal / rate);
  const combinedNetProfitUSD = usdNetProfit + (sypNetProfit / rate);
  const combinedReceivablesUSD = usdReceivables + (sypReceivables / rate);
  const combinedPayablesUSD = usdPayablesToSuppliers + (sypPayablesToSuppliers / rate);

  // Unified in SYP (ل.س):
  const combinedSalesSYP = sypSales + (usdSales * rate);
  const combinedCostSYP = sypEffectiveCost + (usdEffectiveCost * rate);
  const combinedPurchasesInSYP = sypPurchasesTotal + (usdPurchasesTotal * rate);
  const combinedExpensesSYP = sypExpensesTotal + (usdExpensesTotal * rate);
  const combinedNetProfitSYP = sypNetProfit + (usdNetProfit * rate);
  const combinedReceivablesSYP = sypReceivables + (usdReceivables * rate);
  const combinedPayablesSYP = sypPayablesToSuppliers + (usdPayablesToSuppliers * rate);

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
      currency: expenseCurrency,
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
        {/* 1. Profit & Loss Tab */}
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

        {/* 2. Dual Currency Report Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('dual_currency')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'dual_currency'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/70'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-600" />
          <span>حسابات العملتين ($ ول.س) وسعر الصرف 💱</span>
        </button>

        {/* 3. Overall Balance & Financial Position */}
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

        {/* 4. Expenses Tab */}
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

        {/* 5. Sales Reports */}
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

        {/* 6. Purchase Reports */}
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
      </div>

      {/* ── OVERVIEW SNAPSHOT BANNER FOR DUAL CURRENCIES ── */}
      {activeTab === 'overview' && (usdSales > 0 || sypSales > 0 || usdPurchasesTotal > 0 || sypPurchasesTotal > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>نظام الحسابات المزدوج بالدولار الأمريكي ($) والليرة السورية (ل.س)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">1$ = {rate.toLocaleString()} ل.س</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                مبيعات الدولار: <strong className="font-mono text-emerald-700">{maskValue(formatCurrency(usdSales, '$'))}</strong> ({usdOrders.length} فاتورة) • مبيعات الليرة: <strong className="font-mono text-blue-700">{maskValue(formatCurrency(sypSales, 'ل.س'))}</strong> ({sypOrders.length} فاتورة)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('dual_currency')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>عرض التقرير المالي المزدوج الشامل 💱</span>
          </button>
        </div>
      )}

      {/* ── SECTION: DEDICATED DUAL CURRENCY & EXCHANGE RATE REPORT ── */}
      {activeTab === 'dual_currency' && (
        <div className="space-y-6">
          {/* Header & Exchange Rate Controls */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    تقرير الحسابات المزدوج: الدولار الأمريكي ($) والليرة السورية (ل.س)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    فصل تفصيلي للمبيعات والمشتريات والمصاريف والأرباح لكل عملة، مع المحصلة الإجمالية الموحدة وفق سعر الصرف.
                  </p>
                </div>
              </div>

              {/* Print Dual Statement */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير المزدوج</span>
              </button>
            </div>

            {/* Live Exchange Rate Setting Box */}
            <div className="p-4 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 rounded-xl border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                    <span>سعر صرف الدولار مقابل الليرة السورية اليوم:</span>
                  </span>
                  {rateSavedNotice && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md animate-in fade-in">
                      تم حفظ سعر الصرف كافتراضي ✅
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  تغيير هذا السعر يعيد حساب إجمالي الميزانية وصافي الأرباح الموحدة تلقائياً وفوراً.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center bg-white border border-amber-300 rounded-xl px-3 py-1.5 shadow-2xs font-mono">
                  <span className="text-xs font-bold text-amber-800 ml-2">1$ =</span>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value) || 1)}
                    className="w-24 text-sm font-black text-slate-900 focus:outline-hidden text-center bg-transparent"
                  />
                  <span className="text-xs font-bold text-amber-800 mr-2">ل.س</span>
                </div>

                {onSaveSettings && (
                  <button
                    type="button"
                    onClick={handleSaveRateToSettings}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                    title="حفظ هذا السعر في إعدادات الورشة بشكل دائم"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ كافتراضي</span>
                  </button>
                )}

                {/* Switch Combined Display Currency */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[11px] text-slate-500 px-1 font-medium">عرض الموحد:</span>
                  <button
                    type="button"
                    onClick={() => setCombinedCurrencyUnit('$')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      combinedCurrencyUnit === '$'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    بالدولار ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCombinedCurrencyUnit('ل.س')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      combinedCurrencyUnit === 'ل.س'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    بالليرة (ل.س)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Side-by-Side Dual Currency Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ── USD ($) Card ── */}
            <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-xs overflow-hidden flex flex-col justify-between">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs font-mono">
                    $
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      حسابات الدولار الأمريكي ($)
                    </h4>
                    <span className="text-xs text-emerald-800">
                      إجمالي {usdOrders.length} فاتورة بيع • {usdPurchases.length} فاتورة مشتريات
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs font-mono border border-emerald-300">
                  USD ($)
                </span>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-0.5">مبيعات الزبائن ($):</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {maskValue(formatCurrency(usdSales, '$'))}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      المقبوض: <strong className="text-emerald-700 font-mono">{maskValue(formatCurrency(usdDeposits, '$'))}</strong>
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    <span className="text-amber-800 block mb-0.5">ديون متبقية على الزبائن ($):</span>
                    <span className="text-base font-bold font-mono text-amber-900">
                      {maskValue(formatCurrency(usdReceivables, '$'))}
                    </span>
                    <span className="text-[11px] text-amber-700 block mt-1">متبقي قيد التحصيل</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-0.5">مشتريات خامات ومواد ($):</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {maskValue(formatCurrency(usdPurchasesTotal, '$'))}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      المسدد للموردين: <strong className="text-emerald-700 font-mono">{maskValue(formatCurrency(usdPaidToSuppliers, '$'))}</strong>
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                    <span className="text-rose-800 block mb-0.5">ديون باقية للموردين ($):</span>
                    <span className="text-base font-bold font-mono text-rose-900">
                      {maskValue(formatCurrency(usdPayablesToSuppliers, '$'))}
                    </span>
                    <span className="text-[11px] text-rose-700 block mt-1">ذمم آجل مطلوب سدادها</span>
                  </div>
                </div>

                {/* Expenses in USD */}
                <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs">
                  <span className="text-purple-900 font-medium">المصاريف التشغيلية بالدولار:</span>
                  <span className="font-mono font-bold text-purple-900 text-sm">
                    {maskValue(formatCurrency(usdExpensesTotal, '$'))}
                  </span>
                </div>

                {/* Net Profit in USD */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">صافي أرباح الدولار (USD):</span>
                    <span className="text-[11px] text-emerald-700">المبيعات - تكلفة المواد - المصاريف</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700">
                    {maskValue(formatCurrency(usdNetProfit, '$'))}
                  </span>
                </div>
              </div>
            </div>

            {/* ── SYP (ل.س) Card ── */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-xs overflow-hidden flex flex-col justify-between">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs font-mono">
                    ل.س
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      حسابات الليرة السورية (ل.س)
                    </h4>
                    <span className="text-xs text-blue-800">
                      إجمالي {sypOrders.length} فاتورة بيع • {sypPurchases.length} فاتورة مشتريات
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs font-mono border border-blue-300">
                  SYP (ل.س)
                </span>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-0.5">مبيعات الزبائن (ل.س):</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {maskValue(formatCurrency(sypSales, 'ل.س'))}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      المقبوض: <strong className="text-emerald-700 font-mono">{maskValue(formatCurrency(sypDeposits, 'ل.س'))}</strong>
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    <span className="text-amber-800 block mb-0.5">ديون متبقية على الزبائن (ل.س):</span>
                    <span className="text-base font-bold font-mono text-amber-900">
                      {maskValue(formatCurrency(sypReceivables, 'ل.س'))}
                    </span>
                    <span className="text-[11px] text-amber-700 block mt-1">متبقي قيد التحصيل</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-0.5">مشتريات خامات ومواد (ل.س):</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {maskValue(formatCurrency(sypPurchasesTotal, 'ل.س'))}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      المسدد للموردين: <strong className="text-emerald-700 font-mono">{maskValue(formatCurrency(sypPaidToSuppliers, 'ل.س'))}</strong>
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                    <span className="text-rose-800 block mb-0.5">ديون باقية للموردين (ل.س):</span>
                    <span className="text-base font-bold font-mono text-rose-900">
                      {maskValue(formatCurrency(sypPayablesToSuppliers, 'ل.س'))}
                    </span>
                    <span className="text-[11px] text-rose-700 block mt-1">ذمم آجل مطلوب سدادها</span>
                  </div>
                </div>

                {/* Expenses in SYP */}
                <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs">
                  <span className="text-purple-900 font-medium">المصاريف التشغيلية بالليرة:</span>
                  <span className="font-mono font-bold text-purple-900 text-sm">
                    {maskValue(formatCurrency(sypExpensesTotal, 'ل.س'))}
                  </span>
                </div>

                {/* Net Profit in SYP */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-300 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">صافي أرباح الليرة (SYP):</span>
                    <span className="text-[11px] text-blue-700">المبيعات - تكلفة المواد - المصاريف</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-mono text-blue-700">
                    {maskValue(formatCurrency(sypNetProfit, 'ل.س'))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Combined Unified Summary Box (المحصلة الموحدة الشاملة) */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span>المحصلة المالية الموحدة للورشة ككل</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                      محولة {combinedCurrencyUnit === '$' ? 'بالدولار الأمريكي ($)' : 'بالليرة السورية (ل.س)'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تم دمج أرباح ومبيعات ومصاريف العملتين معاً وفق سعر الصرف (1$ = {rate.toLocaleString()} ل.س)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-bold bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setCombinedCurrencyUnit('$')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    combinedCurrencyUnit === '$' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-300'
                  }`}
                >
                  بالدولار ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCombinedCurrencyUnit('ل.س')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    combinedCurrencyUnit === 'ل.س' ? 'bg-blue-500 text-white font-black' : 'text-slate-300'
                  }`}
                >
                  بالليرة (ل.س)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Combined Sales */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                <span className="text-xs text-slate-400 block mb-1">إجمالي المبيعات الموحدة:</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  {maskValue(
                    formatCurrency(
                      combinedCurrencyUnit === '$' ? combinedSalesUSD : combinedSalesSYP,
                      combinedCurrencyUnit
                    )
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">مبيعات الزبائن مدمجة</span>
              </div>

              {/* Total Combined Cost */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                <span className="text-xs text-slate-400 block mb-1">إجمالي المشتريات والتكاليف:</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {maskValue(
                    formatCurrency(
                      combinedCurrencyUnit === '$' ? combinedCostUSD : combinedCostSYP,
                      combinedCurrencyUnit
                    )
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">خامات الألمنيوم والزجاج والشتر</span>
              </div>

              {/* Total Combined Expenses */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                <span className="text-xs text-slate-400 block mb-1">المصاريف التشغيلية الموحدة:</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-purple-400">
                  {maskValue(
                    formatCurrency(
                      combinedCurrencyUnit === '$' ? combinedExpensesUSD : combinedExpensesSYP,
                      combinedCurrencyUnit
                    )
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">رواتب، إيجار، عُدد ونثريات</span>
              </div>

              {/* Total Combined Net Profit */}
              <div className="bg-emerald-950/80 p-4 rounded-xl border-2 border-emerald-500/80 shadow-md">
                <span className="text-xs font-bold text-emerald-400 block mb-1">
                  صافي الربح الموحد النهائي:
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
                  {maskValue(
                    formatCurrency(
                      combinedCurrencyUnit === '$' ? combinedNetProfitUSD : combinedNetProfitSYP,
                      combinedCurrencyUnit
                    )
                  )}
                </span>
                <span className="text-[11px] text-emerald-400 block mt-1">
                  الربح الحقيقي بعد خصم كل شيء
                </span>
              </div>
            </div>

            {/* Receivables & Payables Combined Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">صافي ديون الزبائن للتحصيل (الموحدة):</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {maskValue(
                    formatCurrency(
                      combinedCurrencyUnit === '$' ? combinedReceivablesUSD : combinedReceivablesSYP,
                      combinedCurrencyUnit
                    )
                  )}
                </span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">صافي ديون الموردين للسداد (الموحدة):</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {maskValue(
                    formatCurrency(
                      combinedCurrencyUnit === '$' ? combinedPayablesUSD : combinedPayablesSYP,
                      combinedCurrencyUnit
                    )
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Detail Tables by Currency */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>سجل الفواتير والمعاملات المفصّل لكل عملة</span>
              </h4>

              <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDualViewSubTab('summary')}
                  className={`px-3 py-1 rounded-lg transition ${
                    dualViewSubTab === 'summary' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  مقارنة العملتين
                </button>
                <button
                  type="button"
                  onClick={() => setDualViewSubTab('orders')}
                  className={`px-3 py-1 rounded-lg transition ${
                    dualViewSubTab === 'orders' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  فواتير الزبائن (${usdOrders.length} / ل.س {sypOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDualViewSubTab('purchases')}
                  className={`px-3 py-1 rounded-lg transition ${
                    dualViewSubTab === 'purchases' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  الموردين (${usdPurchases.length} / ل.س {sypPurchases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDualViewSubTab('expenses')}
                  className={`px-3 py-1 rounded-lg transition ${
                    dualViewSubTab === 'expenses' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  المصاريف (${usdExpenses.length} / ل.س {sypExpenses.length})
                </button>
              </div>
            </div>

            {/* SubTab 1: Comparative Summary Table */}
            {dualViewSubTab === 'summary' && (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold">البند المالي</th>
                      <th className="p-3 font-bold text-emerald-800">حسابات الدولار ($)</th>
                      <th className="p-3 font-bold text-blue-800">حسابات الليرة السورية (ل.س)</th>
                      <th className="p-3 font-bold text-amber-900">المجموع الموحد ({combinedCurrencyUnit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">فواتير مبيعات الزبائن</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{formatCurrency(usdSales, '$')}</td>
                      <td className="p-3 font-mono font-bold text-blue-700">{formatCurrency(sypSales, 'ل.س')}</td>
                      <td className="p-3 font-mono font-black text-slate-900">
                        {formatCurrency(combinedCurrencyUnit === '$' ? combinedSalesUSD : combinedSalesSYP, combinedCurrencyUnit)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">المقبوضات والعربونات المستلمة</td>
                      <td className="p-3 font-mono text-emerald-700">{formatCurrency(usdDeposits, '$')}</td>
                      <td className="p-3 font-mono text-blue-700">{formatCurrency(sypDeposits, 'ل.س')}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {formatCurrency(combinedCurrencyUnit === '$' ? (usdDeposits + sypDeposits / rate) : (sypDeposits + usdDeposits * rate), combinedCurrencyUnit)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">المتبقي على الزبائن (ديون الورشة)</td>
                      <td className="p-3 font-mono text-amber-700">{formatCurrency(usdReceivables, '$')}</td>
                      <td className="p-3 font-mono text-amber-700">{formatCurrency(sypReceivables, 'ل.س')}</td>
                      <td className="p-3 font-mono font-bold text-amber-900">
                        {formatCurrency(combinedCurrencyUnit === '$' ? combinedReceivablesUSD : combinedReceivablesSYP, combinedCurrencyUnit)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">مشتريات خامات الموردين</td>
                      <td className="p-3 font-mono text-rose-700">{formatCurrency(usdPurchasesTotal, '$')}</td>
                      <td className="p-3 font-mono text-rose-700">{formatCurrency(sypPurchasesTotal, 'ل.س')}</td>
                      <td className="p-3 font-mono font-bold text-rose-900">
                        {formatCurrency(combinedCurrencyUnit === '$' ? combinedPurchasesInUSD : combinedPurchasesInSYP, combinedCurrencyUnit)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">المصاريف التشغيلية</td>
                      <td className="p-3 font-mono text-purple-700">{formatCurrency(usdExpensesTotal, '$')}</td>
                      <td className="p-3 font-mono text-purple-700">{formatCurrency(sypExpensesTotal, 'ل.س')}</td>
                      <td className="p-3 font-mono font-bold text-purple-900">
                        {formatCurrency(combinedCurrencyUnit === '$' ? combinedExpensesUSD : combinedExpensesSYP, combinedCurrencyUnit)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/80 font-black">
                      <td className="p-3 text-emerald-950 font-bold">صافي الأرباح المحققة (Net Profit)</td>
                      <td className="p-3 font-mono text-emerald-800 text-sm">{formatCurrency(usdNetProfit, '$')}</td>
                      <td className="p-3 font-mono text-blue-800 text-sm">{formatCurrency(sypNetProfit, 'ل.س')}</td>
                      <td className="p-3 font-mono text-emerald-950 text-base">
                        {formatCurrency(combinedCurrencyUnit === '$' ? combinedNetProfitUSD : combinedNetProfitSYP, combinedCurrencyUnit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SubTab 2: Orders Details */}
            {dualViewSubTab === 'orders' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* USD Orders */}
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      فواتير الزبائن بالدولار ({usdOrders.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-700">{formatCurrency(usdSales, '$')}</span>
                  </div>
                  {usdOrders.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد فواتير بيع بالدولار حالياً</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {usdOrders.map((o) => (
                        <div key={o.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{o.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{o.orderNumber} • {o.items.length} بنود</span>
                          </div>
                          <div className="text-left font-mono">
                            <span className="font-bold text-slate-900 block">{formatCurrency(o.finalSellingPrice, '$')}</span>
                            <span className="text-[10px] text-slate-500">متبقي: {formatCurrency(o.remainingBalance, '$')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SYP Orders */}
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      فواتير الزبائن بالليرة السورية ({sypOrders.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700">{formatCurrency(sypSales, 'ل.س')}</span>
                  </div>
                  {sypOrders.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد فواتير بيع بالليرة السورية حالياً</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {sypOrders.map((o) => (
                        <div key={o.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{o.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{o.orderNumber} • {o.items.length} بنود</span>
                          </div>
                          <div className="text-left font-mono">
                            <span className="font-bold text-slate-900 block">{formatCurrency(o.finalSellingPrice, 'ل.س')}</span>
                            <span className="text-[10px] text-slate-500">متبقي: {formatCurrency(o.remainingBalance, 'ل.س')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SubTab 3: Purchases Details */}
            {dualViewSubTab === 'purchases' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* USD Purchases */}
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      مشتريات الموردين بالدولار ({usdPurchases.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-700">{formatCurrency(usdPurchasesTotal, '$')}</span>
                  </div>
                  {usdPurchases.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد فواتير مشتريات بالدولار</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {usdPurchases.map((p, idx) => (
                        <div key={`${p.id}-${idx}`} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{p.supplierName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{p.invoiceNumber} • {p.invoiceDate}</span>
                          </div>
                          <div className="text-left font-mono">
                            <span className="font-bold text-slate-900 block">{formatCurrency(p.totalAmount, '$')}</span>
                            <span className="text-[10px] text-slate-500">مسدد: {formatCurrency(p.paidAmount, '$')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SYP Purchases */}
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      مشتريات الموردين بالليرة السورية ({sypPurchases.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-700">{formatCurrency(sypPurchasesTotal, 'ل.س')}</span>
                  </div>
                  {sypPurchases.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد فواتير مشتريات بالليرة السورية</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {sypPurchases.map((p, idx) => (
                        <div key={`${p.id}-${idx}`} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{p.supplierName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{p.invoiceNumber} • {p.invoiceDate}</span>
                          </div>
                          <div className="text-left font-mono">
                            <span className="font-bold text-slate-900 block">{formatCurrency(p.totalAmount, 'ل.س')}</span>
                            <span className="text-[10px] text-slate-500">مسدد: {formatCurrency(p.paidAmount, 'ل.س')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SubTab 4: Expenses Details */}
            {dualViewSubTab === 'expenses' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* USD Expenses */}
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      مصاريف بالدولار ({usdExpenses.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-purple-700">{formatCurrency(usdExpensesTotal, '$')}</span>
                  </div>
                  {usdExpenses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد مصاريف بالدولار</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {usdExpenses.map((e) => (
                        <div key={e.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{e.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{e.date}</span>
                          </div>
                          <span className="font-bold font-mono text-purple-800">{formatCurrency(e.amount, '$')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SYP Expenses */}
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      مصاريف بالليرة السورية ({sypExpenses.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-purple-700">{formatCurrency(sypExpensesTotal, 'ل.س')}</span>
                  </div>
                  {sypExpenses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد مصاريف بالليرة السورية</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {sypExpenses.map((e) => (
                        <div key={e.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{e.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{e.date}</span>
                          </div>
                          <span className="font-bold font-mono text-purple-800">{formatCurrency(e.amount, 'ل.س')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            {netRealProfit >= 0 ? (
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                هامش صافي الربح: +{netRealMargin}%
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-300">
                هامش صافي الخسارة: {netRealMargin}% (<span className="text-rose-600 font-black">خسارة</span>)
              </span>
            )}
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

            {/* Real Net Profit / Loss */}
            {netRealProfit >= 0 ? (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-xs border border-emerald-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-100">
                    4. صافي ربح الورشة الفعلي
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-500/40 text-white px-2 py-0.5 rounded-full border border-emerald-400/40">
                    ربح
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono">
                  {maskValue(formatCurrency(netRealProfit, currency))}
                </div>
                <span className="text-[11px] text-emerald-100 mt-1 block font-medium">
                  هامش صافي الربح الفعلي: +{netRealMargin}%
                </span>
              </div>
            ) : (
              <div className="bg-rose-50/90 border-2 border-rose-300 p-4 rounded-xl shadow-xs text-slate-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-900">
                    4. صافي نتيجة الورشة الفعلي
                  </span>
                  <span className="text-xs font-black bg-white text-rose-600 border border-rose-300 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    خسارة
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-rose-700">
                  {maskValue(formatCurrency(netRealProfit, currency))}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <span className="font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                    خسارة
                  </span>
                  <span className="text-[11px] text-rose-700 font-medium">
                    نسبة صافي الخسارة: {netRealMargin}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Visual Profit Formula Step Banner */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
            <div className="text-slate-700">
              <span className="text-slate-500 font-sans ml-1">المعادلة المحاسبية:</span>
              <span className="font-bold text-blue-900">{formatCurrency(totalSales, currency)}</span> (مبيعات)
              {' - '}
              <span className="font-bold text-rose-700">{formatCurrency(effectiveMaterialCost, currency)}</span> (مشتريات)
              {' = '}
              <span className={grossProfit >= 0 ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>
                {formatCurrency(grossProfit, currency)} {grossProfit >= 0 ? '(مجمل ربح)' : (<span className="text-rose-600 font-bold">(مجمل خسارة)</span>)}
              </span>
              {' - '}
              <span className="font-bold text-amber-700">{formatCurrency(totalExpenses, currency)}</span> (مصاريف)
              {' = '}
              {netRealProfit >= 0 ? (
                <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                  {formatCurrency(netRealProfit, currency)} (صافي الربح)
                </span>
              ) : (
                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg">
                  {formatCurrency(netRealProfit, currency)} (<span className="text-rose-600 font-black">خسارة</span>)
                </span>
              )}
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
                    <div className={`flex justify-between pt-1.5 border-t border-slate-200/80 font-bold ${stats.profit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      <span>{stats.profit >= 0 ? 'صافي الربح:' : 'النتيجة (خسارة):'}</span>
                      <span className="font-mono">
                        {maskValue(formatCurrency(stats.profit, currency))}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{stats.profit >= 0 ? 'هامش الربح:' : 'نسبة الخسارة:'}</span>
                      <span className={`font-mono font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.profit >= 0 ? `+${margin}%` : `${margin}% (خسارة)`}
                      </span>
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
                    المبلغ:
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
                    عملة المصروف:
                  </label>
                  <select
                    value={expenseCurrency}
                    onChange={(e) => setExpenseCurrency(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                  >
                    <option value="$">دولار ($)</option>
                    <option value="ل.س">ليرة سورية (ل.س)</option>
                    <option value="د.أ">دينار أردني (د.أ)</option>
                  </select>
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
                    <th className="p-2.5 font-bold">المبلغ والعملة</th>
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
                        {maskValue(formatCurrency(exp.amount, exp.currency || currency))}
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
                      <td className={`p-2.5 font-bold font-mono ${order.netProfit >= 0 ? 'text-emerald-600 bg-emerald-50/30' : 'text-rose-600 bg-rose-50/40'}`}>
                        {order.netProfit < 0 && <span className="text-[10px] text-rose-600 font-bold ml-1">خسارة:</span>}
                        {maskValue(formatCurrency(order.netProfit, currency))}
                      </td>
                      <td className={`p-2.5 font-bold font-mono ${order.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {order.netProfit >= 0 ? `+${margin}%` : `${margin}% (خسارة)`}
                      </td>
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
