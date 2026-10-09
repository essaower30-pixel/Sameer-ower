import React, { useState } from 'react';
import { OrderItem, ItemOptions, KitchenComponentItem } from '../types';
import { formatCurrency } from '../utils/calculator';
import { QuantityStepper } from './QuantityStepper';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Check,
  Tag,
  Wrench,
  Boxes,
  HelpCircle,
  X,
  Lock,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  item: OrderItem;
  currency: string;
  onUpdateOptions: (options: ItemOptions) => void;
  onSyncComponentTotals: (componentsCost: number, componentsPrice: number) => void;
}

export const KITCHEN_LAYOUTS = [
  'شكل حرف L (زاوية)',
  'مستقيم I-Shape (جدار واحد)',
  'شكل حرف U (ثلاثة جدران)',
  'مطبخ مع جزيرة وسطية (Island)',
  'مطبخ متوازي (Parallel / Two Lines)',
];

export const KITCHEN_BODY_MATERIALS = [
  'خشب لاتيه إندونيسي 18ملم مقاوم للرطوبة',
  'MDF ميلامين مكسي عالي الكثافة (ضد الرطوبة)',
  'ألمنيوم دبل مع حشوة فوم وفورمايكا',
  'خشب صولد طبيعي (سويد / زان معالج)',
  'شاسيه ألمنيوم مع قواطع PVC',
];

export const KITCHEN_DOORS_TYPES = [
  'خشب هاي غلوس High Gloss ألماني/تركي فائق اللمعان',
  'بولي لاك Polylac مقاوم للخدش والحرارة',
  'كلادينج ألمنيوم كوري مقاوم للمياه والحرارة',
  'أكريليك فائق اللمعان (Acrylic)',
  'قشرة بلوط طبيعي (Oak Veneer)',
  'PVC ممبرين كلاسيك مع حفر CNC',
  'بروفيل ألمنيوم أسود مع زجاج عاكس/شفاف',
];

export const KITCHEN_COUNTERTOPS = [
  'رخام كوارتز تركي معالج (مقاوم للبقع)',
  'جرانيت طبيعي جلاكسي أسود إسباني',
  'رخام صناعي كوربان (Corian) بدون فواصل',
  'خشب كاونتر HPL معالج ومقاوم للحرارة',
  'رخام طبيعي شيفا كاشي هندي',
  'بدون رخام (توريد وتركيب الرخام على حساب الزبون)',
];

export const KITCHEN_HARDWARE = [
  'مفصلات ومجاري بلوم Blum نمساوي هيدروليك سوفت كلوز',
  'مفصلات هيدروليك سوفت كلوز قياسية',
  'ساميت Samet تركي هيدروليك عالي الجودة',
  'مجاري أدراج تانديم بوكس مخفية (Tandembox)',
  'مفصلات ومجاري إيطالي هيدروليك',
];

// تصنيفات الأصناف
const COMPONENT_CATEGORIES: { code: NonNullable<KitchenComponentItem['categoryType']>; label: string }[] = [
  { code: 'doors', label: 'درف وواجهات' },
  { code: 'body', label: 'صندوق وهيكل' },
  { code: 'countertop', label: 'رخام وكاونتر' },
  { code: 'hardware', label: 'مفصلات ومجاري' },
  { code: 'accessories', label: 'إكسسوارات وسلال' },
  { code: 'appliances', label: 'تجهيزات ومغاسل' },
  { code: 'other', label: 'خامات أخرى' },
];

