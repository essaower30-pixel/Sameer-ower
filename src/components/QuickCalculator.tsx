import React, { useState } from 'react';
import {
  ProductCategory,
  MeasurementUnit,
  OrderItem,
  WorkshopSettings,
  CATEGORY_LABELS,
} from '../types';
import { calculateItemMetrics, formatCurrency } from '../utils/calculator';
import { QuantityStepper } from './QuantityStepper';
import {
  Calculator,
  Plus,
  ArrowRight,
  Layers,
  RotateCcw,
  Check,
  Ruler,
  Info,
} from 'lucide-react';

interface Props {
  settings: WorkshopSettings;
  currency: string;
  onTransferToNewOrder: (items: OrderItem[]) => void;
}

export const QuickCalculator: React.FC<Props> = ({
  settings,
  currency,
  onTransferToNewOrder,
}) => {
  const [category, setCategory] = useState<ProductCategory>('aluminum');
  const [itemName, setItemName] = useState('شباك ألمنيوم');
  const [unit, setUnit] = useState<MeasurementUnit>(settings.defaultUnit || 'cm');
  const [width, setWidth] = useState<number>(settings.defaultUnit === 'm' ? 1.6 : 160);
  const [height, setHeight] = useState<number>(settings.defaultUnit === 'm' ? 1.4 : 140);
  const [quantity, setQuantity] = useState<number>(1);
  const [boxAllowanceCm, setBoxAllowanceCm] = useState<number>(25);
  const [hasBoxAllowance, setHasBoxAllowance] = useState<boolean>(true);

  // Smart unit switch with value conversion
  const handleUnitChange = (newUnit: MeasurementUnit) => {
    if (newUnit === unit) return;
    if (newUnit === 'm') {
      // from cm to m
      setWidth((prev) => Number((prev / 100).toFixed(3)));
      setHeight((prev) => Number((prev / 100).toFixed(3)));
    } else {
      // from m to cm
      setWidth((prev) => Math.round(prev * 100));
      setHeight((prev) => Math.round(prev * 100));
    }
    setUnit(newUnit);
  };

  // Price per meter (selling price only - cost is tracked in purchase invoices)
  const [pricePerMeter, setPricePerMeter] = useState<number>(
    settings.defaultCosts.aluminum.pricePerMeter
  );
  const [minArea, setMinArea] = useState<number>(
    settings.defaultCosts.aluminum.minArea
  );

  const [additionalPrice, setAdditionalPrice] = useState<number>(0);
  const [additionalNote, setAdditionalNote] = useState<string>('');

  // Basket of items calculated in this session
  const [calculatedItems, setCalculatedItems] = useState<OrderItem[]>([]);

  // When changing category, update defaults
  const handleCategoryChange = (cat: ProductCategory) => {
    setCategory(cat);
    const defaults = settings.defaultCosts[cat];
    setPricePerMeter(defaults.pricePerMeter);
    setMinArea(defaults.minArea);

    if (cat === 'aluminum') {
      setItemName('شباك ألمنيوم');
      setWidth(160);
      setHeight(140);
      setAdditionalPrice(0);
      setAdditionalNote('');
    } else if (cat === 'accordion') {
      setItemName('باب أكرديون');
      setWidth(100);
      setHeight(210);
      setAdditionalPrice(0);
      setAdditionalNote('');
    } else if (cat === 'zebra') {
      setItemName('ستائر زيبرا');
      setWidth(150);
      setHeight(180);
      setAdditionalPrice(0);
      setAdditionalNote('');
    } else if (cat === 'shutters') {
      setItemName('أباجور شتر ألمنيوم');
      setWidth(160);
      setHeight(140);
      setHasBoxAllowance(true);
      setBoxAllowanceCm(30);
      setAdditionalPrice(60);
      setAdditionalNote('محرك كهربائي');
    } else if (cat === 'kitchens') {
      setItemName('مطبخ تفصيل مودرن');
      setWidth(400);
      setHeight(220);
      setAdditionalPrice(0);
      setAdditionalNote('خشب هاي غلوس ورخام كوارتز');
    }
  };

  // Perform current live calculation
  // Cost is implicitly maintained from backend defaults without showing any cost inputs
  const currentMetrics = calculateItemMetrics({
    category,
    width,
    height,
    unit,
    quantity,
    minArea,
    costPerMeter: settings.defaultCosts[category].costPerMeter,
    pricePerMeter,
    additionalCost: 0,
    additionalPrice,
    options: {
      boxAllowanceCm: hasBoxAllowance && category === 'shutters' ? boxAllowanceCm : 0,
    },
  });

  // Add current item to session basket
  const handleAddToBasket = () => {
    const newItem: OrderItem = {
      id: `calc-${Date.now()}`,
      category,
      name: itemName || CATEGORY_LABELS[category].title,
      width: Number(width),
      height: Number(height),
      unit,
      quantity: Number(quantity) || 1,
      minArea: Number(minArea) || 0,
      calculatedArea: currentMetrics.calculatedArea,
      totalArea: currentMetrics.totalArea,
      costPerMeter: settings.defaultCosts[category].costPerMeter,
      pricePerMeter: Number(pricePerMeter),
      additionalCost: 0,
      additionalPrice: Number(additionalPrice) || 0,
      totalCost: currentMetrics.totalCost,
      totalPrice: currentMetrics.totalPrice,
      profit: currentMetrics.profit,
      profitMargin: currentMetrics.profitMargin,
      notes: additionalNote,
      hasAdditions: Boolean(additionalPrice > 0 || additionalNote),
      additionalName: additionalNote || undefined,
    };

    setCalculatedItems([newItem, ...calculatedItems]);
  };

  const handleRemoveFromBasket = (id: string) => {
    setCalculatedItems(calculatedItems.filter((item) => item.id !== id));
  };

  const handleCreateOrderFromSingle = () => {
    const singleItem: OrderItem = {
      id: `item-${Date.now()}`,
      category,
      name: itemName || CATEGORY_LABELS[category].title,
      width: Number(width),
      height: Number(height),
      unit,
      quantity: Number(quantity) || 1,
      minArea: Number(minArea) || 0,
      calculatedArea: currentMetrics.calculatedArea,
      totalArea: currentMetrics.totalArea,
      costPerMeter: settings.defaultCosts[category].costPerMeter,
      pricePerMeter: Number(pricePerMeter),
      additionalCost: 0,
      additionalPrice: Number(additionalPrice) || 0,
      totalCost: currentMetrics.totalCost,
      totalPrice: currentMetrics.totalPrice,
      profit: currentMetrics.profit,
      profitMargin: currentMetrics.profitMargin,
      notes: additionalNote,
      hasAdditions: Boolean(additionalPrice > 0 || additionalNote),
      additionalName: additionalNote || undefined,
    };
    onTransferToNewOrder([singleItem]);
  };

  // Basket totals
  const basketTotalSales = calculatedItems.reduce((acc, i) => acc + i.totalPrice, 0);
  const basketTotalArea = calculatedItems.reduce((acc, i) => acc + i.totalArea, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm mb-1.5">
            <Calculator className="w-4 h-4" />
            <span>حاسبة تسعير المقاسات وإصدار فاتورة بيع فورية للزبون</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            حساب المساحة وسعر بيع المتر والإجمالي المباشر
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            أدخل أبعاد الشباك أو الباب (العرض والارتفاع) وسعر البيع وسيقوم النظام فوراً بحساب المساحة بالمتر المربع
            وإجمالي الفاتورة للزبون بدقة تامة. تكلفة الخامات والمواد مسجلة ومحسوبة في فواتير المشتريات.
          </p>
        </div>
      </div>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Category Tabs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر نوع المنتج:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['aluminum', 'accordion', 'zebra', 'shutters', 'kitchens'] as ProductCategory[]).map((cat) => {
                const info = CATEGORY_LABELS[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{info.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension Inputs Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-blue-600" />
                <span>المقاسات والكمية</span>
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => handleUnitChange('cm')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    unit === 'cm'
                      ? 'bg-blue-600 shadow-xs text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  سنتيمتر (سم)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange('m')}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    unit === 'm'
                      ? 'bg-blue-600 shadow-xs text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  متر (م)
                </button>
              </div>
            </div>

            {/* Item Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                اسم أو وصف البند (مثال: شباك الصالة، باب المطبخ):
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Width, Height, Quantity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  العرض ({unit === 'cm' ? 'سم' : 'م'}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={width || ''}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-center"
                  placeholder={unit === 'cm' ? '160' : '1.6'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الارتفاع ({unit === 'cm' ? 'سم' : 'م'}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={height || ''}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-center"
                  placeholder={unit === 'cm' ? '140' : '1.4'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  العدد (الكمية):
                </label>
                <QuantityStepper
                  value={quantity || 1}
                  onChange={(val) => setQuantity(val)}
                  min={1}
                  size="md"
                  className="w-full h-[42px]"
                />
              </div>
            </div>

            {/* Shutters Box Allowance */}
            {category === 'shutters' && (
              <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="boxCheck"
                    checked={hasBoxAllowance}
                    onChange={(e) => setHasBoxAllowance(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300"
                  />
                  <label htmlFor="boxCheck" className="font-semibold text-purple-900 cursor-pointer">
                    إضافة زيادة ارتفاع صندوق الأباجور (عرف الورش والتصنيع)
                  </label>
                </div>
                {hasBoxAllowance && (
                  <div className="flex items-center gap-1">
                    <span className="text-purple-700">الزيادة:</span>
                    <input
                      type="number"
                      value={boxAllowanceCm}
                      onChange={(e) => setBoxAllowanceCm(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 bg-white border border-purple-300 rounded text-center font-bold"
                    />
                    <span className="text-purple-700">سم</span>
                  </div>
                )}
              </div>
            )}

            {/* Area Result Banner */}
            <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs border border-slate-200/80">
              <span className="text-slate-600">المساحة الإجمالية المحسوبة:</span>
              <div className="flex items-center gap-2 font-mono font-bold text-slate-900 text-sm">
                <span>{currentMetrics.totalArea}</span>
                <span className="text-slate-500">م²</span>
              </div>
            </div>
          </div>

          {/* Pricing Inputs Card (Selling Price Only) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>سعر بيع المتر والإضافات للزبون ({currency})</span>
            </h3>

            {/* Price per meter */}
            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
              <label className="block text-xs font-bold text-blue-900 mb-1.5">
                سعر بيع المتر المربع للزبون:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={pricePerMeter || ''}
                  onChange={(e) => setPricePerMeter(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-bold font-mono px-3 py-2 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-blue-950 text-center"
                />
                <span className="absolute left-3 top-3 text-xs text-blue-500 font-bold">
                  {currency}/م²
                </span>
              </div>
            </div>

            {/* Optional additions price */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700">
                إضافات وإكسسوارات اختيارية (مسكات، قفل، محرك، إلخ):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    اسم أو نوع الإضافة:
                  </label>
                  <input
                    type="text"
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    placeholder="مثال: مسكة باب، قفل، محرك سومفي"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    سعر بيع الإضافة للزبون ({currency}):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={additionalPrice || ''}
                      onChange={(e) => setAdditionalPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg bg-white text-center"
                    />
                    <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">{currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Explanation Note */}
            <div className="flex items-center gap-2 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-amber-900 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                تكاليف الخامات والمواد المشتراة تدار وتسجل في قسم <strong>فواتير المشتريات والموردين</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Mathematical Results & Instant Invoice Action (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Calculation Summary Box */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700">تفاصيل تسعير فاتورة البيع</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded">
                فاتورة بيع للزبون
              </span>
            </div>

            {/* Dimensions & Area Math breakdown */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>المقاس المدخل:</span>
                <span className="font-mono font-bold text-slate-800">
                  {width} × {height} {unit === 'cm' ? 'سم' : 'م'}
                </span>
              </div>

              {/* Converted reading */}
              <div className="flex items-center justify-between text-blue-700 bg-blue-50/60 px-2 py-1 rounded">
                <span>المعادل بالوحدة الأخرى:</span>
                <span className="font-mono font-semibold" dir="ltr">
                  {unit === 'cm'
                    ? `${(width / 100).toFixed(2)}m × ${(height / 100).toFixed(2)}m`
                    : `${Math.round(width * 100)}cm × ${Math.round(height * 100)}cm`}
                </span>
              </div>

              {category === 'shutters' && hasBoxAllowance && (
                <div className="flex items-center justify-between text-purple-700">
                  <span>ارتفاع الشتر بعد زيادة الصندوق:</span>
                  <span className="font-mono font-bold">
                    {currentMetrics.effectiveHeightM} م
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200">
                <span>مساحة الحبة الواحدة:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {currentMetrics.calculatedArea} م²
                  {currentMetrics.calculatedArea > currentMetrics.rawArea && (
                    <span className="text-[10px] text-amber-600 mr-1">(تم تطبيق الحد الأدنى)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span>إجمالي المساحة ({quantity} قطع):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {currentMetrics.totalArea} م²
                </span>
              </div>
            </div>

            {/* Financial Results */}
            <div className="space-y-3">
              {/* Selling Price */}
              <div className="p-4 bg-blue-50/80 border-2 border-blue-400 rounded-xl">
                <span className="text-xs font-bold text-blue-900 block mb-1">
                  إجمالي سعر البيع للزبون
                </span>
                <div className="text-3xl font-black text-blue-950 font-mono tracking-tight">
                  {formatCurrency(currentMetrics.totalPrice, currency)}
                </div>
                <div className="text-xs text-blue-700 mt-1 font-medium">
                  سعر الحبة الواحدة: {formatCurrency(currentMetrics.totalPrice / (quantity || 1), currency)}
                </div>
              </div>

              {/* Pricing breakdown summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>سعر بيع المتر:</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(pricePerMeter, currency)}</span>
                </div>
                {additionalPrice > 0 && (
                  <div className="flex items-center justify-between text-amber-800 font-medium">
                    <span>إضافات وملحقات {additionalNote ? `(${additionalNote})` : ''}:</span>
                    <span className="font-mono font-bold">+{formatCurrency(additionalPrice * quantity, currency)}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                  <span>تكلفة المواد والشراء:</span>
                  <span>تدار من قسم فواتير المشتريات</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCreateOrderFromSingle}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span>إصدار فاتورة بيع جديدة بهذا البند فوراً</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>

              <button
                onClick={handleAddToBasket}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-4 rounded-xl border border-slate-300 text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>إضافة إلى بنود فاتورة البيع المؤقتة</span>
              </button>
            </div>
          </div>

          {/* Session Basket of Calculated Items */}
          {calculatedItems.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>بنود فاتورة البيع المجمعة ({calculatedItems.length})</span>
                </div>
                <button
                  onClick={() => setCalculatedItems([])}
                  className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>تفريغ القائمة</span>
                </button>
              </div>

              {/* Items in basket */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {calculatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {item.quantity > 1 ? `(${item.quantity}×) ` : ''}
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.width}×{item.height} {item.unit === 'cm' ? 'سم' : 'م'} ({item.totalArea}م²)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900">
                        {formatCurrency(item.totalPrice, currency)}
                      </span>
                      <button
                        onClick={() => handleRemoveFromBasket(item.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Basket Totals */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي المساحة:</span>
                  <span className="font-bold font-mono">{basketTotalArea.toFixed(2)} م²</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-100">
                  <span>إجمالي البيع للزبون:</span>
                  <span className="font-bold text-blue-950 font-mono text-base">
                    {formatCurrency(basketTotalSales, currency)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onTransferToNewOrder(calculatedItems)}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>إصدار فاتورة بيع رسمية بهذه البنود ({calculatedItems.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
