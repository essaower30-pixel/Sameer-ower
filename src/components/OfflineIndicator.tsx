import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, CheckCircle2, X } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [showBackOnlineNotice, setShowBackOnlineNotice] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
      setHasBeenOffline(true);
      setShowBackOnlineNotice(false);
    } else if (hasBeenOffline) {
      setShowBackOnlineNotice(true);
      const timer = setTimeout(() => {
        setShowBackOnlineNotice(false);
        setHasBeenOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  // If back online notification
  if (showBackOnlineNotice) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-3 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>تمت استعادة الاتصال بالإنترنت بنجاح</span>
        </div>
        <button
          type="button"
          onClick={() => setShowBackOnlineNotice(false)}
          className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // If offline
  if (!isOnline && !dismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 flex items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs animate-in fade-in slide-in-from-bottom-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>وضع أوفلاين (بدون إنترنت)</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              جميع الحسابات والفواتير والزبائن تعمل وتُحفظ محلياً 100%
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
          title="إخفاء التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
