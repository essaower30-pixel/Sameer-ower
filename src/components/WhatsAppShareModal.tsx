import React, { useState } from 'react';
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
} from 'lucide-react';
import { shareViaNativeSheet, copyToClipboard } from '../utils/shareUtils';

interface Props {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  defaultPhone?: string;
  countryCode?: string;
  messageText: string;
  onClose: () => void;
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
  messageText,
  onClose,
  onDownloadPdf,
  onSharePdf,
  onShareImage,
  onShareImageFile,
  onDownloadImage,
}) => {
  const [phone, setPhone] = useState(defaultPhone);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

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
        setShareSuccess(null);
      }, 2500);
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

          {/* Privacy & Direct Delivery Notice */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-950 flex items-start gap-2">
            <span className="text-emerald-600 text-xs shrink-0 mt-0.5">⚡</span>
            <div>
              <span className="font-bold">إرسال فوري ومباشر للزبون: </span>
              عند الضغط على <strong className="text-teal-800">واتساب للأعمال</strong> أو <strong className="text-emerald-800">واتساب</strong> أدناه، يتم فتح محادثة الزبون مباشرة برقم هاتفه دون أي بحث، مع نسخ صورة الفاتورة تلقائياً لتلصقها (Paste) فوراً، ودون حفظ أي ملف في ذاكرة هاتفك.
            </div>
          </div>

          {/* Customer Phone Input Field */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>رقم هاتف الزبون:</span>
                {phone.trim() && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-600" />
                    دخول مباشر لمحادثته
                  </span>
                )}
              </label>
            </div>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 0933123456 أو 0791234567"
                dir="ltr"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
              />
              <span className="absolute left-3 top-2 text-[10px] text-slate-400 pointer-events-none">
                مع المفتاح الدولي أو بدونه
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">
              * عند إدخال الرقم يتم الدخول مباشرة إلى محادثة الزبون فوراً دون الحاجة للبحث عن اسمه.
            </p>
          </div>

          {/* SECTION 1: Send As Image / Direct Chat */}
          {onShareImage && (
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-purple-950">إرسال الفاتورة كصورة 🖼️</h4>
                    <p className="text-[10px] text-purple-700">دخول مباشر لمحادثة الزبون مع نسخ الصورة للصقها فوراً</p>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-200/80 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  دخول مباشر للزبون
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* WhatsApp Business for Image (Direct to Customer) */}
                <button
                  type="button"
                  onClick={() => {
                    onShareImage(phone, 'business');
                    setShareSuccess('جاري فتح محادثة الزبون في واتساب للأعمال... نُسخت صورة الفاتورة للصقها فوراً!');
                  }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-teal-50 active:bg-teal-100 border-2 border-teal-500 rounded-xl text-right transition-all group cursor-pointer shadow-2xs hover:shadow-xs order-1 sm:order-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>واتساب للأعمال</span>
                      <span className="bg-teal-700 text-white text-[9px] px-1 py-0.2 rounded font-mono font-bold">
                        Business
                      </span>
                    </div>
                    <div className="text-[10px] text-teal-700 font-medium truncate">
                      دخول مباشر لمحادثة الزبون
                    </div>
                  </div>
                </button>

                {/* Standard WhatsApp for Image (Direct to Customer) */}
                <button
                  type="button"
                  onClick={() => {
                    onShareImage(phone, 'standard');
                    setShareSuccess('جاري فتح محادثة الزبون في واتساب... نُسخت صورة الفاتورة للصقها فوراً!');
                  }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-emerald-400 rounded-xl text-right transition-all group cursor-pointer shadow-2xs hover:shadow-xs order-2 sm:order-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>واتساب العادي</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium truncate">
                      دخول مباشر لمحادثة الزبون
                    </div>
                  </div>
                </button>
              </div>

              {/* Optional: Native Share Sheet for Image file */}
              {onShareImageFile && (
                <button
                  type="button"
                  onClick={() => {
                    onShareImageFile();
                    setShareSuccess('جاري فتح قائمة مشاركة النظام لإرسال ملف الصورة...');
                  }}
                  className="w-full mt-1.5 py-2 px-3 bg-white hover:bg-purple-100/60 text-purple-900 border border-purple-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>مشاركة كملف صورة عبر قائمة تطبيقات أندرويد (Share Sheet)</span>
                </button>
              )}

              <div className="bg-purple-100/50 rounded-xl p-2 text-[10px] text-purple-900 flex items-start gap-1.5 leading-relaxed">
                <span className="text-purple-600 font-bold shrink-0 mt-0.5">💡</span>
                <span>
                  <strong>طريقة عمل الصورة:</strong> يتم نقلك مباشرة لمحادثة الزبون دون بحث، وتكون صورة الفاتورة منسوخة تلقائياً لتلصقها (Paste / أو الضغط على معاينة الصورة فوق الكيبورد) فتُرسل كصورة حقيقية فوراً.
                </span>
              </div>
            </div>
          )}

          {/* SECTION 2: Send As PDF File */}
          {onSharePdf && (
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950">إرسال الفاتورة كملف PDF 📄</h4>
                    <p className="text-[10px] text-indigo-700">مستند رسمي عالي الجودة مع التوقيع في الذاكرة دون تنزيل</p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-200/80 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  مشاركة مستند
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* WhatsApp Business for PDF */}
                <button
                  type="button"
                  onClick={() => {
                    onSharePdf(phone, 'business');
                    setShareSuccess('جاري فتح المشاركة... اختر واتساب للأعمال لإرسال ملف الـ PDF');
                  }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-teal-50 active:bg-teal-100 border-2 border-teal-500 rounded-xl text-right transition-all group cursor-pointer shadow-2xs hover:shadow-xs order-1 sm:order-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>واتساب للأعمال</span>
                      <span className="bg-teal-700 text-white text-[9px] px-1 py-0.2 rounded font-mono font-bold">
                        Business
                      </span>
                    </div>
                    <div className="text-[10px] text-teal-700 font-medium truncate">
                      مشاركة ملف PDF
                    </div>
                  </div>
                </button>

                {/* Standard WhatsApp for PDF */}
                <button
                  type="button"
                  onClick={() => {
                    onSharePdf(phone, 'standard');
                    setShareSuccess('جاري فتح المشاركة... اختر واتساب لإرسال ملف الـ PDF');
                  }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-emerald-400 rounded-xl text-right transition-all group cursor-pointer shadow-2xs hover:shadow-xs order-2 sm:order-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>واتساب العادي</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium truncate">
                      مشاركة ملف PDF
                    </div>
                  </div>
                </button>
              </div>

              <div className="bg-indigo-100/50 rounded-xl p-2 text-[10px] text-indigo-900 flex items-start gap-1.5 leading-relaxed">
                <span className="text-indigo-600 font-bold shrink-0 mt-0.5">ℹ️</span>
                <span>
                  <strong>مشاركة المستندات:</strong> يتم إرسال ملف الـ PDF مباشرة في الذاكرة دون حفظه في هاتفك. وتفتح نافذة المشاركة لتحديد التطبيق والجهة المستلمة وفق معايير أمان أندرويد.
                </span>
              </div>
            </div>
          )}

          {/* SECTION 3: Download and Save Locally */}
          {(onDownloadPdf || onDownloadImage) && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600">
                حفظ المستند على الجهاز:
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
                      <div className="text-[10px] text-rose-700 truncate">حفظ المستند في جهازك</div>
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
                      <div className="text-[10px] text-fuchsia-700 truncate">حفظ في المعرض / التنزيلات</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: Native Share and Copy Text */}
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
