import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Download,
  Share2,
  Printer,
  Smartphone,
  Sparkles,
  RotateCcw,
  MessageCircle,
  HelpCircle,
  Apple,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  appUrl?: string;
  onUrlChange?: (newUrl: string) => void;
  workshopName?: string;
  ownerName?: string;
  phone?: string;
  isCompact?: boolean;
}

export const PERMANENT_PUBLIC_APP_URL = 'https://ais-pre-vcjap6okc2rntse3oeifvb-105836077369.europe-west2.run.app';

export const sanitizeUrlForMobile = (rawUrl?: string): string => {
  if (!rawUrl || rawUrl.trim() === '') {
    return PERMANENT_PUBLIC_APP_URL;
  }
  let clean = rawUrl.trim();
  // Automatically convert private dev container URL (ais-dev-) to public permanent URL (ais-pre-)
  if (clean.includes('ais-dev-')) {
    clean = clean.replace('ais-dev-', 'ais-pre-');
  }
  return clean;
};

export const AppQRCodeCard: React.FC<Props> = ({
  appUrl,
  onUrlChange,
  workshopName = 'ورشة الألمنيوم والديكور',
  ownerName,
  phone,
  isCompact = false,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    return sanitizeUrlForMobile(appUrl);
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>(() => sanitizeUrlForMobile(appUrl));
  const [activeGuideTab, setActiveGuideTab] = useState<'iphone' | 'android' | null>('iphone');
  const printRef = useRef<HTMLDivElement>(null);

  // Sync when prop changes
  useEffect(() => {
    const clean = sanitizeUrlForMobile(appUrl);
    setCurrentUrl(clean);
    setInputUrl(clean);
  }, [appUrl]);

  // Generate QR code whenever currentUrl changes
  useEffect(() => {
    if (!currentUrl) return;

    QRCode.toDataURL(currentUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
      });
  }, [currentUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveCustomUrl = () => {
    let formatted = inputUrl.trim();
    if (formatted && !/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
    }
    formatted = sanitizeUrlForMobile(formatted);
    setCurrentUrl(formatted);
    setInputUrl(formatted);
    setIsEditingUrl(false);
    if (onUrlChange) {
      onUrlChange(formatted);
    }
  };

  const handleResetToCurrentOrigin = () => {
    const cleanUrl = PERMANENT_PUBLIC_APP_URL;
    setCurrentUrl(cleanUrl);
    setInputUrl(cleanUrl);
    setIsEditingUrl(false);
    if (onUrlChange) {
      onUrlChange(cleanUrl);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode-${(workshopName || 'workshop').replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `رابط نظام ${workshopName}:\n${currentUrl}\nيمكنك فتح الرابط وتثبيت التطبيق مباشرة على شاشة هاتفك (آيفون وأندرويد).`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>بطاقة باركود التطبيق - ${workshopName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f8fafc;
              padding: 20px;
            }
            .card {
              border: 3px solid #0f172a;
              border-radius: 24px;
              padding: 32px;
              text-align: center;
              background: white;
              max-width: 400px;
              width: 100%;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 6px 0;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin: 0 0 20px 0;
            }
            .qr-wrapper {
              background: #f1f5f9;
              padding: 16px;
              border-radius: 16px;
              display: inline-block;
              margin-bottom: 16px;
            }
            .qr-img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .scan-hint {
              font-size: 14px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 8px;
            }
            .instructions {
              font-size: 11px;
              color: #475569;
              line-height: 1.6;
              margin-bottom: 12px;
              text-align: right;
              background: #f8fafc;
              padding: 10px 14px;
              border-radius: 10px;
            }
            .url {
              font-size: 11px;
              color: #334155;
              word-break: break-all;
              font-family: monospace;
              direction: ltr;
              display: block;
              margin-top: 6px;
            }
            .footer {
              margin-top: 18px;
              padding-top: 12px;
              border-top: 1px dashed #cbd5e1;
              font-size: 12px;
              color: #334155;
            }
            @media print {
              body { background: white; padding: 0; }
              .card { box-shadow: none; border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="title">${workshopName}</h1>
            <p class="subtitle">نظام تفصيل وحساب مقاسات وفواتير الألمنيوم والديكور</p>
            <div class="qr-wrapper">
              <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="scan-hint">امسح الباركود بكاميرا هاتفك لفتح التطبيق وتثبيته</div>
            <div class="instructions">
              &bull; <strong>آيفون (Safari):</strong> اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».<br>
              &bull; <strong>أندرويد (Chrome):</strong> اضغط زر «تثبيت التطبيق» أو القائمة (⋮) ثم «تثبيت».
            </div>
            <span class="url">${currentUrl}</span>
            ${
              phone || ownerName
                ? `<div class="footer">
                    ${ownerName ? `<span>المسؤول: ${ownerName}</span> &bull; ` : ''}
                    ${phone ? `<span dir="ltr">هاتف: ${phone}</span>` : ''}
                  </div>`
                : ''
            }
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/60 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
              <span>رابط وباركود التطبيق للمحل (QR Code)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-300">
              امسح الباركود بكاميرا الهاتف لفتح التطبيق وتثبيته فوراً على الشاشة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrintCard}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition border border-white/10 cursor-pointer"
          title="طباعة بطاقة الباركود للتعليق في المحل"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>طباعة بطاقة الباركود</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* QR Code Preview Box */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div
            ref={printRef}
            className="p-3 bg-white rounded-2xl shadow-md border-2 border-amber-400/80 flex flex-col items-center justify-center relative group"
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="باركود رابط التطبيق"
                className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                جاري توليد الباركود...
              </div>
            )}
            <span className="mt-1 text-[10px] font-bold text-slate-800 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-blue-600" />
              <span>امسح بكاميرا الهاتف</span>
            </span>
          </div>

          {/* Download QR Button */}
          <button
            type="button"
            onClick={handleDownloadQR}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل صورة الباركود (PNG)</span>
          </button>
        </div>

        {/* Link Details and Actions */}
        <div className="md:col-span-8 space-y-3">
          {/* URL Box */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>رابط التطبيق المعتمد للمحل:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToCurrentOrigin}
                  className="text-[11px] text-blue-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                  title="استعادة رابط المتصفح الحالي"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>الرابط الحالي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer underline"
                >
                  {isEditingUrl ? 'إلغاء التعديل' : 'تعديل الرابط'}
                </button>
              </div>
            </div>

            {isEditingUrl ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  dir="ltr"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-slate-800 border border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomUrl}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  حفظ الرابط
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 gap-2">
                <span
                  dir="ltr"
                  className="text-xs text-blue-200 font-mono truncate select-all flex-1 text-left px-1"
                >
                  {currentUrl}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>

                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
                    title="فتح الرابط في نافذة جديدة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Reassurance banner explaining permanent standalone public URL */}
            <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 text-xs space-y-1 text-emerald-200 mt-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>الرابط العام الدائم (مباشر 24/7 دون الحاجة لقوقل استديو)</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                هذا الرابط مخصص للهواتف، يعمل بشكل مستقل ومباشر على الآيفون والأندرويد دون طلب تسجيل دخول وبدون خطأ 403 أو حظر الكوكيز في سفاري.
              </p>
            </div>
          </div>

          {/* Quick Sharing Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>مشاركة عبر واتساب</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-white/10 active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{copied ? 'تم نسخ الرابط!' : 'مشاركة الرابط'}</span>
            </button>
          </div>

          {/* Print on mobile screen fallback */}
          <div className="sm:hidden pt-1">
            <button
              type="button"
              onClick={handlePrintCard}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>طباعة بطاقة الباركود للتعليق في المحل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Device Help & Troubleshooting Guides (iPhone & Android) */}
      <div className="pt-2 border-t border-slate-700/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>إرشادات التشغيل والتثبيت على الهواتف:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveGuideTab(activeGuideTab === 'iphone' ? null : 'iphone')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
                activeGuideTab === 'iphone'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Apple className="w-3 h-3" />
              <span>هواتف آيفون (iPhone)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGuideTab(activeGuideTab === 'android' ? null : 'android')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
                activeGuideTab === 'android'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>هواتف أندرويد (Android)</span>
            </button>
          </div>
        </div>

        {/* iPhone Guide */}
        {activeGuideTab === 'iphone' && (
          <div className="bg-slate-800/90 border border-blue-500/30 rounded-xl p-3 text-xs space-y-2 text-slate-200 animate-in fade-in duration-150">
            <div className="font-bold text-blue-300 flex items-center gap-1.5">
              <Apple className="w-4 h-4 text-white" />
              <span>خطوات فتح وتثبيت التطبيق على أجهزة آيفون (iOS Safari):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 pr-1 leading-relaxed">
              <li>
                تأكد من فتح الرابط عبر متصفح <strong>سفاري (Safari)</strong> الأصلي على الآيفون.
              </li>
              <li>
                إذا ظهرت رسالة إذن ملفات الارتباط (Cookie Check): اضغط <strong>«Allow»</strong> أو <strong>«السماح»</strong> لمرة واحدة لفتح النظام.
              </li>
              <li>
                اضغط على زر <strong>المشاركة</strong> (مربع به سهم للأعلى ⬆️) في شريط سفاري بالأسفل.
              </li>
              <li>
                مرر لأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.
              </li>
              <li>
                اضغط <strong>«إضافة» (Add)</strong>، وسيظهر التطبيق فوراً على شاشة هاتفك كأيقونة تطبيق كاملة بدون شريط المتصفح!
              </li>
            </ol>
          </div>
        )}

        {/* Android Guide */}
        {activeGuideTab === 'android' && (
          <div className="bg-slate-800/90 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-2 text-slate-200 animate-in fade-in duration-150">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>حل مشكلة أندرويد وتثبيت التطبيق (Android Chrome):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 pr-1 leading-relaxed">
              <li>
                تم الآن تحديث ميزة العمل بدون إنترنت (Service Worker) بحيث يحفظ التطبيق بالكامل في ذاكرة الهاتف، لتشغيله مباشرة دون ظهور صفحة التحقق.
              </li>
              <li>
                اضغط زر <strong>«تثبيت التطبيق»</strong> الأخضر في الشريط العلوي لتثبيته مباشرة.
              </li>
              <li>
                إذا لم تظهر النافذة التلقائية: اضغط على الثلاث نقاط <strong>(⋮)</strong> في أعلى يسار متصفح Chrome، ثم اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
              </li>
              <li>
                سيفتح التطبيق المثبت على شاشة هاتفك الرئيسية بسرعة فائقة ويعمل حتى بدون اتصال إنترنت.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