// أصناف مقترحة جاهزة للإضافة السريعة مقسمة حسب كلام المعلم
const PRESET_COMPONENTS = [
  // 1. إضافات الرخام
  {
    name: 'رخام كاونتر كوارتز تركي معالج مع الحواف',
    categoryType: 'countertop' as const,
    quantity: 4,
    unit: 'متر طولي',
    unitCost: 30,
    unitPrice: 60,
    badge: 'رخام',
  },
  {
    name: 'رخام جرانيت طبيعي جلاكسي أسود إسباني',
    categoryType: 'countertop' as const,
    quantity: 4,
    unit: 'متر طولي',
    unitCost: 35,
    unitPrice: 70,
    badge: 'رخام',
  },
  // 2. إضافات المفصلات والمجاري
  {
    name: 'طقم مفصلات هيدروليك بلوم Blum نمساوي سوفت كلوز',
    categoryType: 'hardware' as const,
    quantity: 1,
    unit: 'طقم كامل',
    unitCost: 20,
    unitPrice: 40,
    badge: 'مفصلات',
  },
  {
    name: 'مجاري أدراج تانديم بوكس بلوم سوفت كلوز',
    categoryType: 'hardware' as const,
    quantity: 3,
    unit: 'طقم أدراج',
    unitCost: 40,
    unitPrice: 75,
    badge: 'مفصلات',
  },
  // 3. إضافات المسكات والمقابض
  {
    name: 'مقابض بروفيل ألمنيوم مخفي (Gola Profile)',
    categoryType: 'hardware' as const,
    quantity: 4,
    unit: 'متر طولي',
    unitCost: 8,
    unitPrice: 18,
    badge: 'مسكات',
  },
  {
    name: 'طقم مسكات ومقابض مودرن إيطالي للأبواب',
    categoryType: 'hardware' as const,
    quantity: 1,
    unit: 'طقم أبواب',
    unitCost: 15,
    unitPrice: 30,
    badge: 'مسكات',
  },
  // 4. إضافات السلال والإكسسوارات
  {
    name: 'سلة زاوية دوارة سحرية (Magic Corner) ستانلس',
    categoryType: 'accessories' as const,
    quantity: 1,
    unit: 'طقم',
    unitCost: 75,
    unitPrice: 130,
    badge: 'سلال',
  },
  {
    name: 'سلة بهارات وصوصات سحب هيدروليك',
    categoryType: 'accessories' as const,
    quantity: 1,
    unit: 'حبة',
    unitCost: 20,
    unitPrice: 38,
    badge: 'سلال',
  },
  {
    name: 'مطبقيه صحون هيدروليك ستانلس ستيل مع صينية ماء',
    categoryType: 'accessories' as const,
    quantity: 1,
    unit: 'حبة',
    unitCost: 25,
    unitPrice: 48,
    badge: 'سلال',
  },
  {
    name: 'شريط إضاءة LED مخفي بروفيل مع محول ومستشعر',
    categoryType: 'accessories' as const,
    quantity: 1,
    unit: 'طقم كامل',
    unitCost: 22,
    unitPrice: 45,
    badge: 'إضاءة',
  },
  // 5. التجهيزات والأحواض
  {
    name: 'حوض مجلى ستانلس ستيل تركي دبل عريض',
    categoryType: 'appliances' as const,
    quantity: 1,
    unit: 'حبة',
    unitCost: 55,
    unitPrice: 95,
    badge: 'مجلى',
  },
];

