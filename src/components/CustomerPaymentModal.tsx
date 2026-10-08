import React, { useState } from 'react';
import { CustomerOrder, WorkshopSettings } from '../types';
import { formatCurrency } from '../utils/calculator';

interface Props {
  isOpen: boolean;
  order: CustomerOrder;
  settings: WorkshopSettings;
  onClose: () => void;
  onConfirm: (collectedAmount: number, note?: string) => void;
}

export const CustomerPaymentModal: React.FC<Props> = ({
  isOpen,
  order,
  settings,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const currency = order.currency || settings.currency || '$';
  const remaining = Math.max(0, order.remainingBalance);

  // Helper to normalize decimal input across Arabic / English locales
  const normalizeDecimalInput = (raw: string): string => {
    let val = raw.replace(/[\u066B\u060C,]/g, '.');
    val = val.replace(/[\u0660-\u0669]/g, (d) =>
      (d.charCodeAt(0) - 0x0660).toString()
    );
    val = val.replace(/[\u06F0-\u06F9]/g, (d) =>
      (d.charCodeAt(0) - 0x06F0).toString()
    );
    return val;
  };

  // State
  const [amountInput, setAmountInput] = useState<string>(
    remaining > 0 ? String(remaining) : ''
  );

  // Parsed amount
  const parsedAmount = (() => {
    const norm = normalizeDecimalInput(amountInput);
    const num = parseFloat(norm);
    return isNaN(num) || num < 0 ? 0 : num;
  })();

  const newDeposit = Number(((order.deposit || 0) + parsedAmount).toFixed(2));
  const newRemaining = Math.max(
    0,
    Number((order.finalSellingPrice - newDeposit).toFixed(2))
  );

  const handleAmountChange = (valStr: string) => {
    const norm = normalizeDecimalInput(valStr);
    if (norm === '' || /^[0-9]*\.?[0-9]*$/.test(norm)) {
      setAmountInput(norm);
    }
  };

  const handlePresetClick = (amount: number) => {
    const cleanAmount = Number(amount.toFixed(2));
    setAmountInput(String(cleanAmount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      alert('يرجى إدخال مبلغ تحصيل صحيح أكبر من صفر.');
      return;
    }

    onConfirm(parsedAmount, 'دفعة سداد');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto overscroll-contain flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 pt-4 sm:pt-8 pb-36 sm:pb-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 w-full max-w-sm border border-slate-200 shadow-2xl text-right animate-in fade-in zoom-in-95 my-2 sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-slate-900 text-sm mb-1">
          تسجيل دفعة تحصيل من الزبون
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          الزبون: {order.customerName} • فاتورة: #{order.orderNumber}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">المتبقي حالياً:</span>
              <span className="font-bold font-mono text-rose-600">
                {formatCurrency(remaining, currency)}
              </span>
            </div>
            {parsedAmount > 0 && (
              <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-500">المتبقي بعد الدفعة:</span>
                <span
                  className={`font-bold font-mono ${
                    newRemaining === 0 ? 'text-emerald-600' : 'text-slate-700'
                  }`}
                >
                  {formatCurrency(newRemaining, currency)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مربع السداد - المبلغ المدفوع الآن ({currency}):
            </label>
            <input
              type="text"
              inputMode="decimal"
              dir="ltr"
              required
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border-2 border-amber-500 rounded-lg text-base font-bold font-mono text-center focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handlePresetClick(remaining)}
                className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold font-mono hover:bg-amber-100 cursor-pointer"
              >
                كامل المتبقي ({remaining})
              </button>
              {remaining >= 2 && (
                <button
                  type="button"
                  onClick={() => handlePresetClick(remaining / 2)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold font-mono hover:bg-slate-200 cursor-pointer"
                >
                  النصف ({Number((remaining / 2).toFixed(1))})
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={parsedAmount <= 0}
              className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer"
            >
              تأكيد السداد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
