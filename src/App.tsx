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
} from './types';
import { INITIAL_ORDERS, INITIAL_EXPENSES, INITIAL_PURCHASE_INVOICES } from './data/mockData';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { OrderCard } from './components/OrderCard';
import { OrderFormModal } from './components/OrderFormModal';
import { InvoiceModal } from './components/InvoiceModal';
import { QuickCalculator } from './components/QuickCalculator';
import { FinancesPage } from './components/FinancesPage';
import { SuppliersPage } from './components/SuppliersPage';
import { PurchaseInvoiceModal } from './components/PurchaseInvoiceModal';
import { PurchaseInvoiceViewModal } from './components/PurchaseInvoiceViewModal';
import {
  Search,
  Filter,
  Plus,
  Inbox,
  Users,
  Truck,
  FileText,
  Calculator,
} from 'lucide-react';

export default function App() {
  // Load settings from localStorage or fallback to defaults
  const [settings, setSettings] = useState<WorkshopSettings>(() => {
    try {
      const saved = localStorage.getItem('workshop_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load orders (Customer Sales Invoices) from localStorage or fallback
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem('workshop_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Load Supplier Purchase Invoices from localStorage or fallback
  const [purchaseInvoices, setPurchaseInvoices] = useState<SupplierPurchaseInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('workshop_purchases');
      return saved ? JSON.parse(saved) : INITIAL_PURCHASE_INVOICES;
    } catch {
      return INITIAL_PURCHASE_INVOICES;
    }
  });

  // Navigation tab: 'orders' (الزبائن - بيع) | 'suppliers' (الموردين - شراء) | 'calculator' | 'finances'
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('orders');

  // Customer Section View Mode: 'invoices' (فواتير البيع) | 'calculator' (حاسبة المقاسات وفاتورة البيع)
  const [customerViewMode, setCustomerViewMode] = useState<'invoices' | 'calculator'>('invoices');

  // Search & Filter state for Customer Orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state for Customer Orders
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [transferItems, setTransferItems] = useState<OrderItem[]>([]);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<CustomerOrder | null>(null);

  // Modals state for Supplier Purchase Invoices
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchaseInvoice, setEditingPurchaseInvoice] = useState<SupplierPurchaseInvoice | null>(null);
  const [viewingPurchaseInvoice, setViewingPurchaseInvoice] = useState<SupplierPurchaseInvoice | null>(null);

  // Workshop Expenses for Private Finance & Budget Dashboard
  const [expenses, setExpenses] = useState<WorkshopExpense[]>(() => {
    try {
      const saved = localStorage.getItem('workshop_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
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

  const handleDeletePurchaseInvoice = (invoiceId: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف فاتورة الشراء هذه؟')) {
      setPurchaseInvoices((prev) => prev.filter((p) => p.id !== invoiceId));
    }
  };

  const handleQuickPayPurchaseInvoice = (invoiceId: string, paidMore: number) => {
    setPurchaseInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newPaid = Math.min(inv.totalAmount, inv.paidAmount + paidMore);
        const newRemaining = Math.max(0, inv.totalAmount - newPaid);
        const newStatus =
          newRemaining === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

        return {
          ...inv,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
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

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOrder={handleOpenNewOrder}
        onNewPurchaseInvoice={handleOpenNewPurchaseInvoice}
        settings={settings}
        onSaveSettings={setSettings}
        orders={orders}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onCurrencyChange={(newCurrency) => {
          setSettings((prev) => ({ ...prev, currency: newCurrency }));
        }}
        onDefaultUnitChange={(newUnit) => {
          setSettings((prev) => ({ ...prev, defaultUnit: newUnit }));
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Tab 1: Customers & Sales Invoices (الزبائن - فواتير البيع) */}
        {activeTab === 'orders' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* View Switcher: سجل فواتير البيع | حاسبة المقاسات وفاتورة البيع */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCustomerViewMode('invoices')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    customerViewMode === 'invoices'
                      ? 'bg-white text-blue-700 shadow-2xs ring-1 ring-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>سجل فواتير البيع ({orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerViewMode('calculator')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    customerViewMode === 'calculator'
                      ? 'bg-white text-blue-700 shadow-2xs ring-1 ring-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>حاسبة المقاسات وفاتورة البيع</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {customerViewMode === 'invoices' ? (
                  <button
                    type="button"
                    onClick={() => setCustomerViewMode('calculator')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فتح حاسبة المقاسات الفورية</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCustomerViewMode('invoices')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>العودة لسجل فواتير البيع</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenNewOrder}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إصدار فاتورة بيع</span>
                </button>
              </div>
            </div>

            {/* Sub-view 1: Quick Calculator for instant sizing & sales invoicing */}
            {customerViewMode === 'calculator' && (
              <div className="animate-in fade-in duration-150">
                <QuickCalculator
                  settings={settings}
                  currency={settings.currency}
                  onTransferToNewOrder={(items) => {
                    handleTransferToNewOrder(items);
                    setCustomerViewMode('invoices');
                  }}
                />
              </div>
            )}

            {/* Sub-view 2: Sales Invoices List & Filters */}
            {customerViewMode === 'invoices' && (
              <div className="space-y-6">
                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
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

                  {/* Status & Category Selectors */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <span>الحالة:</span>
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="in_progress">قيد التصنيع</option>
                      <option value="ready">جاهز للتركيب</option>
                      <option value="completed">تم التسليم</option>
                      <option value="quotation">عرض سعر مبدئي</option>
                      <option value="cancelled">ملغي</option>
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
                      <option value="aluminum">ألمنيوم وشبابيك</option>
                      <option value="accordion">أبواب الأكرديون</option>
                      <option value="zebra">ستائر زيبرا</option>
                      <option value="shutters">أباجورات شتر</option>
                    </select>

                    <button
                      onClick={handleOpenNewOrder}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors mr-2 cursor-pointer"
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
                      يمكنك تغيير كلمات البحث أو إصدار فاتورة بيع لزبون جديد لحساب التكاليف والأرباح بدقة.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleOpenNewOrder}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إصدار فاتورة بيع الآن</span>
                      </button>
                      <button
                        onClick={() => setCustomerViewMode('calculator')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                      >
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span>حاسبة تفصيل المقاسات</span>
                      </button>
                    </div>
                  </div>
                )}
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

        {/* Tab 3: Quick Dimension Calculator (الحاسبة الفورية) */}
        {activeTab === 'calculator' && (
          <div className="animate-in fade-in duration-200">
            <QuickCalculator
              settings={settings}
              currency={settings.currency}
              onTransferToNewOrder={handleTransferToNewOrder}
            />
          </div>
        )}

        {/* Tab 4: Workshop Finances, Profit & Budget (الأرباح والميزانية) */}
        {activeTab === 'finances' && (
          <div className="animate-in fade-in duration-200">
            <FinancesPage
              orders={orders}
              expenses={expenses}
              purchaseInvoices={purchaseInvoices}
              settings={settings}
              currency={settings.currency}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
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
          onClose={() => setViewingInvoiceOrder(null)}
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
          onClose={() => setViewingPurchaseInvoice(null)}
        />
      )}
    </div>
  );
}
