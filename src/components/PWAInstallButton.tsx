import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Check, MoreVertical, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showSecondaryGuide, setShowSecondaryGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [installSuccessMessage, setInstallSuccessMessage] = useState(false);

  // If already running inside standalone app, show confirmed installed badge
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200">
        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>مثبت كتطبيق (أوفلاين)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    setIsProcessing(true);
    try {
      // 1. First attempt: Direct Native Install Prompt
      const result = await triggerInstall();

      if (result.hasDirectPrompt) {
        if (result.success) {
          setInstallSuccessMessage(true);
          setTimeout(() => setInstallSuccessMessage(false), 5000);
        }
        // Direct prompt was handled (either accepted or dismissed by user)
        return;
      }

      // If direct prompt is not yet ready, wait 400ms and retry once
      await new Promise((resolve) => setTimeout(resolve, 400));
      const retryResult = await triggerInstall();

      if (retryResult.hasDirectPrompt) {
        if (retryResult.success) {
          setInstallSuccessMessage(true);
          setTimeout(() => setInstallSuccessMessage(false), 5000);
        }
        return;
      }

      // 2. Second option (الخيار الثاني): Open 3-dots guidance modal
      setShowSecondaryGuide(true);
    } catch (err) {
      console.error('Direct install error:', err);
      setShowSecondaryGuide(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isProcessing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-75"
        title="تثبيت التطبيق مباشرة على هاتفك"
      >
        {isProcessing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 animate-bounce" />
        )}
        <span>{isProcessing ? 'جاري التثبيت...' : 'تثبيت التطبيق'}</span>
      </button>

      {/* Success Notification */}
      {installSuccessMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>تم تثبيت التطبيق بنجاح على جهازك!</span>
        </div>
      )}

      {/* Secondary Option Modal: 3 dots menu (الخيار الثاني: قائمة الثلاث نقاط) */}
      {showSecondaryGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <MoreVertical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    الخيار الثاني: التثبيت عبر قائمة المتصفح
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    إذا لم تظهر نافذة التثبيت المباشرة تلقائياً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSecondaryGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                أيقونة التطبيق الرسمية <strong>(512×512)</strong> جاهزة بالكامل. يمكنك التثبيت بالطريقة الثانية عبر قائمة Chrome:
              </span>
            </div>

            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span className="pt-0.5">
                  اضغط على <strong>قائمة الثلاث نقاط (⋮)</strong> في الزاوية العلوية لمتصفح Chrome.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span className="pt-0.5">
                  اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span className="pt-0.5">
                  اضغط <strong>تثبيت (Install)</strong>، وسيتم تنزيل التطبيق بأيقونته 512×512 ويعمل أوفلاين.
                </span>
              </li>
            </ol>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    const res = await triggerInstall();
                    if (res.hasDirectPrompt) {
                      setShowSecondaryGuide(false);
                      if (res.success) {
                        setInstallSuccessMessage(true);
                      }
                    } else {
                      window.location.reload();
                    }
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>إعادة محاولة التثبيت المباشر</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSecondaryGuide(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guidance Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                تثبيت التطبيق على آيفون (Safari)
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              لتثبيت التطبيق والعمل به كبرنامج كامل وسريع بدون إنترنت على جهاز الآيفون الخاص بك:
            </p>

            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  اضغط على زر <strong>المشاركة (Share)</strong>{' '}
                  <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> أسفل متصفح Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  مرر للأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  اضغط على <strong>«إضافة» (Add)</strong> في الزاوية العلوية، وسيظهر التطبيق على شاشة هاتفك فوراً!
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
