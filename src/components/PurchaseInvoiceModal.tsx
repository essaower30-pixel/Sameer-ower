import React, { useState, useEffect } from 'react';
import {
  SupplierPurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseCategory,
  PURCHASE_CATEGORY_LABELS,
  WorkshopSettings,
} from '../types';
import {
  X,
  Plus,
  Trash2,
  Package,
  Calendar,
  Layers,
  Sparkles,
  Save,
  DollarSign,
  Phone,
  Building,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: SupplierPurchaseInvoice) => void;
  initialInvoice?: SupplierPurchaseInvoice | null;
  settings: WorkshopSettings;
  currency: string;
}

// Quick presets tailored to workshop real activity
const MATERIAL_PRESETS: {
  name: string;
  category: PurchaseCategory;
  defaultUnit: string;
  suggestedPrice: number;
}[] = [
  { name: 'بروفايل ألمنيوم سحاب 9سم أبيض مطفي (بارة 6م)', category: 'aluminum', defaultUnit: 'بارة', suggestedPrice: 28 },
  { name: 'بروفايل ألمنيوم مفصلي 4.5سم حلق وضلفة', category: 'aluminum', defaultUnit: 'بارة', suggestedPrice: 24 },
  { name: 'تيوبات ومواسير وزوايا تجميع ألمنيوم', category: 'aluminum', defaultUnit: 'بارة', suggestedPrice: 20 },
  { name: 'زجاج دبل جلاس عازل 24مم (عاكس أزرق)', category: 'glass', defaultUnit: 'م²', suggestedPrice: 18 },
  { name: 'زجاج مفرد مثلج أمان 6مم للشبابيك', category: 'glass', defaultUnit: 'م²', suggestedPrice: 15 },
  { name: 'شرائح باب أكرديون PVC مقوى عازل', category: 'accordion', defaultUnit: 'طقم', suggestedPrice: 32 },
  { name: 'مجاري سحب علوية وعجلات رولمان بلي للأكرديون', category: 'accordion', defaultUnit: 'قطعة', suggestedPrice: 12 },
  { name: 'أقفال ومقابض مغناطيسية لأبواب الأكرديون', category: 'accessories', defaultUnit: 'حبة', suggestedPrice: 4 },
  { name: 'رولات قماش ستائر زيبرا تركي بلاك آوت', category: 'zebra', defaultUnit: 'م²', suggestedPrice: 12 },
  { name: 'ماكينات كاسيت ألمنيوم وجنازير لستائر الزيبرا', category: 'zebra', defaultUnit: 'طقم', suggestedPrice: 7 },
  { name: 'محرك أباجور شتر سومفي فرنسي 20 نيوتن + ريموت', category: 'shutters', defaultUnit: 'طقم', suggestedPrice: 85 },
  { name: 'شرائح شتر ألمنيوم فوم عازل 45مم مع الإكسسوارات', category: 'shutters', defaultUnit: 'م²', suggestedPrice: 20 },
  { name: 'كرتونة سيليكون تركي أصلي عازل ضد الماء', category: 'accessories', defaultUnit: 'كرتونة', suggestedPrice: 22 },
];

