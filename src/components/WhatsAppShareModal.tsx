import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  Briefcase,
  MessageSquare,
  ExternalLink,
  FileDown,
  FileText,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { openWhatsApp, shareViaNativeSheet, copyToClipboard } from '../utils/shareUtils';

interface Props {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  defaultPhone?: string;
  messageText: string;
  onClose: () => void;
  onDownloadPdf?: () => void;
  onSharePdf?: () => void;
  onShareImage?: () => void;
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
  onDownloadImage,
}) => {
  const [phone, setPhone] = useState(defaultPhone);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShareStandard = () => {
    openWhatsApp({
      phone,
      text: messageText,
      type: 'standard',
    });
    setShareSuccess('تم فتح واتساب العادي');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  const handleShareBusiness = () => {
    openWhatsApp({
      phone,
      text: messageText,
      type: 'business',
    });
    setShareSuccess('تم فتح واتساب الأعمال (Business)');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  const handleNativeShare = async () => {
    const success = await shareViaNativeSheet(title, messageText);
    if (success) {
      setShareSuccess('تمت المشاركة بنجاح');
      setTimeout(() => setShareSuccess(null), 3000);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(messageText);
    if (success) {
      setCopied(true);
      setShareSuccess('تم نسخ النص إلى الحافظة بنجاح!');
      setTimeout(() => {
        setCopied(false);
        setShareSuccess(null);
      }, 2500);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right">
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

        <div className="p-5 space-y-4">
          {/* Notification Alert if triggered */}
          {shareSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{shareSuccess}</span>
            </div>
          )}

          {/* Optional Phone Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم هاتف المستلم (اختياري للإرسال المباشر للرقم):
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 0791234567 أو 0933123456"
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-hidden"
              />
              <span className="absolute left-3 top-2.5 text-[10px] text-slate-400 pointer-events-none">
                مع مفتاح البلد أو بدونه
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              * إذا تركت الرقم فارغاً، سيفتح واتساب لتختار الزبون أو المجموعة مباشرة من جهات اتصالك.
            </p>
          </div>

          {/* Action Sharing Buttons Grid */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <span>اختر تطبيق المشاركة المطلوب:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* PDF Document Sharing (Direct file to WhatsApp/Contacts) */}
              {onSharePdf && (
                <button
                  type="button"
                  onClick={() => {
                    onSharePdf();
                    setShareSuccess('جاري إرسال الفاتورة كملف PDF...');
                  }}
                  className="flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100/90 active:bg-indigo-200 border-2 border-indigo-300/80 rounded-xl text-right transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                      <span>إرسال ملف PDF 📄</span>
                    </div>
                    <div className="text-[10px] text-indigo-700 truncate">
                      مستند PDF رسمي مع التوقيع
                    </div>
                  </div>
                </button>
              )}

              {/* Invoice Image Sharing (Direct image to WhatsApp chat) */}
              {onShareImage && (
                <button
                  type="button"
                  onClick={() => {
                    onShareImage();
                    setShareSuccess('جاري إرسال الفاتورة كصورة...');
                  }}
                  className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100/90 active:bg-purple-200 border-2 border-purple-300/80 rounded-xl text-right transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-purple-950 flex items-center gap-1">
                      <span>إرسال الفاتورة كصورة 🖼️</span>
                    </div>
                    <div className="text-[10px] text-purple-700 truncate">
                      تظهر مباشرة بمحادثة واتساب
                    </div>
                  </div>
                </button>
              )}

              {/* PDF Download */}
              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={() => {
                    onDownloadPdf();
                    setShareSuccess('تم بدء تنزيل ملف PDF...');
                  }}
                  className="flex items-center gap-3 p-3 bg-rose-50 hover:bg-rose-100/90 active:bg-rose-200 border-2 border-rose-300/80 rounded-xl text-right transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-rose-950 flex items-center gap-1">
                      <span>تحميل ملف PDF</span>
                    </div>
                    <div className="text-[10px] text-rose-700 truncate">
                      حفظ مستند PDF في جهازك
                    </div>
                  </div>
                </button>
              )}

              {/* Image Download */}
              {onDownloadImage && (
                <button
                  type="button"
                  onClick={() => {
                    onDownloadImage();
                    setShareSuccess('تم بدء تنزيل صورة الفاتورة...');
                  }}
                  className="flex items-center gap-3 p-3 bg-fuchsia-50 hover:bg-fuchsia-100/90 active:bg-fuchsia-200 border-2 border-fuchsia-300/80 rounded-xl text-right transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-fuchsia-950 flex items-center gap-1">
                      <span>حفظ كصورة 🖼️</span>
                    </div>
                    <div className="text-[10px] text-fuchsia-700 truncate">
                      حفظ في المعرض أو التنزيلات
                    </div>
                  </div>
                </button>
              )}

              {/* Standard WhatsApp */}
              <button
                type="button"
                onClick={handleShareStandard}
                className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200 border-2 border-emerald-300/80 rounded-xl text-right transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                    <span>واتساب العادي</span>
                    <ExternalLink className="w-3 h-3 text-emerald-700" />
                  </div>
                  <div className="text-[10px] text-emerald-700 truncate">
                    WhatsApp Messenger
                  </div>
                </div>
              </button>

              {/* WhatsApp Business */}
              <button
                type="button"
                onClick={handleShareBusiness}
                className="flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100/90 active:bg-teal-200 border-2 border-teal-300/80 rounded-xl text-right transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-teal-950 flex items-center gap-1">
                    <span>واتساب للأعمال</span>
                    <span className="bg-teal-700 text-white text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                      Business
                    </span>
                  </div>
                  <div className="text-[10px] text-teal-700 truncate">
                    WhatsApp Business الرسمي
                  </div>
                </div>
              </button>
            </div>

            {/* Native Sheet & Copy Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {hasNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-slate-600" />
                  <span>مشاركة عبر تطبيقات الموبايل</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  hasNativeShare ? '' : 'sm:col-span-2'
                } ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ النص بالكامل!' : 'نسخ نص الرسالة للحافظة'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Message Preview */}
          <details className="mt-3 group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-xs">
            <summary className="px-3.5 py-2 font-bold text-slate-700 cursor-pointer flex items-center justify-between hover:bg-slate-100 transition-colors">
              <span>معاينة نص الرسالة قبل الإرسال</span>
              <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3 bg-white border-t border-slate-200 text-slate-800 whitespace-pre-wrap text-[11px] font-sans max-h-48 overflow-y-auto leading-relaxed select-all">
              {messageText}
            </div>
          </details>
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
