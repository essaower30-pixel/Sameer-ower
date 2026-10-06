import React, { useState, useEffect } from 'react';
import {
  WorkshopSettings,
  ProductCategory,
  CustomerOrder,
  DEFAULT_SETTINGS,
  SUPPORTED_CURRENCIES,
  MeasurementUnit,
} from '../types';
import {
  Save,
  Wrench,
  Download,
  Upload,
  RotateCcw,
  Check,
  CircleDollarSign,
  FileText,
  Ruler,
  Coins,
  Sparkles,
} from 'lucide-react';

interface Props {
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
  orders: CustomerOrder[];
  onImportData: (data: { orders: CustomerOrder[]; settings: WorkshopSettings }) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  settings,
  onSaveSettings,
  orders,
  onImportData,
  onResetData,
}) => {
  const [formData, setFormData] = useState<WorkshopSettings>(settings);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [saveTimestamp, setSaveTimestamp] = useState<string | null>(null);

  // Synchronize when settings change from external actions (like currency bar in Navbar)
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleUpdateCost = (
    category: ProductCategory,
    field: 'costPerMeter' | 'pricePerMeter' | 'minArea',
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      defaultCosts: {
        ...prev.defaultCosts,
        [category]: {
          ...prev.defaultCosts[category],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalSettings: WorkshopSettings = {
      ...formData,
      workshopName: formData.workshopName.trim() || 'ورشة الألمنيوم والأكرديون المتكاملة',
    };
    onSaveSettings(finalSettings);
    setFormData(finalSettings);
    setIsSavedNotice(true);
    const now = new Date();
    setSaveTimestamp(
      now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    handleSave(e);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: formData,
      orders,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `workshop_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.orders && Array.isArray(parsed.orders)) {
          onImportData({
            orders: parsed.orders,
            settings: parsed.settings || DEFAULT_SETTINGS,
          });
          setFormData(parsed.settings || DEFAULT_SETTINGS);
          alert('تم استرجاع النسخة الاحتياطية بنجاح!');
        } else {
          alert('ملف النسخة الاحتياطية غير صالح.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>إعدادات الورشة والأسعار والتكاليف الافتراضية</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            خصص اسم ورشتك، العملة المستخدمة، والأسعار الافتراضية لتسريع عملية حساب فواتير البيع لزبائنك
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSavedNotice && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم الحفظ ({saveTimestamp})</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 ${
              isSavedNotice
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSavedNotice ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>تم حفظ التعديلات!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workshop Info */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>بيانات المحل / الورشة (تظهر في ترويسة الفاتورة وعرض السعر)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم المحل / الورشة:
              </label>
              <input
                type="text"
                required
                value={formData.workshopName}
                onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم المعلم / المدير المسؤول:
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رقم الهاتف / الواتساب:
              </label>
              <input
                type="text"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-right font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عنوان الورشة / المحل:
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>العملة المعتمدة في الورشة والفواتير:</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={
                    SUPPORTED_CURRENCIES.some((c) => c.code === formData.currency)
                      ? formData.currency
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setFormData({ ...formData, currency: e.target.value });
                    }
                  }}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                >
                  {SUPPORTED_CURRENCIES.map((cur) => (
                    <option key={cur.code} value={cur.code}>
                      {cur.name}
                    </option>
                  ))}
                  <option value="custom">عملة أخرى مخصصة...</option>
                </select>

                <input
                  type="text"
                  placeholder="رمز مخصص"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-24 text-xs sm:text-sm px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-bold text-center"
                  title="اكتب رمز العملة إذا لم يكن في القائمة"
                />
              </div>
            </div>

            {/* Exchange Rate Setting: USD to SYP */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>سعر صرف الدولار مقابل الليرة السورية (1$ = ل.س):</span>
                <span className="text-[11px] text-amber-700 font-normal">للتقارير المالية المزدوجة</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="50"
                  value={formData.usdToSypRate ?? 14500}
                  onChange={(e) => setFormData({ ...formData, usdToSypRate: Number(e.target.value) || 0 })}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono font-bold text-slate-800"
                  placeholder="مثلاً: 14500"
                />
                <span className="absolute left-3 top-2 text-xs font-bold text-amber-700">ل.س لكل 1 دولار</span>
              </div>
              <p className="text-[11px] text-amber-800/80">
                يُستخدم هذا السعر لحساب صافي الأرباح الموحد في التقرير المالي المزدوج عندما يكون لديك فواتير بالدولار وفواتير بالليرة.
              </p>
            </div>

            {/* Default Measurement Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-blue-600" />
                <span>وحدة القياس الافتراضية عند إدخال المقاسات:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, defaultUnit: 'cm' })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                    formData.defaultUnit === 'cm'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>سنتيمتر (سم)</span>
                  <span className="text-[10px] text-slate-500">(160 سم)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, defaultUnit: 'm' })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                    formData.defaultUnit === 'm'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>متر (م)</span>
                  <span className="text-[10px] text-slate-500">(1.60 م)</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                شروط العقد والضمان في الفاتورة:
              </label>
              <textarea
                rows={2}
                value={formData.invoiceNotes}
                onChange={(e) => setFormData({ ...formData, invoiceNotes: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Default Pricing Catalog per Category */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
            <span>الأسعار والتكاليف الافتراضية لكل فئة (لكل متر مربع)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aluminum */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
              <div className="flex items-center justify-between font-bold text-blue-900 text-sm">
                <span>ألمنيوم وشبابيك</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  مقطع خاص ودبل
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">تكلفة المتر:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.aluminum.costPerMeter}
                    onChange={(e) =>
                      handleUpdateCost('aluminum', 'costPerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-blue-800 block mb-1">سعر البيع:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.aluminum.pricePerMeter}
                    onChange={(e) =>
                      handleUpdateCost('aluminum', 'pricePerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-blue-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">الحد الأدنى م²:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.defaultCosts.aluminum.minArea}
                    onChange={(e) =>
                      handleUpdateCost('aluminum', 'minArea', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Accordion */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center justify-between font-bold text-amber-900 text-sm">
                <span>أبواب الأكرديون</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  PVC وجلد
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">تكلفة المتر:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.accordion.costPerMeter}
                    onChange={(e) =>
                      handleUpdateCost('accordion', 'costPerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-amber-900 block mb-1">سعر البيع:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.accordion.pricePerMeter}
                    onChange={(e) =>
                      handleUpdateCost('accordion', 'pricePerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-amber-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">الحد الأدنى م²:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.defaultCosts.accordion.minArea}
                    onChange={(e) =>
                      handleUpdateCost('accordion', 'minArea', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Zebra */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center justify-between font-bold text-emerald-900 text-sm">
                <span>شبابيك وستائر زيبرا</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  قماش تركي ورول
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">تكلفة المتر:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.zebra.costPerMeter}
                    onChange={(e) =>
                      handleUpdateCost('zebra', 'costPerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-900 block mb-1">سعر البيع:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.zebra.pricePerMeter}
                    onChange={(e) =>
                      handleUpdateCost('zebra', 'pricePerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-emerald-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">الحد الأدنى م²:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.defaultCosts.zebra.minArea}
                    onChange={(e) =>
                      handleUpdateCost('zebra', 'minArea', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Shutters */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
              <div className="flex items-center justify-between font-bold text-purple-900 text-sm">
                <span>أباجورات وشتر</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  فوم وحماية
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">تكلفة المتر:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.shutters.costPerMeter}
                    onChange={(e) =>
                      handleUpdateCost('shutters', 'costPerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-purple-900 block mb-1">سعر البيع:</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.defaultCosts.shutters.pricePerMeter}
                    onChange={(e) =>
                      handleUpdateCost('shutters', 'pricePerMeter', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-purple-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">الحد الأدنى م²:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.defaultCosts.shutters.minArea}
                    onChange={(e) =>
                      handleUpdateCost('shutters', 'minArea', parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar Card with Instant Feedback */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isSavedNotice ? (
              <div className="flex items-center gap-2.5 text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold animate-in fade-in w-full sm:w-auto">
                <div className="p-1 bg-emerald-600 text-white rounded-full">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>تم حفظ إعدادات الورشة والأسعار بنجاح في جهازك ({saveTimestamp})</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                يتم تطبيق الأسعار والإعدادات الجديدة تلقائياً على إصدار فواتير البيع وحساب المقاسات.
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 ${
              isSavedNotice
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-100 scale-100'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isSavedNotice ? (
              <>
                <Check className="w-5 h-5 text-white" />
                <span>تم الحفظ بنجاح! ✓</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ إعدادات الورشة والأسعار</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Floating Toast Notification for Instant Visibility Anywhere on Screen */}
      {isSavedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1 bg-emerald-500 text-slate-900 rounded-full">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-emerald-300">
              تم حفظ إعدادات الورشة والأسعار بنجاح!
            </p>
            <p className="text-[11px] text-slate-300">
              تم تحديث العملة والأسعار الافتراضية ومزامنتها فوراً ({saveTimestamp}).
            </p>
          </div>
        </div>
      )}

      {/* Backup, Export & Restore Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          النسخ الاحتياطي وإدارة البيانات
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>تنزيل نسخة احتياطية للطلبات (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>استرجاع نسخة احتياطية</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من رغبتك في استعادة النماذج والبيانات الافتراضية؟')) {
                onResetData();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors mr-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة البيانات التجريبية الأولية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
