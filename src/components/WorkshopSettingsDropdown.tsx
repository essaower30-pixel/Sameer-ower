import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Store,
  Phone,
  MapPin,
  Mail,
  Image as ImageIcon,
  Upload,
  Trash2,
  Save,
  Check,
  X,
  Coins,
  Download,
  RotateCcw,
  Info,
} from 'lucide-react';
import { WorkshopSettings, CustomerOrder, SUPPORTED_CURRENCIES, DEFAULT_SETTINGS } from '../types';

interface Props {
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
  orders: CustomerOrder[];
  onImportData: (data: { orders: CustomerOrder[]; settings: WorkshopSettings }) => void;
  onResetData: () => void;
}

export const WorkshopSettingsDropdown: React.FC<Props> = ({
  settings,
  onSaveSettings,
  orders,
  onImportData,
  onResetData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<WorkshopSettings>(settings);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when settings change externally
  useEffect(() => {
    setFormData(settings);
    setLogoPreview(settings.logoUrl || '');
  }, [settings]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalSettings: WorkshopSettings = {
      ...formData,
      workshopName: formData.workshopName.trim() || 'ورشة الألمنيوم والأكرديون',
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      email: formData.email?.trim() || '',
      logoUrl: logoPreview.trim(),
    };
    onSaveSettings(finalSettings);
    setFormData(finalSettings);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      setIsOpen(false);
    }, 1500);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 2MB for local storage safety)
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          alert('تم استيراد البيانات والنسخة الاحتياطية بنجاح!');
          setIsOpen(false);
        } else {
          alert('ملف النسخة الاحتياطية غير صالح');
        }
      } catch {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 3-Bar Hamburger Button at Top Right - Compact & perfectly balanced */}
      <button
        id="settings-hamburger-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1.5 h-9 w-9 md:w-auto md:px-2.5 rounded-xl font-bold text-xs transition-all border shadow-2xs shrink-0 ${
          isOpen
            ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-400'
        }`}
        title="إعدادات المحل والبيانات"
        aria-label="قائمة إعدادات المحل (ثلاث شرطات)"
      >
        {/* The 3 Dashes (ثلاث شرطات متناسقة وأنيقة) */}
        <div className="flex flex-col justify-center items-center gap-[3.5px] w-4 h-4 shrink-0" aria-hidden="true">
          <span className={`h-[2px] w-4 rounded-full transition-all ${isOpen ? 'bg-amber-700' : 'bg-slate-800'}`} />
          <span className={`h-[2px] w-4 rounded-full transition-all ${isOpen ? 'bg-amber-700' : 'bg-slate-800'}`} />
          <span className={`h-[2px] w-4 rounded-full transition-all ${isOpen ? 'bg-amber-700' : 'bg-slate-800'}`} />
        </div>
        <span className="hidden lg:inline text-xs font-bold text-slate-800">الإعدادات</span>
      </button>

      {/* Dropdown Window */}
      {isOpen && (
        <div
          id="settings-dropdown-window"
          className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 sm:p-5 text-right font-['Cairo',sans-serif] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">بيانات وإعدادات المحل</h2>
                <p className="text-[11px] text-slate-500">تظهر في ترويسة فواتير البيع والمستندات</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* 1. اسم المحل */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>اسم المحل / الورشة:</span>
              </label>
              <input
                id="shop-name-input"
                type="text"
                required
                value={formData.workshopName}
                onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                placeholder="مثال: ورشة الفن الحديث للألمنيوم"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50 font-medium"
              />
            </div>

            {/* 2. رقم الموبايل */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>رقم الموبايل / الواتساب:</span>
              </label>
              <input
                id="shop-phone-input"
                type="text"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0599000000"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50 font-mono text-right"
              />
            </div>

            {/* 3. العنوان */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>العنوان وموقع المحل:</span>
              </label>
              <input
                id="shop-address-input"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="المدينة - المنطقة الصناعية - الشارع الرئيسي"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50 font-medium"
              />
            </div>

            {/* 4. الايميل */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>البريد الإلكتروني (الايميل):</span>
              </label>
              <input
                id="shop-email-input"
                type="email"
                dir="ltr"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@workshop.com"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50 font-mono text-right"
              />
            </div>

            {/* 5. اللوقو */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>لوقو المحل / الشعار:</span>
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[10px] text-red-600 hover:text-red-700 flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>إزالة اللوقو</span>
                  </button>
                )}
              </label>

              {/* Logo Preview & Upload */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="لوقو المحل"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>اختر لوقو من جهازك</span>
                  </label>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    صورة PNG أو JPG أو SVG تظهر في الترويسة والفاتورة
                  </p>
                </div>
              </div>
            </div>

            {/* Currency selector quick note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>العملة المعتمدة:</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Price & Cost Notice */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">التكلفة وسعر البيع:</span>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  متغيرة وغير مقيدة، ويتم إدخالها وتعديلها بحرية في كل فاتورة بيع أو طلب جديد حسب المقاس ونوع الشغل.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                id="save-shop-settings-btn"
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98]"
              >
                {isSavedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">تم حفظ بيانات المحل بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>حفظ بيانات المحل</span>
                  </>
                )}
              </button>
            </div>

            {/* Backup & Tools Accordion */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={handleExportBackup}
                className="hover:text-slate-800 flex items-center gap-1"
                title="تحميل نسخة احتياطية من جميع البيانات والطلبات"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>نسخة احتياطية</span>
              </button>

              <label
                htmlFor="import-backup-file"
                className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                title="استرجاع نسخة احتياطية"
              >
                <Upload className="w-3 h-3 text-slate-400" />
                <span>استيراد نسخة</span>
                <input
                  id="import-backup-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('هل تريد استعادة الإعدادات الافتراضية؟')) {
                    onResetData();
                    setIsOpen(false);
                  }
                }}
                className="hover:text-red-600 flex items-center gap-1 text-slate-400"
                title="استعادة الإعدادات الأصلية"
              >
                <RotateCcw className="w-3 h-3" />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
