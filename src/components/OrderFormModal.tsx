import React, { useState, useEffect } from 'react';
import {
  CustomerOrder,
  OrderItem,
  ProductCategory,
  MeasurementUnit,
  OrderStatus,
  WorkshopSettings,
  CATEGORY_LABELS,
  SupplierPurchaseInvoice,
} from '../types';
import { calculateItemMetrics, calculateOrderTotals, formatCurrency } from '../utils/calculator';
import {
  extractCostsFromPurchases,
  syncOrderItemWithPurchases,
  generateLinkedPurchaseInvoice,
} from '../utils/purchaseSync';
import { CategoryBadge } from './CategoryBadge';
import {
  X,
  Plus,
  Trash2,
  Save,
  Calculator,
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Ruler,
  Lock,
  Eye,
  EyeOff,
  Key,
  Check,
  Truck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: CustomerOrder, linkedPurchaseInvoice?: SupplierPurchaseInvoice) => void;
  initialOrder?: CustomerOrder | null;
  initialItems?: OrderItem[];
  purchaseInvoices?: SupplierPurchaseInvoice[];
  settings: WorkshopSettings;
  currency: string;
}

export const OrderFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialOrder,
  initialItems,
  purchaseInvoices = [],
  settings,
  currency,
}) => {
  if (!isOpen) return null;

  // Compute category purchase benchmarks derived from actual supplier invoices
  const categoryPurchaseCosts = extractCostsFromPurchases(purchaseInvoices, settings.defaultCosts);

  // Customer Info State
  const [orderNumber, setOrderNumber] = useState(
    initialOrder?.orderNumber || `INV-${Math.floor(100 + Math.random() * 900)}`
  );
  const [customerName, setCustomerName] = useState(initialOrder?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialOrder?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(initialOrder?.customerAddress || '');
  const [deliveryDate, setDeliveryDate] = useState(
    initialOrder?.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<OrderStatus>(initialOrder?.status || 'in_progress');
  const [notes, setNotes] = useState(initialOrder?.notes || '');
  const [generateLinkedPurchase, setGenerateLinkedPurchase] = useState<boolean>(false);

  // Items State
  const [items, setItems] = useState<OrderItem[]>(() => {
    if (initialOrder?.items && initialOrder.items.length > 0) {
      return initialOrder.items;
    }
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    // Default initial item: an aluminum window
    const def = settings.defaultCosts.aluminum;
    const metrics = calculateItemMetrics({
      category: 'aluminum',
      width: 160,
      height: 140,
      unit: 'cm',
      quantity: 1,
      minArea: def.minArea,
      costPerMeter: def.costPerMeter,
      pricePerMeter: def.pricePerMeter,
    });
    return [
      {
        id: `item-${Date.now()}`,
        category: 'aluminum',
        name: 'شباك ألمنيوم سحاب',
        width: 160,
        height: 140,
        unit: 'cm',
        quantity: 1,
        minArea: def.minArea,
        calculatedArea: metrics.calculatedArea,
        totalArea: metrics.totalArea,
        costPerMeter: def.costPerMeter,
        pricePerMeter: def.pricePerMeter,
        additionalCost: 0,
        additionalPrice: 0,
        totalCost: metrics.totalCost,
        totalPrice: metrics.totalPrice,
        profit: metrics.profit,
        profitMargin: metrics.profitMargin,
      },
    ];
  });

  // Financials State
  const [discount, setDiscount] = useState<number>(initialOrder?.discount || 0);
  const [deposit, setDeposit] = useState<number>(initialOrder?.deposit || 0);
  const [taxRate, setTaxRate] = useState<number>(initialOrder?.taxRate || 0);

  // Recalculate an item when inputs change
  const updateItem = (id: string, updates: Partial<OrderItem>) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

        const merged: OrderItem = { ...item, ...updates };

        // Re-run math
        const metrics = calculateItemMetrics({
          category: merged.category,
          width: merged.width,
          height: merged.height,
          unit: merged.unit,
          quantity: merged.quantity,
          minArea: merged.minArea,
          costPerMeter: merged.costPerMeter,
          pricePerMeter: merged.pricePerMeter,
          additionalCost: merged.additionalCost,
          additionalPrice: merged.additionalPrice,
          options: merged.options,
        });

        return {
          ...merged,
          calculatedArea: metrics.calculatedArea,
          totalArea: metrics.totalArea,
          totalCost: metrics.totalCost,
          totalPrice: metrics.totalPrice,
          profit: metrics.profit,
          profitMargin: metrics.profitMargin,
        };
      })
    );
  };

  // Toggle individual item measurement unit (cm <-> m) with mathematical conversion
  const handleToggleItemUnit = (id: string, newUnit: MeasurementUnit) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.unit === newUnit) return;

    let newWidth = item.width;
    let newHeight = item.height;

    if (newUnit === 'm') {
      // cm -> m
      newWidth = Number((item.width / 100).toFixed(3));
      newHeight = Number((item.height / 100).toFixed(3));
    } else {
      // m -> cm
      newWidth = Math.round(item.width * 100);
      newHeight = Math.round(item.height * 100);
    }

    updateItem(id, { unit: newUnit, width: newWidth, height: newHeight });
  };

  // Convert all items in this order to cm or m in one click
  const handleConvertAllUnits = (targetUnit: MeasurementUnit) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.unit === targetUnit) return item;

        let newWidth = item.width;
        let newHeight = item.height;

        if (targetUnit === 'm') {
          newWidth = Number((item.width / 100).toFixed(3));
          newHeight = Number((item.height / 100).toFixed(3));
        } else {
          newWidth = Math.round(item.width * 100);
          newHeight = Math.round(item.height * 100);
        }

        const metrics = calculateItemMetrics({
          category: item.category,
          width: newWidth,
          height: newHeight,
          unit: targetUnit,
          quantity: item.quantity,
          minArea: item.minArea,
          costPerMeter: item.costPerMeter,
          pricePerMeter: item.pricePerMeter,
          additionalCost: item.additionalCost,
          additionalPrice: item.additionalPrice,
          options: item.options,
        });

        return {
          ...item,
          unit: targetUnit,
          width: newWidth,
          height: newHeight,
          calculatedArea: metrics.calculatedArea,
          totalArea: metrics.totalArea,
          totalCost: metrics.totalCost,
          totalPrice: metrics.totalPrice,
          profit: metrics.profit,
          profitMargin: metrics.profitMargin,
        };
      })
    );
  };

  // Add Item from Preset or Default
  const handleAddItem = (category: ProductCategory = 'aluminum') => {
    const defaults = settings.defaultCosts[category];
    const defaultTitles: Record<ProductCategory, string> = {
      aluminum: 'شباك ألمنيوم سحاب',
      accordion: 'باب أكرديون',
      zebra: 'ستارة زيبرا قماش تركي',
      shutters: 'أباجور شتر ألمنيوم فوم',
    };

    const preferredUnit = settings.defaultUnit || 'cm';
    let defaultW = category === 'accordion' ? 100 : 160;
    let defaultH = category === 'accordion' ? 210 : 140;

    if (preferredUnit === 'm') {
      defaultW = category === 'accordion' ? 1.0 : 1.6;
      defaultH = category === 'accordion' ? 2.1 : 1.4;
    }

    const metrics = calculateItemMetrics({
      category,
      width: defaultW,
      height: defaultH,
      unit: preferredUnit,
      quantity: 1,
      minArea: defaults.minArea,
      costPerMeter: defaults.costPerMeter,
      pricePerMeter: defaults.pricePerMeter,
      options: {
        boxAllowanceCm: category === 'shutters' ? 30 : undefined,
      },
    });

    const newItem: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category,
      name: defaultTitles[category],
      width: defaultW,
      height: defaultH,
      unit: preferredUnit,
      quantity: 1,
      minArea: defaults.minArea,
      calculatedArea: metrics.calculatedArea,
      totalArea: metrics.totalArea,
      costPerMeter: defaults.costPerMeter,
      pricePerMeter: defaults.pricePerMeter,
      additionalCost: 0,
      additionalPrice: 0,
      totalCost: metrics.totalCost,
      totalPrice: metrics.totalPrice,
      profit: metrics.profit,
      profitMargin: metrics.profitMargin,
      options: {
        boxAllowanceCm: category === 'shutters' ? 30 : undefined,
      },
    };

    setItems([...items, newItem]);
  };

  const handleDeleteItem = (itemId: string) => {
    if (items.length <= 1) {
      alert('يجب أن يحتوي الطلب على بند واحد على الأقل.');
      return;
    }
    setItems(items.filter((i) => i.id !== itemId));
  };

  // Calculate overall totals
  const totals = calculateOrderTotals(items, discount, deposit, taxRate);
  const totalAdditionsAmount = items.reduce(
    (sum, item) => sum + ((item.additionalPrice || 0) * (item.quantity || 1)),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('يرجى إدخال اسم الزبون.');
      return;
    }

    const orderData: CustomerOrder = {
      id: initialOrder?.id || `ord-${Date.now()}`,
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      deliveryDate,
      status,
      notes,
      items,
      discount: totals.discount,
      deposit: totals.deposit,
      taxRate: Number(taxRate) || 0,
      subtotal: totals.subtotal,
      totalCost: totals.totalCost,
      finalSellingPrice: totals.finalSellingPrice,
      netProfit: totals.netProfit,
      remainingBalance: totals.remainingBalance,
      createdAt: initialOrder?.createdAt || new Date().toISOString(),
      syncedWithPurchases: items.some((i) => !!i.syncedPurchaseInfo),
      linkedPurchaseInvoiceId: initialOrder?.linkedPurchaseInvoiceId,
    };

    let linkedInvoice: SupplierPurchaseInvoice | undefined = undefined;
    if (generateLinkedPurchase) {
      linkedInvoice = generateLinkedPurchaseInvoice(orderData, settings);
      orderData.linkedPurchaseInvoiceId = linkedInvoice.id;
    }

    onSave(orderData, linkedInvoice);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {initialOrder ? 'تعديل فاتورة البيع' : 'إصدار فاتورة بيع جديدة للزبون'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-mono">رقم الفاتورة: {orderNumber}</span>
                <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200/80">
                  فاتورة بيع رسمية للزبون
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Customer & Order Metadata Section */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>بيانات الزبون وموقع التركيب</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  اسم الزبون الكريم <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: الحاج أحمد النتشة"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  رقم هاتف الزبون (للتواصل والواتساب):
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0599123456"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  العنوان / موقع العمل:
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="مثال: رام الله - الطيرة - عمارة الأمل"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  حالة الطلب:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="quotation">عرض سعر فقط</option>
                  <option value="in_progress">قيد التفصيل والتصنيع</option>
                  <option value="ready">جاهز للتركيب</option>
                  <option value="completed">تم التسليم والتحصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  موعد التسليم والتركيب المتوقع:
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ملاحظات عامة:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات التركيب أو تفاصيل إضافية..."
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Items Management Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>بنود فاتورة البيع وحسابات المقاسات والأسعار</span>
                </h3>
                <span className="text-xs text-slate-500">
                  أدخل أبعاد كل بند، ويتم حساب المساحة وسعر البيع والإجمالي آلياً (التكلفة مسجلة بفاتورة المشتريات)
                </span>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 ml-1">إضافة:</span>
                <button
                  type="button"
                  onClick={() => handleAddItem('aluminum')}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>شباك ألمنيوم</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('accordion')}
                  className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>باب أكرديون</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('zebra')}
                  className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ستائر زيبرا</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('shutters')}
                  className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold px-2.5 py-1.5 rounded-lg border border-purple-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>أباجور شتر</span>
                </button>
              </div>
            </div>

            {/* Quick Bulk Unit Conversion Bar */}
            {items.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100/80 rounded-xl text-xs border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Ruler className="w-4 h-4 text-blue-600" />
                  <span>تحويل وحدة قياس جميع بنود هذا الطلب:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleConvertAllUnits('cm')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 rounded-lg font-bold border border-slate-200 shadow-2xs transition-colors"
                  >
                    الكل بالسنتيمتر (سم)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvertAllUnits('m')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 rounded-lg font-bold border border-slate-200 shadow-2xs transition-colors"
                  >
                    الكل بالمتر (م)
                  </button>
                </div>
              </div>
            )}

            {/* Item Rows */}
            <div className="space-y-3">
              {items.map((item, index) => {
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Item Main Bar */}
                    <div className="p-3 sm:p-4 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <CategoryBadge category={item.category} size="sm" />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          className="font-bold text-slate-800 text-xs sm:text-sm px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-hidden max-w-[200px] sm:max-w-xs"
                          placeholder="اسم البند"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        {item.additionalPrice > 0 && (
                          <div className="hidden sm:flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            <Key className="w-3 h-3 text-amber-700" />
                            <span>مع إضافة ({formatCurrency(item.additionalPrice * item.quantity, currency)})</span>
                          </div>
                        )}

                        <div className="text-left font-mono">
                          <span className="text-xs text-slate-400 block">إجمالي البيع:</span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(item.totalPrice, currency)}
                          </span>
                        </div>

                        {/* Unit Switcher Button on Item Row */}
                        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold" title="تغيير وحدة قياس هذا البند">
                          <button
                            type="button"
                            onClick={() => handleToggleItemUnit(item.id, 'cm')}
                            className={`px-2 py-0.5 rounded transition-all ${
                              item.unit === 'cm'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            سم
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleItemUnit(item.id, 'm')}
                            className={`px-2 py-0.5 rounded transition-all ${
                              item.unit === 'm'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            متر
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title="حذف البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Numeric Dimension & Pricing Grid */}
                    <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs bg-white">
                      {/* Width */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            العرض ({item.unit === 'cm' ? 'سم' : 'م'}):
                          </label>
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={item.width || ''}
                          onChange={(e) =>
                            updateItem(item.id, { width: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 font-bold font-mono border border-slate-300 rounded bg-slate-50/50 text-center"
                        />
                        <span className="text-[10px] text-blue-600 font-mono block mt-0.5 text-center font-medium" dir="ltr">
                          {item.unit === 'cm'
                            ? `≈ ${(item.width / 100).toFixed(2)}m`
                            : `≈ ${Math.round(item.width * 100)}cm`}
                        </span>
                      </div>

                      {/* Height */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            الارتفاع ({item.unit === 'cm' ? 'سم' : 'م'}):
                          </label>
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={item.height || ''}
                          onChange={(e) =>
                            updateItem(item.id, { height: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 font-bold font-mono border border-slate-300 rounded bg-slate-50/50 text-center"
                        />
                        <span className="text-[10px] text-blue-600 font-mono block mt-0.5 text-center font-medium" dir="ltr">
                          {item.unit === 'cm'
                            ? `≈ ${(item.height / 100).toFixed(2)}m`
                            : `≈ ${Math.round(item.height * 100)}cm`}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          الكمية (العدد):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onChange={(e) =>
                            updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                          }
                          className="w-full px-2 py-1.5 font-bold font-mono border border-slate-300 rounded bg-slate-50/50 text-center"
                        />
                      </div>

                      {/* Area Result */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          المساحة الإجمالية:
                        </label>
                        <div className="px-2 py-1.5 font-bold font-mono bg-slate-100 rounded text-center text-slate-800 border border-slate-200">
                          {item.totalArea} م²
                        </div>
                      </div>

                      {/* Selling Price per Meter */}
                      <div>
                        <label className="block text-[11px] font-bold text-blue-700 mb-1">
                          سعر بيع المتر ({currency}):
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={item.pricePerMeter || ''}
                          onChange={(e) =>
                            updateItem(item.id, { pricePerMeter: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 font-bold font-mono border-2 border-blue-400 rounded text-center text-blue-950 bg-blue-50/40 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Item Total Price Bar */}
                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-semibold text-xs text-slate-600">إجمالي بيع هذا البند:</span>
                        <span className="font-bold text-blue-900 font-mono text-sm">
                          {formatCurrency(item.totalPrice, currency)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({item.totalArea} م² × {formatCurrency(item.pricePerMeter, currency)}{item.additionalPrice > 0 ? ` + إضافات ${formatCurrency(item.additionalPrice * item.quantity, currency)}` : ''})
                        </span>
                      </div>
                    </div>

                    {/* Dedicated Optional Additions Box (مسكات الباب، القفل، الإكسسوارات بالاتفاق مع الزبون) */}
                    {Boolean(item.hasAdditions || item.additionalPrice > 0 || item.additionalName) ? (
                      <div className="p-3 sm:p-4 bg-amber-50/70 border-t border-b border-amber-200/90 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-amber-200 text-amber-900 rounded-md">
                              <Key className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-amber-950">
                              مربع الإضافات والإكسسوارات (مسكات، قفل، إلخ بالاتفاق مع الزبون):
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                              اختياري
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, {
                                hasAdditions: false,
                                additionalName: '',
                                additionalPrice: 0,
                                additionalCost: 0,
                              })
                            }
                            className="text-[11px] text-rose-600 hover:text-rose-800 hover:bg-rose-100/60 px-2 py-1 rounded transition-colors flex items-center gap-1 font-medium"
                            title="إلغاء الإضافات وتفريغ السعر"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>إلغاء الإضافة</span>
                          </button>
                        </div>

                        {/* Additions Input Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                          {/* Addition Name / Description */}
                          <div className="sm:col-span-7">
                            <label className="block text-[11px] font-bold text-amber-950 mb-1">
                              بيان ونوع الإضافة (مسكة باب، قفل، إكسسوار):
                            </label>
                            <input
                              type="text"
                              value={item.additionalName || ''}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  additionalName: e.target.value,
                                  hasAdditions: true,
                                })
                              }
                              placeholder="مثال: مسكة باب، قفل، دفاش..."
                              className="w-full px-2.5 py-2 bg-white border border-amber-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 font-medium"
                            />
                          </div>

                          {/* Addition Price to Customer (Rolls up to Total) */}
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-bold text-amber-950 mb-1">
                              سعر بيع الإضافة للزبون ({currency}) <span className="text-emerald-700 font-bold">→ للإجمالي</span>:
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.additionalPrice || ''}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  additionalPrice: parseFloat(e.target.value) || 0,
                                  hasAdditions: true,
                                })
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-2 bg-white border-2 border-amber-400 rounded-lg font-bold font-mono text-center text-slate-900 focus:outline-hidden focus:border-amber-600 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Rollup Explanation Bar */}
                        <div className="bg-amber-100/70 p-2.5 rounded-lg border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] text-amber-950">
                            <span className="font-bold">تفصيل حساب البند مع الإضافة: </span>
                            <span>
                              فاتورة البيع ({item.totalArea} م² × {formatCurrency(item.pricePerMeter, currency)})
                              {item.additionalPrice > 0 && (
                                <span className="font-semibold text-amber-900">
                                  {' '}+ {formatCurrency(item.additionalPrice, currency)} {item.additionalName ? `(${item.additionalName})` : 'إضافات'}
                                  {item.quantity > 1 ? ` × ${item.quantity} قطع` : ''}
                                </span>
                              )}
                              {' '}={' '}
                              <span className="font-bold text-slate-900 font-mono text-xs">
                                {formatCurrency(item.totalPrice, currency)}
                              </span>
                            </span>
                          </div>

                          {item.additionalPrice > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-700" />
                              تم ترحيل +{formatCurrency((item.additionalPrice || 0) * (item.quantity || 1), currency)} إلى الإجمالي تلقائياً
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 sm:px-4 py-2 bg-slate-50/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { hasAdditions: true })}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 px-3 py-1.5 rounded-lg transition-all shadow-2xs active:scale-95"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span>+ إضافة مربع الإكسسوارات (مسكات باب، قفل، إلخ) بالاتفاق مع الزبون</span>
                        </button>
                        <span className="text-[11px] text-slate-400">
                          اختياري: يرحّل سعر الإضافة تلقائياً إلى إجمالي فاتورة البيع
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary & Settlement */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-amber-400">
                الملخص المالي لفاتورة البيع
              </h3>
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                التكاليف الفعلية مسجلة ومحسوبة في فواتير المشتريات
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Discount Input */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-semibold mb-1">
                  خصم مالي ممنوح للزبون ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full text-base font-bold font-mono px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-amber-300"
                />
              </div>

              {/* Deposit Input */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-semibold mb-1">
                  الدفعة المقدمة (العربون المستلم) ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={deposit || ''}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full text-base font-bold font-mono px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-emerald-400"
                />
              </div>

              {/* Remaining Balance */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="block text-slate-300 font-semibold mb-1">
                  المتبقي للتحصيل عند التسليم والتركيب:
                </span>
                <div className="text-xl font-black font-mono text-amber-400 mt-1">
                  {formatCurrency(totals.remainingBalance, currency)}
                </div>
              </div>
            </div>

            {/* Rolled-up Additions Total Notice */}
            {totalAdditionsAmount > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 px-3.5 py-2.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <Key className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">
                    يتضمن هذا العرض إضافات وإكسسوارات (مسكات، قفل، ملحقات) بقيمة إجمالية:
                  </span>
                </div>
                <span className="font-bold font-mono text-amber-300 text-sm bg-amber-900/60 px-2.5 py-1 rounded-lg border border-amber-600/40">
                  +{formatCurrency(totalAdditionsAmount, currency)} (مرحّلة في الإجمالي)
                </span>
              </div>
            )}

            {/* Financial Overview Tiles (Customer Sales Invoicing) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 text-center animate-in fade-in">
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">إجمالي بنود الفاتورة</span>
                <span className="text-sm sm:text-base font-bold font-mono text-white">
                  {formatCurrency(totals.subtotal, currency)}
                </span>
              </div>

              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">صافي الفاتورة النهائي</span>
                <span className="text-sm sm:text-base font-bold font-mono text-blue-400">
                  {formatCurrency(totals.finalSellingPrice, currency)}
                </span>
              </div>

              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">الدفعة الأولى / العربون</span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                  {formatCurrency(deposit, currency)}
                </span>
              </div>

              <div className="p-2.5 bg-slate-800/80 rounded-xl border border-amber-500/40">
                <span className="text-[11px] text-amber-400 block mb-0.5">المتبقي على الزبون</span>
                <span className="text-sm sm:text-base font-black font-mono text-amber-400">
                  {formatCurrency(totals.remainingBalance, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Automatic Linked Supplier Purchase Requisition Draft */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="flex items-start sm:items-center gap-2.5 cursor-pointer select-none text-xs text-slate-800">
              <input
                type="checkbox"
                checked={generateLinkedPurchase}
                onChange={(e) => setGenerateLinkedPurchase(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5 sm:mt-0"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  توليد مسودة فاتورة شراء خامات تلقائياً في قسم الموردين
                </span>
                <span className="text-[11px] text-slate-500 block">
                  تسجيل خامات هذه الفاتورة (مقاطع ألمنيوم، زجاج، قماش، مواتير) كفاتورة توريد في قسم الموردين
                </span>
              </div>
            </label>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300/80 px-2.5 py-1 rounded-lg shrink-0">
              ترحيل تلقائي لقسم الموردين
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialOrder ? 'حفظ تعديلات فاتورة البيع' : 'إصدار وحفظ فاتورة البيع'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