export const PurchaseInvoiceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialInvoice,
  settings,
  currency: defaultCurrency,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [category, setCategory] = useState<PurchaseCategory>('aluminum');
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>(
    initialInvoice?.currency || defaultCurrency || settings.currency || '$'
  );
  const currency = invoiceCurrency;
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'check' | 'credit'>('cash');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseInvoiceItem[]>([
    {
      id: `pitem-${Date.now()}`,
      description: '',
      category: 'aluminum',
      quantity: 1,
      unit: 'بارة',
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);

  useEffect(() => {
    if (initialInvoice) {
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setSupplierName(initialInvoice.supplierName);
      setSupplierPhone(initialInvoice.supplierPhone || '');
      setSupplierAddress(initialInvoice.supplierAddress || '');
      setCategory(initialInvoice.category);
      setInvoiceDate(initialInvoice.invoiceDate);
      setDueDate(initialInvoice.dueDate || '');
      setPaidAmount(initialInvoice.paidAmount);
      setPaymentMethod(initialInvoice.paymentMethod || 'cash');
      setNotes(initialInvoice.notes || '');
      setInvoiceCurrency(initialInvoice.currency || defaultCurrency || settings.currency || '$');
      setItems(initialInvoice.items.length > 0 ? initialInvoice.items : []);
    } else {
      setInvoiceNumber(`PUR-${Math.floor(100 + Math.random() * 900)}`);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierAddress('');
      setCategory('aluminum');
      setInvoiceCurrency(defaultCurrency || settings.currency || '$');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setPaidAmount('');
      setPaymentMethod('cash');
      setNotes('');
      setItems([
        {
          id: `pitem-${Date.now()}`,
          description: '',
          category: 'aluminum',
          quantity: 1,
          unit: 'بارة',
          unitPrice: 0,
          totalPrice: 0,
        },
      ]);
    }
  }, [initialInvoice, isOpen]);

  if (!isOpen) return null;

  // Calculate invoice total from items
  const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const numericPaid = Number(paidAmount) || 0;
  const remainingAmount = Math.max(0, totalAmount - numericPaid);

  let calculatedStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (numericPaid >= totalAmount && totalAmount > 0) {
    calculatedStatus = 'paid';
  } else if (numericPaid > 0 && numericPaid < totalAmount) {
    calculatedStatus = 'partial';
  }

  const handleItemChange = (index: number, field: keyof PurchaseInvoiceItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) || 0 : target.quantity;
        const price = field === 'unitPrice' ? Number(value) || 0 : target.unitPrice;
        target.totalPrice = Math.round(qty * price * 100) / 100;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleAddItem = (preset?: (typeof MATERIAL_PRESETS)[0]) => {
    const newItem: PurchaseInvoiceItem = {
      id: `pitem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: preset ? preset.name : '',
      category: preset ? preset.category : category,
      quantity: 1,
      unit: preset ? preset.defaultUnit : 'بارة',
      unitPrice: preset ? preset.suggestedPrice : 0,
      totalPrice: preset ? preset.suggestedPrice : 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('يرجى كتابة اسم المورد أو الشركة');
      return;
    }

    const cleanedItems = items.filter((it) => it.description.trim() || it.totalPrice > 0);
    if (cleanedItems.length === 0) {
      alert('يرجى إضافة بند واحد على الأقل في فاتورة الشراء');
      return;
    }

    const newInvoice: SupplierPurchaseInvoice = {
      id: initialInvoice ? initialInvoice.id : `pur-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `PUR-${Date.now().toString().slice(-4)}`,
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim(),
      supplierAddress: supplierAddress.trim(),
      category,
      invoiceDate,
      dueDate: dueDate || undefined,
      items: cleanedItems,
      totalAmount,
      paidAmount: numericPaid,
      remainingAmount,
      paymentStatus: calculatedStatus,
      paymentMethod,
      notes: notes.trim(),
      currency: invoiceCurrency,
      exchangeRate: settings.usdToSypRate || 14500,
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
    };

    onSave(newInvoice);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                {initialInvoice ? 'تعديل فاتورة شراء خامات' : 'تسجيل فاتورة شراء من المورد'}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                ألمنيوم • أكرديون • زيبرا • شتر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Small icon & compact dropdown */}
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-xs shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <select
                value={invoiceCurrency}
                onChange={(e) => setInvoiceCurrency(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-hidden cursor-pointer"
                title="عملة فاتورة الشراء"
              >
                <option value="$">دولار ($)</option>
                <option value="ل.س">ليرة سورية (ل.س)</option>
                <option value="د.أ">دينار (د.أ)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Supplier & Invoice Info */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" />
              <span>بيانات المورد وفاتورة الشراء</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Supplier Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المورد / الشركة المصنعة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="مثال: شركة القدس لسحب الألمنيوم"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Supplier Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  هاتف / واتساب المورد
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="059xxxxxxx"
                    className="w-full text-xs sm:text-sm pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم فاتورة الشراء
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="PUR-101"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                />
              </div>

              {/* Primary Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  صنف وتصنيف التوريد
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PurchaseCategory)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-700"
                >
                  {Object.entries(PURCHASE_CATEGORY_LABELS).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>عملة فاتورة المشتريات:</span>
                </label>
                <select
                  value={invoiceCurrency}
                  onChange={(e) => setInvoiceCurrency(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-amber-50/70 font-bold text-slate-800"
                >
                  <option value="$">دولار أمريكي ($)</option>
                  <option value="ل.س">ليرة سورية (ل.س)</option>
                  <option value="د.أ">دينار أردني (د.أ)</option>
                </select>
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ فاتورة الشراء
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full text-xs sm:text-sm pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ استحقاق السداد (اختياري)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets for Common Workshop Materials */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>إضافة سريعة لخامات جاهزة شائعة:</span>
              </span>
              <span className="text-[11px] text-slate-400">انقر لإدراج البند فوراً في الجدول</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-150">
              {MATERIAL_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddItem(preset)}
                  className="text-xs px-2.5 py-1 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition-all shadow-2xs text-right truncate max-w-xs"
                  title={`${preset.name} - سعر مقترح: ${preset.suggestedPrice} ${currency}`}
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>بنود ومشتريات الفاتورة</span>
              </h3>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بند فارغ</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5 min-w-[220px]">بيان الخامة / البضاعة</th>
                      <th className="p-2.5 w-24">الوحدة</th>
                      <th className="p-2.5 w-24">الكمية</th>
                      <th className="p-2.5 w-28">سعر الوحدة ({currency})</th>
                      <th className="p-2.5 w-28">الإجمالي ({currency})</th>
                      <th className="p-2.5 w-12 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="مثال: بروفايل سحاب 9سم أبيض أو محرك سومفي 20 نيوتن"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                          >
                            <option value="بارة">بارة (6م)</option>
                            <option value="م²">م² (متر مربع)</option>
                            <option value="حبة">حبة / قطعة</option>
                            <option value="طقم">طقم كامل</option>
                            <option value="رول">رول قماش</option>
                            <option value="كرتونة">كرتونة</option>
                            <option value="كيلو">كيلو</option>
                            <option value="متر">متر طولي</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-center focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-center focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2 font-mono font-bold text-slate-900 text-xs">
                          {formatCurrency(item.totalPrice, currency)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1 rounded-md transition-colors"
                            title="حذف البند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. Totals & Payment Breakdown */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-3">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-700" />
              <span>الحسابات والمدفوعات والمتبقي للمورد</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Amount */}
              <div className="bg-white p-3 rounded-lg border border-amber-200">
                <span className="block text-[11px] font-bold text-slate-500">إجمالي الفاتورة المطلوب:</span>
                <span className="block text-lg font-black text-slate-900 font-mono mt-0.5">
                  {formatCurrency(totalAmount, currency)}
                </span>
              </div>

              {/* Paid Amount */}
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                  المبلغ المدفوع كاش / حوالة:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-2 py-1 border border-emerald-300 rounded font-mono font-bold text-emerald-900 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-500">{currency}</span>
                </div>
              </div>

              {/* Remaining Balance */}
              <div className="bg-white p-3 rounded-lg border border-rose-200">
                <span className="block text-[11px] font-bold text-rose-800">
                  المتبقي في ذمة الورشة للمورد:
                </span>
                <span
                  className={`block text-lg font-black font-mono mt-0.5 ${
                    remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(remainingAmount, currency)}
                </span>
              </div>
            </div>

            {/* Payment Method & Status summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">طريقة الدفع:</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  <option value="cash">نقداً (كاش)</option>
                  <option value="bank">تحويل بنكي / تطبيق بنكي</option>
                  <option value="check">شيك بنكي</option>
                  <option value="credit">آجل / ذمم موردين</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">حالة الفاتورة:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                    calculatedStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : calculatedStatus === 'partial'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {calculatedStatus === 'paid'
                    ? 'مسددة بالكامل'
                    : calculatedStatus === 'partial'
                    ? 'مسددة جزئياً'
                    : 'غير مسددة (آجلة)'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات وتفاصيل التوريد أو الشيكات
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم الاستلام في مستودع الورشة، دفعة الباقي تستحق نهاية الشهر..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{initialInvoice ? 'حفظ التعديلات' : 'حفظ فاتورة الشراء'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
