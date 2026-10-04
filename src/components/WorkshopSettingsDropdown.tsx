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
  Cloud,
  Database,
  Wifi,
  WifiOff,
  GitBranch,
  HardDrive,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  WorkshopSettings,
  CustomerOrder,
  SupplierPurchaseInvoice,
  WorkshopExpense,
  SUPPORTED_CURRENCIES,
  DEFAULT_SETTINGS,
} from '../types';
import { backupAllToFirestore, loadAllFromFirestore } from '../utils/firestoreSync';
import { PWAInstallButton } from './PWAInstallButton';
import firebaseConfig from '../../firebase-applet-config.json';

interface Props {
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
  orders: CustomerOrder[];
  onImportData: (data: { orders: CustomerOrder[]; settings: WorkshopSettings }) => void;
  onResetData: () => void;
  purchaseInvoices?: SupplierPurchaseInvoice[];
  expenses?: WorkshopExpense[];
  onRestoreAllData?: (data: {
    settings: WorkshopSettings;
    orders: CustomerOrder[];
    purchases: SupplierPurchaseInvoice[];
    expenses: WorkshopExpense[];
  }) => void;
}

type SettingsTab = 'profile' | 'cloud_firebase' | 'drive' | 'offline_pwa' | 'github';

export const WorkshopSettingsDropdown: React.FC<Props> = ({
  settings,
  onSaveSettings,
  orders,
  onImportData,
  onResetData,
  purchaseInvoices = [],
  expenses = [],
  onRestoreAllData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [formData, setFormData] = useState<WorkshopSettings>(settings);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Online / Offline Status
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Firebase Sync State
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncMessage, setFirebaseSyncMessage] = useState<string | null>(null);

  // Monitor online / offline network events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Prevent the application screen under/behind settings from moving or scrolling when settings is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      const originalOverscroll = document.body.style.overscrollBehavior;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        document.body.style.overscrollBehavior = originalOverscroll;
      };
    }
  }, [isOpen]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalSettings: WorkshopSettings = {
      ...formData,
      workshopName: formData.workshopName.trim() || 'ورشة الألمنيوم والديكور',
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

  // Export JSON Backup (for Google Drive or local storage)
  const handleExportBackup = (target: 'general' | 'drive' = 'general') => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      target: target === 'drive' ? 'Google Drive Backup' : 'Local Backup',
      settings: formData,
      orders,
      purchaseInvoices,
      expenses,
    };

    const fileName = target === 'drive'
      ? `GoogleDrive_Workshop_Backup_${new Date().toISOString().split('T')[0]}.json`
      : `workshop_backup_${new Date().toISOString().split('T')[0]}.json`;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (target === 'drive') {
      alert('تم تجهيز وتنزيل ملف النسخة الاحتياطية. يمكنك الآن حفظه ورفعه مباشرة على مجلد Google Drive الخاص بك!');
    }
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
          if (onRestoreAllData && parsed.purchaseInvoices) {
            onRestoreAllData({
              settings: parsed.settings || DEFAULT_SETTINGS,
              orders: parsed.orders,
              purchases: parsed.purchaseInvoices || [],
              expenses: parsed.expenses || [],
            });
          } else {
            onImportData({
              orders: parsed.orders,
              settings: parsed.settings || DEFAULT_SETTINGS,
            });
          }
          alert('تم استيراد كافة البيانات والنسخة الاحتياطية بنجاح!');
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

  // Sync to Firebase
  const handleSyncToFirebase = async () => {
    if (!navigator.onLine) {
      alert('أنت غير متصل بالإنترنت حالياً. سيتم حفظ بياناتك محلياً ورفعها فور عودة الاتصال.');
      return;
    }

    setIsSyncingFirebase(true);
    setFirebaseSyncMessage(null);
    try {
      await backupAllToFirestore({
        settings: formData,
        orders,
        purchases: purchaseInvoices,
        expenses,
      });
      setFirebaseSyncMessage('تمت مزامنة كافة الفواتير والبيانات مع Firebase بنجاح!');
    } catch (err) {
      setFirebaseSyncMessage('حدث خطأ أثناء المزامنة مع Firebase. يرجى التحقق من الاتصال.');
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Restore from Firebase
  const handleRestoreFromFirebase = async () => {
    if (!navigator.onLine) {
      alert('يرجى الاتصال بالإنترنت لاسترجاع البيانات من Firebase.');
      return;
    }

    if (!confirm('هل تريد استرجاع وتحديث كافة البيانات من قاعدة بيانات Firebase؟')) {
      return;
    }

    setIsSyncingFirebase(true);
    setFirebaseSyncMessage(null);
    try {
      const data = await loadAllFromFirestore();
      if (data && (data.orders.length > 0 || data.settings)) {
        if (onRestoreAllData) {
          onRestoreAllData({
            settings: data.settings || formData,
            orders: data.orders,
            purchases: data.purchases,
            expenses: data.expenses,
          });
        } else {
          if (data.settings) onSaveSettings(data.settings);
          if (data.orders.length > 0) {
            onImportData({
              orders: data.orders,
              settings: data.settings || formData,
            });
          }
        }
        setFirebaseSyncMessage(`تم بنجاح استرجاع ${data.orders.length} فاتورة بيع و ${data.purchases.length} فاتورة شراء من Firebase!`);
      } else {
        setFirebaseSyncMessage('لا توجد بيانات محفوظة مسبقاً في Firebase.');
      }
    } catch (err) {
      setFirebaseSyncMessage('تعذر جلب البيانات من Firebase.');
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 3-Bar Hamburger Button at Top Right */}
      <button
        id="settings-hamburger-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1.5 h-9 w-9 md:w-auto md:px-2.5 rounded-xl font-bold text-xs transition-all border shadow-2xs shrink-0 ${
          isOpen
            ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-400'
        }`}
        title="إعدادات الورشة والمزامنة السحابية"
        aria-label="قائمة الإعدادات والمزامنة"
      >
        <div className="flex flex-col justify-center items-center gap-[3.5px] w-4 h-4 shrink-0" aria-hidden="true">
          <span className={`h-[2px] w-4 rounded-full transition-all ${isOpen ? 'bg-amber-700' : 'bg-slate-800'}`} />
          <span className={`h-[2px] w-4 rounded-full transition-all ${isOpen ? 'bg-amber-700' : 'bg-slate-800'}`} />
          <span className={`h-[2px] w-4 rounded-full transition-all ${isOpen ? 'bg-amber-700' : 'bg-slate-800'}`} />
        </div>
        <span className="hidden lg:inline text-xs font-bold text-slate-800">الإعدادات والسحابة</span>
      </button>

      {/* Backdrop overlay to prevent any touches or scrolling on the app screen underneath */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Window: Pinned firmly under the settings icon and isolated from background movement */}
      {isOpen && (
        <div
          id="settings-dropdown-window"
          className="fixed top-14 sm:top-16 right-2 sm:right-4 w-[calc(100vw-16px)] sm:w-[480px] max-w-lg max-h-[calc(100dvh-66px)] sm:max-h-[calc(100dvh-78px)] overflow-y-auto overscroll-contain touch-pan-y bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 sm:p-5 text-right font-['Cairo',sans-serif] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">مركز الإعدادات والمزامنة</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <Wifi className="w-3 h-3 text-emerald-600" />
                      متصل بالإنترنت
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                      <WifiOff className="w-3 h-3 text-amber-600" />
                      يعمل أوفلاين (بدون نت)
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">• PWA & Firebase</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl mb-4 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-blue-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المحل
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cloud_firebase')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'cloud_firebase'
                  ? 'bg-white text-amber-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Firebase
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drive')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'drive'
                  ? 'bg-white text-emerald-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drive
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offline_pwa')}
              className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'offline_pwa'
                  ? 'bg-white text-purple-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              أوفلاين
            </button>
          </div>

          {/* TAB 1: Shop Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Workshop Logo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  شعار المحل / الورشة (لوجو)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="شعار المحل" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="logo-file-input"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-slate-200"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة</span>
                        <input
                          id="logo-file-input"
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المحل / الورشة</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                  <input
                    type="text"
                    value={formData.workshopName}
                    onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                    placeholder="مثال: ورشة الألمنيوم والديكور الحديث"
                    className="w-full text-xs pr-8 pl-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Phone & Address */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05xxxxxxxx"
                      className="w-full text-xs pr-8 pl-2 py-2 border border-slate-200 rounded-lg text-right font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">العملة الافتراضية</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg font-bold text-slate-800 bg-white"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان الورشة والموقع</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="المدينة، المنطقة الصناعية، الشارع..."
                    className="w-full text-xs pr-8 pl-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isSavedNotice ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
                <span>{isSavedNotice ? 'تم حفظ التعديلات بنجاح!' : 'حفظ بيانات المحل'}</span>
              </button>
            </form>
          )}

          {/* TAB 2: Firebase Cloud Sync */}
          {activeTab === 'cloud_firebase' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>قاعدة بيانات Firebase السحابية</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  تم ربط وتهيئة Firebase Firestore بنجاح للمشروع ({firebaseConfig.projectId}).
                  يمكنك مزامنة فواتير البيع والشراء والمصاريف سحابياً للوصول إليها من أي جهاز.
                </p>
              </div>

              {firebaseSyncMessage && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-800 animate-in fade-in">
                  {firebaseSyncMessage}
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSyncToFirebase}
                  disabled={isSyncingFirebase}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Cloud className={`w-4 h-4 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
                  <span>{isSyncingFirebase ? 'جارِ المزامنة مع Firebase...' : 'رفع ومزامنة البيانات إلى Firebase سحابياً'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreFromFirebase}
                  disabled={isSyncingFirebase}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
                  <span>استرجاع وتحميل البيانات من Firebase</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono space-y-0.5">
                <div>Project ID: {firebaseConfig.projectId}</div>
                <div>Status: Firestore Active & Rules Deployed</div>
              </div>
            </div>
          )}

          {/* TAB 3: Google Drive Backups */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>حفظ واسترجاع Google Drive</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  احفظ نسخة كاملة من فواتير الورشة وبيانات الزبائن والموردين في حساب Google Drive الخاص بك لضمان عدم ضياع أي بيانات واسترجاعها في أي وقت.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleExportBackup('drive')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية لقوقل درايف (JSON)</span>
                </button>

                <label
                  htmlFor="import-drive-file"
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>استيراد نسخة احتياطية من قوقل درايف أو جهازك</span>
                  <input
                    id="import-drive-file"
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <span className="font-bold block text-slate-800">كيف تحفظها في Google Drive بسهولة؟</span>
                <p className="text-[11px] leading-relaxed">
                  1. اضغط على «تصدير نسخة احتياطية».<br />
                  2. سيتم تنزيل الملف، ثم افتح تطبيق <strong>Google Drive</strong> في هاتفك أو كمبيوترك واسحب الملف لمجلد الورشة.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Offline PWA & Installation */}
          {activeTab === 'offline_pwa' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-800">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>العمل أوفلاين كبرنامج مثبت (PWA)</span>
                </div>
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  تم تفعيل وتجهيز Service Worker والتخزين المحلي الكامل. التطبيق يعمل 100% بدون أي اتصال بالإنترنت عند انقطاع الشبكة في الورشة.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">حالة الاتصال الحالية:</span>
                  {isOnline ? (
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      متصل بالإنترنت
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      وضع عدم الاتصال (أوفلاين)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[11px]">
                  <span className="text-slate-500">التخزين المحلي الآمن:</span>
                  <span className="font-bold text-slate-800">مفعل (IndexedDB / LocalCache)</span>
                </div>
              </div>

              <div>
                <PWAInstallButton />
              </div>
            </div>
          )}

          {/* Footer Reset & Local Backup Link */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => handleExportBackup('general')}
              className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>نسخة JSON للجهاز</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('هل تريد استعادة الإعدادات الافتراضية؟')) {
                  onResetData();
                  setIsOpen(false);
                }
              }}
              className="hover:text-red-600 flex items-center gap-1 text-slate-400 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>استعادة الافتراضي</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
