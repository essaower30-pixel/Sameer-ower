import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Check, Smartphone, Sparkles, RefreshCw } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running inside standalone app, do not show install button
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>مثبت كتطبيق (أوفلاين)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowAndroidGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
        title="تثبيت التطبيق على الشاشة الرئيسية للعمل بدون إنترنت"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>تثبيت التطبيق</span>
      </button>

      {/* Android / Chrome Install Guidance Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  تثبيت تطبيق الورشة على أندرويد
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              تم تحديث أيقونة التطبيق (512×512) وملف التثبيت. لتثبيته كبرنامج مستقل على هاتفك:
            </p>

            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  قم <strong>بتحديث الصفحة (Refresh)</strong> مرة واحدة في Chrome حتى يتعرف المتصفح على أيقونة 512×512 الجديدة.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  اضغط على <strong>قائمة الثلاث نقاط (⋮)</strong> في أعلى المتصفح.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  اختر <strong>«تثبيت التطبيق» (Install app)</strong> وسيظهر التطبيق بأيقونته الجديدة مباشرة على شاشتك.
                </span>
              </li>
            </ol>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث الصفحة الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                فهمت، شكراً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instruction Modal */}
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
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
