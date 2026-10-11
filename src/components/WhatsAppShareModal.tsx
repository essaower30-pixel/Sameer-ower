import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  Briefcase,
  MessageSquare,
  FileDown,
  FileText,
  Image as ImageIcon,
  Download,
  Zap,
  AlertTriangle,
  Save,
  PhoneCall,
} from 'lucide-react';
import {
  shareViaNativeSheet,
  copyToClipboard,
  openWhatsApp,
  detectPhoneCountry,
  DetectedPhoneInfo,
} from '../utils/shareUtils';

interface Props {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  defaultPhone?: string;
  countryCode?: string;
  messageText: string;
  onClose: () => void;
  onUpdatePhone?: (phone: string) => void;
  onDownloadPdf?: () => void;
  onSharePdf?: (phoneOverride?: string, appType?: 'standard' | 'business') => void;
  onShareImage?: (phoneOverride?: string, appType?: 'standard' | 'business') => void;
  onShareImageFile?: () => void;
  onDownloadImage?: () => void;
}

export const WhatsAppShareModal: React.FC<Props> = ({
  isOpen,
  title,
  subtitle,
  defaultPhone = '',
  countryCode = '+963',
  messageText,
  onClose,
  onUpdatePhone,
  onDownloadPdf,
  onSharePdf,
  onShareImage,
  onShareImageFile,
  onDownloadImage,
}) => {
  const [phone, setPhone] = useState(defaultPhone || '');
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode || '+963');
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Sync phone state when defaultPhone changes
  useEffect(() => {
    setPhone(defaultPhone || '');
  }, [defaultPhone]);

  useEffect(() => {
    if (countryCode) {
      setSelectedCountryCode(countryCode);
    }
  }, [countryCode]);

  if (!isOpen) return null;

  const phoneInfo: DetectedPhoneInfo = detectPhoneCountry(phone, selectedCountryCode);

  const handleNativeShare = async () => {
    const success = await shareViaNativeSheet(title, messageText);
    if (success) {
      setShareSuccess('تمت المشاركة بنجاح عبر النظام');
      setTimeout(() => setShareSuccess(null), 3000);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(messageText);
    if (success) {
      setCopied(true);
      setShareSuccess('تم نسخ نص الفاتورة إلى الحافظة بنجاح!');
      setTimeout(() => {
        setCopied(false);
        setShareSuccess(null), 2500;
      });
    }
  };

  const handleSavePhone = () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneWarning('يرجى إدخال رقم الهاتف أولاً قبل الحفظ');
      setTimeout(() => setPhoneWarning(null), 3000);
      return;
    }
    if (onUpdatePhone) {
      onUpdatePhone(trimmed);
      setShareSuccess('✅ تم حفظ رقم الهاتف في الفاتورة بنجاح!');
      setPhoneWarning(null);
      setTimeout(() => setShareSuccess(null), 3500);
    }
  };

  const handleTriggerDirectSend = (type: 'standard' | 'business') => {
    const trimmed = phone.trim();
    if (!trimmed || !phoneInfo.isValid) {
      setPhoneWarning('⚠️ يرجى إدخال رقم هاتف الزبون للانتقال لمحادثته مباشرة دون بحث!');
      phoneInputRef.current?.focus();
      setTimeout(() => setPhoneWarning(null), 4000);
      return;
    }

    // Auto-save phone to order if it was edited
    if (trimmed !== defaultPhone && onUpdatePhone) {
      onUpdatePhone(trimmed);
    }

    const appLabel = type === 'business' ? 'واتساب للأعمال' : 'واتساب';

    if (onShareImage) {
      onShareImage(trimmed, type);
      setShareSuccess(`⚡ جاري فتح محادثة الزبون في ${appLabel}... نُسخت صورة الفاتورة للصقها فوراً!`);
    } else {
      openWhatsApp({
        phone: trimmed,
        text: messageText,
        type,
        countryCode: selectedCountryCode,
      });
      setShareSuccess(`⚡ جاري فتح محادثة الزبون في ${appLabel} مباشرة برقم هاتفه...`);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white">
              <Share2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{title}</h3>
              {subtitle && <p className="text-[11px] text-emerald-200">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Notification Alert if triggered */}
          {shareSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{shareSuccess}</span>
            </div>
          )}

          {/* Phone Warning Alert */}
          {phoneWarning && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in shake duration-200 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">{phoneWarning}</span>
            </div>
          )}

          {/* Customer Phone Status & Field */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>رقم هاتف الزبون للإرسال المباشر:</span>
              </label>

              {/* Status Indicator */}
              {phoneInfo.isValid ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span>دخول مباشر لمحادثته ✅</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>الرقم غير مسجل!</span>
                </span>
              )}
            </div>

            {/* Clear feedback showing the detected number and country */}
            {phoneInfo.isValid ? (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-2 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{phoneInfo.flag}</span>
                  <div>
                    <span className="text-[11px] text-emerald-950 font-black">
                      تم قراءة الرقم بنجاح: <span dir="ltr" className="font-mono text-xs">{phoneInfo.formattedDisplay}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      الدولة: {phoneInfo.countryName} • جاهز لفتح المحادثة مباشرة
                    </span>
                  </div>
                </div>
                {onUpdatePhone && phone.trim() !== defaultPhone && (
                  <button
                    type="button"
                    onClick={handleSavePhone}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                    title="حفظ الرقم في الفاتورة"
                  >
                    <Save className="w-3 h-3" />
                    <span>حفظ بالفاتورة</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-2 text-[11px] text-amber-950 flex items-start gap-1.5 leading-relaxed">
                <span className="text-amber-600 font-bold shrink-0 mt-0.5">⚠️</span>
                <span>
                  <strong>تنبيه:</strong> هذه الفاتورة لا تحتوي على رقم هاتف مسجل للزبون! اكتب رقمه في الخانة أدناه ليتم نقلك فوراً إلى محادثته الخاصة دون أن يطلب منك واتساب البحث عن اسمه.
                </span>
              </div>
            )}

            {/* Phone Input Box */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 0961141216 أو 0599123456"
                  dir="ltr"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all font-bold text-slate-900"
                />
                <span className="absolute left-3 top-2 text-[10px] text-slate-400 pointer-events-none">
                  {phoneInfo.flag}
                </span>
              </div>

              {onUpdatePhone && phone.trim() && (
                <button
                  type="button"
                  onClick={handleSavePhone}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="حفظ هذا الرقم في الفاتورة بشكل دائم"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>حفظ الرقم</span>
                </button>
              )}
            </div>

            {/* Country Shortcuts */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[10px] text-slate-500 font-bold">المفتاح الدولي:</span>
              {[
                { code: '+963', label: '🇸🇾 سوريا (+963)' },
                { code: '+970', label: '🇵🇸 فلسطين (+970)' },
                { code: '+962', label: '🇯🇴 الأردن (+962)' },
                { code: '+966', label: '🇸🇦 السعودية (+966)' },
                { code: '+961', label: '🇱🇧 لبنان (+961)' },
                { code: '+90', label: '🇹🇷 تركيا (+90)' },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountryCode(c.code);
                    if (phone.startsWith('0') && !phone.startsWith('00')) {
                      // Keep local number, selected country code applies automatically
                    }
                  }}
                  className={`text-[9px] px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer border ${
                    selectedCountryCode === c.code
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: Send Directly To Customer via WhatsApp / WhatsApp Business */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border-2 border-emerald-400/80 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    إرسال الفاتورة للزبون عبر واتساب (دخول مباشر ⚡)
                  </h4>
                  <p className="text-[10px] text-emerald-800">
                    يفتح محادثة الزبون مباشرة برقم هاتفه، مع نسخ صورة الفاتورة للصقها فوراً
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                مباشر للزبون
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* WhatsApp Business (Direct To Customer) */}
              <button
                type="button"
                onClick={() => handleTriggerDirectSend('business')}
                className="flex items-center gap-2.5 p-3 bg-white hover:bg-teal-50 active:bg-teal-100 border-2 border-teal-600 rounded-xl text-right transition-all group cursor-pointer shadow-xs hover:shadow-md order-1 sm:order-2"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Briefcase className="w-5 h-5 text-teal-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                    <span>واتساب للأعمال</span>
                    <span className="bg-teal-700 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-black">
                      Business
                    </span>
                  </div>
                  <div className="text-[10px] text-teal-700 font-bold truncate">
                    دخول مباشر لمحادثة الزبون ⚡
                  </div>
                </div>
              </button>

              {/* Standard WhatsApp (Direct To Customer) */}
              <button
                type="button"
                onClick={() => handleTriggerDirectSend('standard')}
                className="flex items-center gap-2.5 p-3 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-emerald-500 rounded-xl text-right transition-all group cursor-pointer shadow-xs hover:shadow-md order-2 sm:order-1"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <MessageSquare className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                    <span>واتساب العادي</span>
                    <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-black">
                      WhatsApp
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold truncate">
                    دخول مباشر لمحادثة الزبون ⚡
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-white/80 border border-emerald-200 rounded-xl p-2.5 text-[10px] text-emerald-950 flex items-start gap-1.5 leading-relaxed">
              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">💡</span>
              <span>
                <strong>كيف تعمل الميزة؟</strong> ينقلك التطبيق فوراً لمحادثة الزبون برقم هاتفه دون أي بحث، وتكون صورة الفاتورة منسوخة تلقائياً في الحافظة لتضغط <strong>(لصق / Paste)</strong> داخل المحادثة فتُرسل كصورة حقيقية فوراً، وبدون حفظ أي ملف في ذاكرة موبايلك.
              </span>
            </div>
          </div>

          {/* SECTION 2: Share Document File (PDF or Image) via System Share Sheet */}
          {(onSharePdf || onShareImageFile) && (
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950">
                      مشاركة ملف الفاتورة كمستند (PDF / صورة) 📄
                    </h4>
                    <p className="text-[10px] text-indigo-700">
                      إرسال ملف مستند رسمي في الذاكرة دون حفظه في هاتفك
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-200/80 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  ملف مستند
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {onSharePdf && (
                  <button
                    type="button"
                    onClick={() => {
                      onSharePdf(phone, 'business');
                      setShareSuccess('جاري فتح قائمة التطبيقات لمشاركة ملف الـ PDF...');
                    }}
                    className="flex items-center gap-2 p-2.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-indigo-300 rounded-xl text-right transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">مشاركة ملف PDF</div>
                      <div className="text-[10px] text-indigo-700 truncate">مستند رسمي عالي الدقة</div>
                    </div>
                  </button>
                )}

                {onShareImageFile && (
                  <button
                    type="button"
                    onClick={() => {
                      onShareImageFile();
                      setShareSuccess('جاري فتح قائمة التطبيقات لمشاركة ملف الصورة...');
                    }}
                    className="flex items-center gap-2 p-2.5 bg-white hover:bg-purple-50 active:bg-purple-100 border border-purple-300 rounded-xl text-right transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">مشاركة كملف صورة</div>
                      <div className="text-[10px] text-purple-700 truncate">ملف صورة PNG للمستند</div>
                    </div>
                  </button>
                )}
              </div>

              <div className="bg-indigo-100/60 rounded-xl p-2 text-[10px] text-indigo-900 flex items-start gap-1.5 leading-relaxed">
                <span className="text-indigo-600 font-bold shrink-0 mt-0.5">ℹ️</span>
                <span>
                  <strong>ملاحظة أمان أندرويد:</strong> إرسال ملف الـ PDF كملف مستند يتم عبر نافذة النظام لتحديد التطبيق المستلم. إذا أردت الانتقال الفوري لمحادثة الزبون دون فتح نافذة النظام، استخدم أزرار الواتساب الخضراء بالأعلى.
                </span>
              </div>
            </div>
          )}

          {/* SECTION 3: Download and Save Locally (Optional) */}
          {(onDownloadPdf || onDownloadImage) && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600">
                حفظ الفاتورة على الجهاز (اختياري):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onDownloadPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadPdf();
                      setShareSuccess('تم بدء تنزيل ملف PDF...');
                    }}
                    className="flex items-center gap-2.5 p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-right transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-rose-950">تحميل ملف PDF</div>
                      <div className="text-[10px] text-rose-700 truncate">حفظ المستند في هاتفك</div>
                    </div>
                  </button>
                )}

                {onDownloadImage && (
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadImage();
                      setShareSuccess('تم بدء تنزيل صورة الفاتورة...');
                    }}
                    className="flex items-center gap-2.5 p-2.5 bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 rounded-xl text-right transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-fuchsia-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-fuchsia-950">حفظ كصورة 🖼️</div>
                      <div className="text-[10px] text-fuchsia-700 truncate">حفظ في معرض الصور</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: Native Share & Text Copy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              >
                <Smartphone className="w-4 h-4 text-slate-600" />
                <span>مشاركة عبر تطبيقات أخرى</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                hasNativeShare ? '' : 'sm:col-span-2'
              } ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم نسخ النص بالكامل!' : 'نسخ نص الفاتورة للحافظة'}</span>
            </button>
          </div>

          {/* Collapsible Message Preview */}
          <details className="mt-2 group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-xs">
            <summary className="px-3.5 py-2 font-bold text-slate-700 cursor-pointer flex items-center justify-between hover:bg-slate-100 transition-colors">
              <span>معاينة نص الرسالة قبل الإرسال</span>
              <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3 bg-white border-t border-slate-200 text-slate-800 whitespace-pre-wrap text-[11px] font-sans max-h-40 overflow-y-auto leading-relaxed select-all">
              {messageText}
            </div>
          </details>
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