export const KitchenItemBuilder: React.FC<Props> = ({
  item,
  currency,
  onUpdateOptions,
  onSyncComponentTotals,
}) => {
  const options = item.options || {};
  const components: KitchenComponentItem[] = options.kitchenComponents || [];
  const rollupEnabled = options.kitchenComponentsRollup !== false;

  // State for new custom component form
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] =
    useState<NonNullable<KitchenComponentItem['categoryType']>>('accessories');
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<string>('حبة');
  const [customCost, setCustomCost] = useState<number | ''>('');
  const [customPrice, setCustomPrice] = useState<number | ''>('');

  // Update options helper
  const handleOptionsChange = (newOpts: Partial<ItemOptions>) => {
    const updated: ItemOptions = {
      ...options,
      ...newOpts,
    };
    onUpdateOptions(updated);
  };

  // Add component
  const handleAddComponent = (comp: Omit<KitchenComponentItem, 'id' | 'totalPrice'>) => {
    const qty = Number(comp.quantity) || 1;
    const price = Number(comp.unitPrice) || 0;
    const cost = Number(comp.unitCost) || 0;
    const newComponent: KitchenComponentItem = {
      ...comp,
      id: `kc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quantity: qty,
      unitPrice: price,
      unitCost: cost,
      totalPrice: Number((qty * price).toFixed(2)),
    };

    const newComponents = [...components, newComponent];
    const newOptions: ItemOptions = {
      ...options,
      kitchenComponents: newComponents,
    };
    onUpdateOptions(newOptions);

    // Calculate totals
    if (rollupEnabled) {
      const totalPrice = newComponents.reduce((sum, c) => sum + (c.totalPrice || c.unitPrice * c.quantity), 0);
      const totalCost = newComponents.reduce((sum, c) => sum + ((c.unitCost || 0) * c.quantity), 0);
      onSyncComponentTotals(totalCost, totalPrice);
    }
  };

  // Remove component
  const handleRemoveComponent = (id: string) => {
    const newComponents = components.filter((c) => c.id !== id);
    const newOptions: ItemOptions = {
      ...options,
      kitchenComponents: newComponents,
    };
    onUpdateOptions(newOptions);

    if (rollupEnabled) {
      const totalPrice = newComponents.reduce((sum, c) => sum + (c.totalPrice || c.unitPrice * c.quantity), 0);
      const totalCost = newComponents.reduce((sum, c) => sum + ((c.unitCost || 0) * c.quantity), 0);
      onSyncComponentTotals(totalCost, totalPrice);
    }
  };

  // Update component item directly
  const handleUpdateComponent = (id: string, updates: Partial<KitchenComponentItem>) => {
    const newComponents = components.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };
      const q = Number(updated.quantity) || 1;
      const p = Number(updated.unitPrice) || 0;
      updated.totalPrice = Number((q * p).toFixed(2));
      return updated;
    });

    const newOptions: ItemOptions = {
      ...options,
      kitchenComponents: newComponents,
    };
    onUpdateOptions(newOptions);

    if (rollupEnabled) {
      const totalPrice = newComponents.reduce((sum, c) => sum + (c.totalPrice || c.unitPrice * c.quantity), 0);
      const totalCost = newComponents.reduce((sum, c) => sum + ((c.unitCost || 0) * c.quantity), 0);
      onSyncComponentTotals(totalCost, totalPrice);
    }
  };

  // Submit custom item without nesting form
  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!customName.trim()) {
      return;
    }
    handleAddComponent({
      name: customName.trim(),
      categoryType: customCategory,
      quantity: Number(customQuantity) || 1,
      unit: customUnit.trim() || 'حبة',
      unitCost: customCost === '' ? 0 : Number(customCost),
      unitPrice: customPrice === '' ? 0 : Number(customPrice),
    });

    // Reset form
    setCustomName('');
    setCustomQuantity(1);
    setCustomCost('');
    setCustomPrice('');
    setShowAddForm(false);
  };

  // Calculated stats of kitchen components
  const totalComponentsPrice = components.reduce(
    (sum, c) => sum + (c.totalPrice || c.unitPrice * c.quantity),
    0
  );
  const totalComponentsCost = components.reduce(
    (sum, c) => sum + ((c.unitCost || 0) * c.quantity),
    0
  );
  const componentsProfit = totalComponentsPrice - totalComponentsCost;

  return (
    <div className="bg-gradient-to-b from-orange-50/70 via-amber-50/40 to-white rounded-xl border border-orange-200 shadow-2xs overflow-hidden space-y-4 p-4 text-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <span>تفصيل وتصنيع المطبخ (متر جر + الإضافات الاختيارية)</span>
              <span className="text-[10px] bg-orange-100 text-orange-900 font-bold px-2 py-0.5 rounded-full border border-orange-300">
                حساب متر جر
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              المقاس بمتر الجر × سعر المتر، يتبعه إضافات الرخام والمفصلات والمسكات الاختيارية
            </p>
          </div>
        </div>

        {/* Components count badge */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-orange-900 bg-orange-100/90 border border-orange-300 px-2.5 py-1 rounded-lg text-xs font-mono">
            {components.length} إضافات مسجلة
          </span>
        </div>
      </div>

      {/* Reassurance Banner regarding متر جر and Workshop Cost Privacy */}
      <div className="bg-amber-100/80 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-950">
        <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4 text-amber-800" />
        </div>
        <div className="space-y-1 leading-relaxed">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <span>طريقة حساب المطبخ: المقاس بمتر الجر يتبعه الإضافات الاختيارية</span>
          </div>
          <p className="text-[11px] text-amber-900">
            يُحسب المطبخ أساساً: <strong className="font-bold underline">المقاس بمتر الجر × سعر المتر</strong> (مثلاً 9 متر جر × 100$ = 900$) ويتبعه <strong>الإضافات الاختيارية</strong> (الرخام، المفصلات، المسكات، السلال...).
          </p>
          <div className="flex items-center gap-1.5 text-[10px] bg-white/70 px-2 py-1 rounded border border-amber-300/60 font-semibold text-amber-900 mt-1">
            <Lock className="w-3 h-3 text-amber-700 shrink-0" />
            <span><strong>سر المهنة:</strong> التكلفة لا تظهر إطلاقاً في فاتورة الزبون لأنها مسجلة في فواتير الشراء، وبمزامنة المشتريات مع المبيعات يحسب النظام صافي الأرباح تلقائياً في قائمة الأرباح والخسائر.</span>
          </div>
        </div>
      </div>

      {/* 1. المواصفات الأساسية لتصنيع المطبخ */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
          <Layers className="w-3.5 h-3.5 text-orange-600" />
          <span>المواصفات الرئيسية للمطبخ (الهيكل، الدرف، الرخام، المفصلات):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* شكل المطبخ */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              شكل وتصميم المطبخ:
            </label>
            <select
              value={options.kitchenLayout || KITCHEN_LAYOUTS[0]}
              onChange={(e) => handleOptionsChange({ kitchenLayout: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-orange-500"
            >
              {KITCHEN_LAYOUTS.map((layout) => (
                <option key={layout} value={layout}>
                  {layout}
                </option>
              ))}
            </select>
          </div>

          {/* نوع الدرف والواجهات */}
          <div>
            <label className="block text-[11px] font-bold text-orange-950 mb-1">
              نوع الدرف والواجهات (الخشب):
            </label>
            <select
              value={options.kitchenDoorsType || KITCHEN_DOORS_TYPES[0]}
              onChange={(e) => handleOptionsChange({ kitchenDoorsType: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-orange-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-orange-500"
            >
              {KITCHEN_DOORS_TYPES.map((door) => (
                <option key={door} value={door}>
                  {door}
                </option>
              ))}
            </select>
          </div>

          {/* نوع الرخام والكاونتر */}
          <div>
            <label className="block text-[11px] font-bold text-orange-950 mb-1">
              نوع الرخام / الكاونتر:
            </label>
            <select
              value={options.kitchenCountertop || KITCHEN_COUNTERTOPS[0]}
              onChange={(e) => handleOptionsChange({ kitchenCountertop: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-orange-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-orange-500"
            >
              {KITCHEN_COUNTERTOPS.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>

          {/* نوع هيكل وخشب الصندوق */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              خامة الهيكل والصندوق (Carcass):
            </label>
            <select
              value={options.kitchenCabinetBody || KITCHEN_BODY_MATERIALS[0]}
              onChange={(e) => handleOptionsChange({ kitchenCabinetBody: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-orange-500"
            >
              {KITCHEN_BODY_MATERIALS.map((body) => (
                <option key={body} value={body}>
                  {body}
                </option>
              ))}
            </select>
          </div>

          {/* نظام المفصلات والمجاري */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              نظام المفصلات والمجاري (Hardware):
            </label>
            <select
              value={options.kitchenHingesAndSlides || KITCHEN_HARDWARE[0]}
              onChange={(e) => handleOptionsChange({ kitchenHingesAndSlides: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-orange-500"
            >
              {KITCHEN_HARDWARE.map((hw) => (
                <option key={hw} value={hw}>
                  {hw}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. قسم الأصناف والخامات الداخلة في صناعة المطبخ */}
      <div className="space-y-3 pt-2 border-t border-orange-200/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-orange-600" />
            <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
              الأصناف والخامات الداخلة في صناعة المطبخ (Bill of Materials):
            </h5>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'إغلاق نموذج الإضافة' : '+ إضافة صنف جديد للمطبخ'}</span>
            </button>
          </div>
        </div>

        {/* أزرار إضافة سريعة للأصناف الشائعة بنقرة واحدة */}
        <div className="bg-orange-100/50 p-2.5 rounded-lg border border-orange-200 space-y-1.5">
          <span className="text-[11px] font-bold text-orange-950 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-600" />
            <span>إضافة سريعة للإضافات الاختيارية الشائعة (رخام، مفصلات، مسكات، سلال):</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COMPONENTS.map((preset, idx) => {
              const isAlreadyAdded = components.some((c) => c.name === preset.name);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleAddComponent({
                      name: preset.name,
                      categoryType: preset.categoryType,
                      quantity: preset.quantity,
                      unit: preset.unit,
                      unitCost: preset.unitCost,
                      unitPrice: preset.unitPrice,
                    })
                  }
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 border cursor-pointer ${
                    isAlreadyAdded
                      ? 'bg-orange-200/80 text-orange-950 border-orange-300 font-bold'
                      : 'bg-white hover:bg-orange-100/80 text-slate-700 border-orange-200 shadow-2xs'
                  }`}
                  title={`إضافة ${preset.name} بسعر ${formatCurrency(preset.unitPrice, currency)}`}
                >
                  <Plus className="w-3 h-3 text-orange-600 shrink-0" />
                  {preset.badge && (
                    <span className="text-[9px] bg-orange-100 text-orange-900 border border-orange-200 font-bold px-1 py-0.2 rounded shrink-0">
                      {preset.badge}
                    </span>
                  )}
                  <span>{preset.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                    ({formatCurrency(preset.unitPrice, currency)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* نموذج إضافة صنف يدوي مخصص (بدون وسم form لتجنب تداخل النماذج) */}
        {showAddForm && (
          <div
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            className="p-3 bg-white rounded-xl border border-orange-300 shadow-xs space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-bold text-orange-950 text-xs">
                إضافة صنف أو مادة يدوياً لصناعة المطبخ:
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              {/* اسم الصنف */}
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  اسم الصنف / الخامة: *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="مثال: لوح أكريليك تركي، سلة زاوية، شفاط..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-orange-500 text-xs"
                  required
                />
              </div>

              {/* التصنيف */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  التصنيف:
                </label>
                <select
                  value={customCategory}
                  onChange={(e) =>
                    setCustomCategory(e.target.value as NonNullable<KitchenComponentItem['categoryType']>)
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium"
                >
                  {COMPONENT_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* الكمية */}
              <div className="sm:col-span-1 min-w-[110px]">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">الكمية:</label>
                <QuantityStepper
                  value={Number(customQuantity) || 1}
                  onChange={(val) => setCustomQuantity(val)}
                  min={0.1}
                  step={1}
                  allowDecimals={true}
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* الوحدة */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">الوحدة:</label>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="حبة/م.ط"
                  className="w-full px-1.5 py-1.5 border border-slate-300 rounded text-center text-xs"
                />
              </div>

              {/* تكلفة الورشة */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  تكلفة الورشة ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={customCost}
                  onChange={(e) =>
                    setCustomCost(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                  }
                  placeholder=""
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-center font-mono text-xs"
                />
              </div>

              {/* سعر البيع للزبون */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-orange-950 mb-0.5">
                  سعر البيع للزبون ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={customPrice}
                  onChange={(e) =>
                    setCustomPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                  }
                  placeholder=""
                  className="w-full px-2 py-1.5 border-2 border-orange-400 rounded text-center font-mono font-bold text-xs bg-orange-50/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleCustomSubmit()}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition"
              >
                حفظ وإضافة الصنف للمطبخ
              </button>
            </div>
          </div>
        )}

        {/* قائمة الأصناف المضافة */}
        {components.length > 0 ? (
          <div className="border border-orange-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-orange-100/70 text-orange-950 border-b border-orange-200 font-bold">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">الإضافة / المادة الاختيارية (رخام، مفصلات، مسكات...)</th>
                    <th className="p-2 text-center w-28">الكمية</th>
                    <th className="p-2 text-center w-20">الوحدة</th>
                    <th className="p-2 text-center w-36 bg-amber-200/40 text-amber-950">
                      <span className="flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>تكلفة الورشة (خاص 🔒)</span>
                      </span>
                    </th>
                    <th className="p-2 text-center w-36 bg-orange-200/50 text-orange-950 font-black">
                      <span className="flex items-center justify-center gap-1">
                        <span>سعر بيع الزبون 💵</span>
                      </span>
                    </th>
                    <th className="p-2 text-left w-28">إجمالي الزبون</th>
                    <th className="p-2 text-center w-12">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {components.map((comp, idx) => {
                    return (
                      <tr key={comp.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={comp.name}
                            onChange={(e) => handleUpdateComponent(comp.id, { name: e.target.value })}
                            className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 focus:outline-hidden text-xs py-0.5"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <QuantityStepper
                            value={comp.quantity}
                            onChange={(val) =>
                              handleUpdateComponent(comp.id, {
                                quantity: val,
                              })
                            }
                            min={0.1}
                            step={1}
                            allowDecimals={true}
                            size="sm"
                            className="w-24 mx-auto"
                          />
                        </td>
                        <td className="p-2 text-center text-slate-500 font-medium">{comp.unit}</td>
                        <td className="p-2 text-center font-mono text-slate-600">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={comp.unitCost ?? 0}
                            onChange={(e) =>
                              handleUpdateComponent(comp.id, {
                                unitCost: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-1 py-0.5 border border-slate-200 rounded text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={comp.unitPrice}
                            onChange={(e) =>
                              handleUpdateComponent(comp.id, {
                                unitPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24 px-1.5 py-0.5 border-2 border-orange-300 rounded text-center font-mono font-bold text-xs bg-orange-50/40 text-orange-950"
                          />
                        </td>
                        <td className="p-2 text-left font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(comp.totalPrice || comp.unitPrice * comp.quantity, currency)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(comp.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                            title="حذف هذا الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ملخص أصناف المطبخ المالية */}
            <div className="p-3 bg-gradient-to-r from-orange-100/90 via-amber-50 to-orange-100/70 border-t border-orange-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-medium">إجمالي تكلفة الأصناف:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(totalComponentsCost, currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-950 font-bold">إجمالي سعر بيع الأصناف للزبون:</span>
                  <span className="font-mono font-black text-orange-900 text-sm">
                    {formatCurrency(totalComponentsPrice, currency)}
                  </span>
                </div>
                {totalComponentsPrice > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-800 font-medium">صافي ربح خامات التصنيع:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +{formatCurrency(componentsProfit, currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* زر الترحيل التلقائي */}
              <label className="flex items-center gap-2 cursor-pointer font-bold text-orange-950 bg-white/90 px-3 py-1.5 rounded-lg border border-orange-300 shadow-2xs">
                <input
                  type="checkbox"
                  checked={rollupEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleOptionsChange({ kitchenComponentsRollup: checked });
                    if (checked) {
                      onSyncComponentTotals(totalComponentsCost, totalComponentsPrice);
                    } else {
                      onSyncComponentTotals(0, 0);
                    }
                  }}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs">
                  ترحيل أسعار هذه الأصناف تلقائياً إلى إجمالي فاتورة بيع المطبخ
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-dashed border-orange-300 text-center space-y-2">
            <Package className="w-6 h-6 text-orange-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              لم تتم إضافة أصناف أو خامات خاصة بهذا المطبخ بعد
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              يمكنك النقر على أحد الأصناف المقترحة بالأعلى (مثل سلة زاوية دوارة، مفصلات بلوم، رخام كوارتز) أو النقر على زر &quot;إضافة صنف جديد للمطبخ&quot; لتسجيل أي مادة تدخل في تصنيعه.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
