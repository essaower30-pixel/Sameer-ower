import React, { useState, useEffect } from 'react';
import {
  CustomerOrder,
  WorkshopSettings,
  OrderStatus,
  ProductCategory,
  OrderItem,
  WorkshopExpense,
  SupplierPurchaseInvoice,
  DEFAULT_SETTINGS,
  SUPPORTED_CURRENCIES,
  OrderPaymentRecord,
  SupplierPaymentRecord,
} from './types';
import { getOrderPayments, getSupplierPayments } from './utils/calculator';
import { INITIAL_ORDERS, INITIAL_EXPENSES, INITIAL_PURCHASE_INVOICES } from './data/mockData';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { OrderCard } from './components/OrderCard';
import { OrderFormModal } from './components/OrderFormModal';
import { InvoiceModal } from './components/InvoiceModal';
import { FinancesPage } from './components/FinancesPage';
import { SuppliersPage } from './components/SuppliersPage';
import { PurchaseInvoiceModal } from './components/PurchaseInvoiceModal';
import { PurchaseInvoiceViewModal } from './components/PurchaseInvoiceViewModal';
import { CustomerPaymentModal } from './components/CustomerPaymentModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { testFirestoreConnection } from './firebase';
import {
  Search,
  Filter,
  Plus,
  Inbox,
  Coins,
  ArrowLeftRight,
} from 'lucide-react';

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export default function App() {
  // Load settings from localStorage or fallback to defaults
  const [settings, setSettings] = useState<WorkshopSettings>(() => {
    try {
      const saved = localStorage.getItem('workshop_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currency && !SUPPORTED_CURRENCIES.some((c) => c.code === parsed.currency)) {
          parsed.currency = '$';
        }
        if (parsed.email === 'workshop@example.com') {
          parsed.email = '';
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load orders (Customer Sales Invoices) from localStorage or fallback
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem('workshop_orders');
      if (saved) {
        let parsed: CustomerOrder[] = deduplicateById(JSON.parse(saved));
        const hasSyp = parsed.some((o) => o.currency === 'ل.س');
        if (!hasSyp && INITIAL_ORDERS[2]) {
          const withoutDup = parsed.filter((o) => o.id !== INITIAL_ORDERS[2].id);
          parsed = deduplicateById([...withoutDup.map((o) => ({ ...o, currency: o.currency || '$' })), INITIAL_ORDERS[2]]);
        }
        const hasKitchen = parsed.some((o) => o.items?.some((it) => it.category === 'kitchens'));
        if (!hasKitchen && INITIAL_ORDERS[3]) {
          const withoutDup = parsed.filter((o) => o.id !== INITIAL_ORDERS[3].id);
          parsed = deduplicateById([...withoutDup, INITIAL_ORDERS[3]]);
        }
        return parsed.map((o) => ({ ...o, currency: o.currency || '$' }));
      }
      return INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Load Supplier Purchase Invoices from localStorage or fallback
  const [purchaseInvoices, setPurchaseInvoices] = useState<SupplierPurchaseInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('workshop_purchases');
      if (saved) {
        const parsed: SupplierPurchaseInvoice[] = deduplicateById(JSON.parse(saved));
        const hasSyp = parsed.some((p) => p.currency === 'ل.س');
        if (!hasSyp && INITIAL_PURCHASE_INVOICES[2]) {
          const withoutDup = parsed.filter((p) => p.id !== INITIAL_PURCHASE_INVOICES[2].id);
          return deduplicateById([...withoutDup.map((p) => ({ ...p, currency: p.currency || '$' })), INITIAL_PURCHASE_INVOICES[2]]);
        }
        return parsed.map((p) => ({ ...p, currency: p.currency || '$' }));
      }
      return INITIAL_PURCHASE_INVOICES;
    } catch {
      return INITIAL_PURCHASE_INVOICES;
    }
  });

  // Navigation tab: 'orders' | 'suppliers' | 'finances' | 'dual_currency'
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('orders');

  // Search & Filter state for Customer Orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // Modals state for Customer Orders
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [transferItems, setTransferItems] = useState<OrderItem[]>([]);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<CustomerOrder | null>(null);
  const [collectingPaymentOrder, setCollectingPaymentOrder] = useState<CustomerOrder | null>(null);

  // Modals state for Supplier Purchase Invoices
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchaseInvoice, setEditingPurchaseInvoice] = useState<SupplierPurchaseInvoice | null>(null);
  const [viewingPurchaseInvoice, setViewingPurchaseInvoice] = useState<SupplierPurchaseInvoice | null>(null);

  // Workshop Expenses for Private Finance & Budget Dashboard
  const [expenses, setExpenses] = useState<WorkshopExpense[]>(() => {
    try {
      const saved = localStorage.getItem('workshop_expenses');
      if (saved) {
        const parsed: WorkshopExpense[] = deduplicateById(JSON.parse(saved));
        const hasSyp = parsed.some((e) => e.currency === 'ل.س');
        if (!hasSyp && INITIAL_EXPENSES[5]) {
          const withoutDup = parsed.filter((e) => e.id !== INITIAL_EXPENSES[5].id);
          return deduplicateById([...withoutDup.map((e) => ({ ...e, currency: e.currency || '$' })), INITIAL_EXPENSES[5]]);
        }
        return parsed.map((e) => ({ ...e, currency: e.currency || '$' }));
      }
      return INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('workshop_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('workshop_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('workshop_purchases', JSON.stringify(purchaseInvoices));
    } catch (e) {
      console.error('Failed to save purchase invoices to localStorage', e);
    }
  }, [purchaseInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem('workshop_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage', e);
    }
  }, [expenses]);

  // Test Firebase connection on initial boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Full Restore Handler from Cloud or Backup
  const handleRestoreAllData = (data: {
    settings: WorkshopSettings;
    orders: CustomerOrder[];
    purchases: SupplierPurchaseInvoice[];
    expenses: WorkshopExpense[];
  }) => {
    setSettings(data.settings);
    setOrders(data.orders);
    setPurchaseInvoices(data.purchases);
    setExpenses(data.expenses);
  };

  // Expenses Handlers
  const handleAddExpense = (newExp: Omit<WorkshopExpense, 'id'>) => {
    const expense: WorkshopExpense = {
      ...newExp,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [expense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Customer Order Handlers (فواتير البيع)
  const handleSaveOrder = (newOrUpdatedOrder: CustomerOrder, linkedPurchaseInvoice?: SupplierPurchaseInvoice) => {
    setOrders((prev) => {
      const existsIndex = prev.findIndex((o) => o.id === newOrUpdatedOrder.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newOrUpdatedOrder;
        return updated;
      }
      return [newOrUpdatedOrder, ...prev];
    });

    if (linkedPurchaseInvoice) {
      setPurchaseInvoices((prev) => [linkedPurchaseInvoice, ...prev]);
    }

    setIsOrderModalOpen(false);
    setEditingOrder(null);
    setTransferItems([]);
  };

  // Direct order updater for invoices (e.g. mobile signature)
  const handleUpdateOrderDirect = (updatedOrder: CustomerOrder) => {
    setOrders((prev) => {
      const existsIndex = prev.findIndex((o) => o.id === updatedOrder.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = updatedOrder;
        return updated;
      }
      return [updatedOrder, ...prev];
    });
    setViewingInvoiceOrder(updatedOrder);
  };

  // Quick Collect Payment from Customer (تحصيل دفعة مالية من الزبون)
  const handleQuickCollectCustomerPayment = (
    orderId: string,
    collectedAmount: number,
    paymentNote?: string,
    markAsDelivered?: boolean,
    paymentMethod?: 'cash' | 'bank' | 'check' | 'other',
    paymentDate?: string
  ) => {
    let targetUpdatedOrder: CustomerOrder | null = null;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const existingPayments = getOrderPayments(order);
        const newDeposit = Math.min(
          order.finalSellingPrice,
          Number(((order.deposit || 0) + collectedAmount).toFixed(2))
        );
        const newRemaining = Math.max(
          0,
          Number((order.finalSellingPrice - newDeposit).toFixed(2))
        );

        const pmtRecord: OrderPaymentRecord = {
          id: 'pmt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          amount: collectedAmount,
          date: paymentDate || new Date().toISOString(),
          note: paymentNote || `دفعة سداد #${existingPayments.length + 1}`,
          paymentMethod: paymentMethod || 'cash',
          remainingAfter: newRemaining,
        };

        const updatedPayments = [...existingPayments, pmtRecord];

        let updatedNotes = order.notes || '';
        if (paymentNote) {
          const dateStr = new Date(pmtRecord.date).toLocaleDateString('ar-EG');
          const noteEntry = `[تحصيل دفعة: +${collectedAmount} ${
            order.currency || settings.currency
          } (${paymentNote}) بتاريخ ${dateStr}]`;
          updatedNotes = updatedNotes ? `${updatedNotes}\n${noteEntry}` : noteEntry;
        }

        const updated: CustomerOrder = {
          ...order,
          deposit: newDeposit,
          remainingBalance: newRemaining,
          payments: updatedPayments,
          notes: updatedNotes,
          status: markAsDelivered && newRemaining === 0 ? 'completed' : order.status,
        };

        targetUpdatedOrder = updated;
        return updated;
      })
    );

    if (viewingInvoiceOrder && viewingInvoiceOrder.id === orderId && targetUpdatedOrder) {
      setViewingInvoiceOrder(targetUpdatedOrder);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب؟')) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setTransferItems([]);
    setIsOrderModalOpen(true);
  };

  const handleEditOrder = (order: CustomerOrder) => {
    setEditingOrder(order);
    setTransferItems([]);
    setIsOrderModalOpen(true);
  };

  // From QuickCalculator to Order Form
  const handleTransferToNewOrder = (items: OrderItem[]) => {
    setEditingOrder(null);
    setTransferItems(items);
    setIsOrderModalOpen(true);
  };

  // Supplier Purchase Invoice Handlers (فواتير الشراء)
  const handleOpenNewPurchaseInvoice = () => {
    setEditingPurchaseInvoice(null);
    setIsPurchaseModalOpen(true);
  };

  const handleEditPurchaseInvoice = (invoice: SupplierPurchaseInvoice) => {
    setEditingPurchaseInvoice(invoice);
    setIsPurchaseModalOpen(true);
  };

  const handleSavePurchaseInvoice = (newOrUpdatedInvoice: SupplierPurchaseInvoice) => {
    setPurchaseInvoices((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === newOrUpdatedInvoice.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newOrUpdatedInvoice;
        return updated;
      }
      return [newOrUpdatedInvoice, ...prev];
    });

    setIsPurchaseModalOpen(false);
    setEditingPurchaseInvoice(null);
  };

  // Direct purchase invoice updater (e.g. mobile signature)
  const handleUpdatePurchaseInvoiceDirect = (updatedInvoice: SupplierPurchaseInvoice) => {
    setPurchaseInvoices((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === updatedInvoice.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = updatedInvoice;
        return updated;
      }
      return [updatedInvoice, ...prev];
    });
    setViewingPurchaseInvoice(updatedInvoice);
  };

  const handleDeletePurchaseInvoice = (invoiceId: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف فاتورة الشراء هذه؟')) {
      setPurchaseInvoices((prev) => prev.filter((p) => p.id !== invoiceId));
    }
  };

  const handleQuickPayPurchaseInvoice = (
    invoiceId: string,
    paidMore: number,
    paymentNote?: string,
    paymentMethod?: 'cash' | 'bank' | 'check' | 'credit'
  ) => {
    setPurchaseInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const existingPayments = getSupplierPayments(inv);
        const newPaid = Math.min(
          inv.totalAmount,
          Number(((inv.paidAmount || 0) + paidMore).toFixed(2))
        );
        const newRemaining = Math.max(0, Number((inv.totalAmount - newPaid).toFixed(2)));
        const newStatus =
          newRemaining === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

        const pmtRecord: SupplierPaymentRecord = {
          id: 'spmt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          amount: paidMore,
          date: new Date().toISOString(),
          note: paymentNote || `دفعة سداد للمورد #${existingPayments.length + 1}`,
          paymentMethod: paymentMethod || inv.paymentMethod || 'cash',
          remainingAfter: newRemaining,
        };

        return {
          ...inv,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          payments: [...existingPayments, pmtRecord],
          paymentStatus: newStatus,
        };
      })
    );
  };

  // Backup Import & Reset
  const handleImportData = (data: {
    orders: CustomerOrder[];
    settings: WorkshopSettings;
    purchases?: SupplierPurchaseInvoice[];
  }) => {
    setOrders(data.orders);
    setSettings(data.settings);
    if (data.purchases) {
      setPurchaseInvoices(data.purchases);
    }
  };

  const handleResetData = () => {
    setOrders(INITIAL_ORDERS);
    setSettings(DEFAULT_SETTINGS);
    setExpenses(INITIAL_EXPENSES);
    setPurchaseInvoices(INITIAL_PURCHASE_INVOICES);
    localStorage.removeItem('workshop_orders');
    localStorage.removeItem('workshop_settings');
    localStorage.removeItem('workshop_expenses');
    localStorage.removeItem('workshop_purchases');
  };

  // Filtered Orders (Customer Sales)
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery.trim() ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.customerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' ||
      order.items.some((item) => item.category === categoryFilter);

    const matchesCurrency =
      currencyFilter === 'all' ||
      (order.currency || settings.currency || '$') === currencyFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesCurrency;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white w-full overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOrder={handleOpenNewOrder}
        onNewPurchaseInvoice={handleOpenNewPurchaseInvoice}
        settings={settings}
        onSaveSettings={setSettings}
        orders={orders}
        purchaseInvoices={purchaseInvoices}
        expenses={expenses}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onRestoreAllData={handleRestoreAllData}
        onCurrencyChange={(newCurrency) => {
          setSettings((prev) => ({ ...prev, currency: newCurrency }));
        }}
        onDefaultUnitChange={(newUnit) => {
          setSettings((prev) => ({ ...prev, defaultUnit: newUnit }));
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-x-hidden">
        {/* Tab 1: Customers & Sales Invoices (الزبائن - فواتير البيع) */}
        {activeTab === 'orders' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Filter, Search & Actions Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الزبون، رقم الهاتف، العنوان..."
                  className="w-full text-xs sm:text-sm pl-3 pr-9 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50"
                />
              </div>

              {/* Status & Category Selectors + Action Button */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* فلتر عملة الفاتورة */}
                <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs shrink-0">
                  <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-amber-900 font-bold shrink-0">العملة:</span>
                  <select
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                    className="bg-transparent font-black text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">جميع العملات</option>
                    <option value="$">💵 دولار ($)</option>
                    <option value="ل.س">🇸🇾 ليرة سورية (ل.س)</option>
                    <option value="د.أ">🇯🇴 دينار (د.أ)</option>
                  </select>
                </div>

                {/* فلتر حالة الفاتورة */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-medium shrink-0">الحالة:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="in_progress">قيد التصنيع</option>
                    <option value="ready">جاهز للتركيب</option>
                    <option value="completed">تم التسليم</option>
                    <option value="quotation">عرض سعر</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                {/* فلتر صنف الشغل والخامة */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shrink-0">
                  <span className="text-slate-500 font-medium shrink-0">الصنف:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">جميع الأصناف</option>
                    <option value="aluminum">ألمنيوم وشبابيك</option>
                    <option value="accordion">أبواب الأكرديون</option>
                    <option value="zebra">ستائر زيبرا</option>
                    <option value="shutters">أباجورات شتر</option>
                    <option value="kitchens">مطابخ وتفصيل</option>
                  </select>
                </div>

                {/* زر إصدار فاتورة بيع */}
                <button
                  type="button"
                  onClick={handleOpenNewOrder}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إصدار فاتورة بيع</span>
                </button>
              </div>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    currency={settings.currency}
                    workshopName={settings.workshopName}
                    onEdit={handleEditOrder}
                    onDelete={handleDeleteOrder}
                    onViewInvoice={(ord) => setViewingInvoiceOrder(ord)}
                    onStatusChange={handleStatusChange}
                    onQuickCollect={(ord) => setCollectingPaymentOrder(ord)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-3 border border-blue-100">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">
                  لا توجد فواتير بيع مطابقة للبحث أو الفلتر
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  يمكنك تغيير كلمات البحث أو إصدار فاتورة بيع لزبون جديد لحساب المقاسات بدقة.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleOpenNewOrder}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إصدار فاتورة بيع الآن</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Suppliers & Purchase Invoices (الموردين - فواتير الشراء) */}
        {activeTab === 'suppliers' && (
          <SuppliersPage
            invoices={purchaseInvoices}
            settings={settings}
            currency={settings.currency}
            onNewInvoice={handleOpenNewPurchaseInvoice}
            onEditInvoice={handleEditPurchaseInvoice}
            onDeleteInvoice={handleDeletePurchaseInvoice}
            onViewInvoice={(inv) => setViewingPurchaseInvoice(inv)}
            onQuickPay={handleQuickPayPurchaseInvoice}
          />
        )}

        {/* Tab 3: Workshop Finances, Profit & Budget (الأرباح والميزانية) */}
        {activeTab === 'finances' && (
          <div className="animate-in fade-in duration-200">
            <FinancesPage
              orders={orders}
              expenses={expenses}
              purchaseInvoices={purchaseInvoices}
              settings={settings}
              currency={settings.currency}
              initialTab="overview"
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onSaveSettings={(newSettings) => setSettings(newSettings)}
            />
          </div>
        )}

        {/* Tab 4: Dedicated Dual Currency ($ / ل.س) Statement & Exchange Rate */}
        {activeTab === 'dual_currency' && (
          <div className="animate-in fade-in duration-200">
            <FinancesPage
              orders={orders}
              expenses={expenses}
              purchaseInvoices={purchaseInvoices}
              settings={settings}
              currency={settings.currency}
              initialTab="dual_currency"
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onSaveSettings={(newSettings) => setSettings(newSettings)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {settings.workshopName} • نظام متكامل لإدارة فواتير البيع (الزبائن) وفواتير الشراء (الموردين)
          </span>
          <span className="text-slate-400">
            ألمنيوم • أبواب أكرديون • ستائر زيبرا • أباجورات وشتر
          </span>
        </div>
      </footer>

      {/* Customer Order Form Modal (Add / Edit) */}
      {isOrderModalOpen && (
        <OrderFormModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setEditingOrder(null);
            setTransferItems([]);
          }}
          onSave={handleSaveOrder}
          initialOrder={editingOrder}
          initialItems={transferItems}
          purchaseInvoices={purchaseInvoices}
          settings={settings}
          currency={settings.currency}
        />
      )}

      {/* Customer Invoice & Quotation Printable Modal */}
      {viewingInvoiceOrder && (
        <InvoiceModal
          order={viewingInvoiceOrder}
          settings={settings}
          currency={settings.currency}
          onUpdateOrder={handleUpdateOrderDirect}
          onSaveSettings={(newSettings) => setSettings(newSettings)}
          onClose={() => setViewingInvoiceOrder(null)}
        />
      )}

      {/* Customer Payment Collection Modal (تحصيل دفعة مالية من الزبون) */}
      {collectingPaymentOrder && (
        <CustomerPaymentModal
          isOpen={!!collectingPaymentOrder}
          order={collectingPaymentOrder}
          settings={settings}
          onClose={() => setCollectingPaymentOrder(null)}
          onConfirm={(collectedAmount, note) => {
            handleQuickCollectCustomerPayment(
              collectingPaymentOrder.id,
              collectedAmount,
              note
            );
            setCollectingPaymentOrder(null);
          }}
        />
      )}

      {/* Supplier Purchase Invoice Modal (Add / Edit) */}
      {isPurchaseModalOpen && (
        <PurchaseInvoiceModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setEditingPurchaseInvoice(null);
          }}
          onSave={handleSavePurchaseInvoice}
          initialInvoice={editingPurchaseInvoice}
          settings={settings}
          currency={settings.currency}
        />
      )}

      {/* Supplier Purchase Invoice Printable Modal */}
      {viewingPurchaseInvoice && (
        <PurchaseInvoiceViewModal
          invoice={viewingPurchaseInvoice}
          settings={settings}
          currency={settings.currency}
          onUpdateInvoice={handleUpdatePurchaseInvoiceDirect}
          onClose={() => setViewingPurchaseInvoice(null)}
        />
      )}

      {/* Connectivity & Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
