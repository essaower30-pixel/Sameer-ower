import React, { useState } from 'react';
import { CustomerOrder, WorkshopSettings, CATEGORY_LABELS, OrderPaymentRecord, SUPPORTED_FONTS } from '../types';
import { formatCurrency, getOrderPayments } from '../utils/calculator';
import {
  generateCustomerInvoiceText,
  openWhatsApp,
} from '../utils/shareUtils';
import {
  Printer,
  Share2,
  X,
  Wrench,
  CheckCircle,
  Briefcase,
  MessageSquare,
  PenTool,
  RotateCcw,
  Sparkles,
  DollarSign,
  Receipt,
  Plus,
  Trash2,
  FileDown,
  Send,
  Loader2,
  Check,
  Image as ImageIcon,
  Download,
  Edit2,
  Settings as SettingsIcon,
  Type,
  Mail,
} from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { CustomerPaymentModal } from './CustomerPaymentModal';
import { exportElementToPdf, exportElementToImage, shareFileDirectly } from '../utils/pdfExport';

interface Props {
  order: CustomerOrder | null;
  settings: WorkshopSettings;
  currency: string;
  onUpdateOrder?: (order: CustomerOrder) => void;
  onSaveSettings?: (settings: WorkshopSettings) => void;
  onClose: () => void;
}

export const InvoiceModal: React.FC<Props> = ({
  order: initialOrder,
  settings,
  currency: defaultCurrency,
  onUpdateOrder,
  onSaveSettings,
  onClose,
}) => {
  if (!initialOrder) return null;

  // Local state for immediate signature updates
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder>(initialOrder);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [signingTarget, setSigningTarget] = useState<'customer' | 'workshop' | null>(null);
  const [isCollectingPayment, setIsCollectingPayment] = useState(false);
  const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = useState(false);
  const [headerFormData, setHeaderFormData] = useState({
    workshopName: settings.workshopName,
    ownerName: settings.ownerName || '',
    managementTitle: settings.managementTitle ?? 'إدارة:',
    phone: settings.phone,
    email: settings.email || '',
    fontFamily: settings.fontFamily || 'Cairo',
    invoiceNotes: settings.invoiceNotes || '',
    showTermsHeading: !!settings.showTermsHeading,
    hideTermsBox: !!settings.hideTermsBox,
  });

  // Sync header form data whenever settings change
  React.useEffect(() => {
    setHeaderFormData({
      workshopName: settings.workshopName,
      ownerName: settings.ownerName || '',
      managementTitle: settings.managementTitle ?? 'إدارة:',
      phone: settings.phone,
      email: settings.email || '',
      fontFamily: settings.fontFamily || 'Cairo',
      invoiceNotes: settings.invoiceNotes || '',
      showTermsHeading: !!settings.showTermsHeading,
      hideTermsBox: !!settings.hideTermsBox,
    });
  }, [settings]);

  const handleSaveHeaderSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedSettings: WorkshopSettings = {
      ...settings,
      workshopName: headerFormData.workshopName.trim() || settings.workshopName,
      ownerName: headerFormData.ownerName.trim(),
      managementTitle: headerFormData.managementTitle,
      phone: headerFormData.phone.trim(),
      email: headerFormData.email.trim(),
      fontFamily: headerFormData.fontFamily,
      invoiceNotes: headerFormData.invoiceNotes,
      showTermsHeading: headerFormData.showTermsHeading,
      hideTermsBox: headerFormData.hideTermsBox,
    };
    if (onSaveSettings) {
      onSaveSettings(updatedSettings);
    }
    try {
      localStorage.setItem('workshop_settings', JSON.stringify(updatedSettings));
    } catch (err) {
      console.error(err);
    }
    setIsEditHeaderModalOpen(false);
  };

  const currency = currentOrder.currency || defaultCurrency;
  const messageText = generateCustomerInvoiceText(currentOrder, settings.workshopName, currency);

  const invoicePaperRef = React.useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    if (!invoicePaperRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const cleanCustomer = (currentOrder.customerName || 'الزبون').replace(/[\/\\?%*:|"<>]/g, '-').trim();
      const fileName = `فاتورة_${cleanCustomer}_${currentOrder.orderNumber}.pdf`;
      await exportElementToPdf(invoicePaperRef.current, fileName, { autoDownload: true });
      setPdfSuccessMessage(`تم تحميل وحفظ ملف الفاتورة PDF (${fileName}) بنجاح!`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى أو استخدام خيار الطباعة.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    if (!invoicePaperRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const cleanCustomer = (currentOrder.customerName || 'الزبون').replace(/[\/\\?%*:|"<>]/g, '-').trim();
      const fileName = `فاتورة_${cleanCustomer}_${currentOrder.orderNumber}.pdf`;
      // autoDownload: false -> directly in memory without saving to mobile device storage!
      const file = await exportElementToPdf(invoicePaperRef.current, fileName, { autoDownload: false });
      if (file) {
        const shared = await shareFileDirectly(
          file,
          `فاتورة ${currentOrder.orderNumber} - ${cleanCustomer}`,
          `السلام عليكم ${currentOrder.customerName}، مرفق ملف فاتورة رقم ${currentOrder.orderNumber} الصادرة من ${settings.workshopName}`
        );
        if (shared) {
          setPdfSuccessMessage(`تمت مشاركة الفاتورة PDF بنجاح مباشرة (بدون تنزيلها على الذاكرة)!`);
        } else {
          // If browser/device does not support native file sharing, download as fallback
          if (typeof navigator === 'undefined' || !navigator.share) {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }
          setPdfSuccessMessage(`جاري فتح واتساب لإرسال الفاتورة...`);
          setTimeout(() => {
            openWhatsApp({
              phone: currentOrder.customerPhone,
              text: `السلام عليكم ${currentOrder.customerName}، مرفق فاتورة رقم ${currentOrder.orderNumber} الصادرة من ورشة ${settings.workshopName}.`,
            });
          }, 1200);
        }
        setTimeout(() => setPdfSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تجهيز ملف PDF للمشاركة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareImage = async () => {
    if (!invoicePaperRef.current) return;
    setIsGeneratingImage(true);
    try {
      const cleanCustomer = (currentOrder.customerName || 'الزبون').replace(/[\/\\?%*:|"<>]/g, '-').trim();
      const fileName = `فاتورة_${cleanCustomer}_${currentOrder.orderNumber}.png`;
      // autoDownload: false -> directly in memory without saving to device storage!
      const file = await exportElementToImage(invoicePaperRef.current, fileName, { autoDownload: false });
      if (file) {
        const shared = await shareFileDirectly(
          file,
          `فاتورة ${currentOrder.orderNumber} - ${cleanCustomer}`,
          `السلام عليكم ${currentOrder.customerName}، مرفق صورة فاتورة رقم ${currentOrder.orderNumber} من ${settings.workshopName}`
        );
        if (shared) {
          setPdfSuccessMessage(`تمت مشاركة صورة الفاتورة المنسقة بنجاح مباشرة عبر واتساب!`);
        } else {
          if (typeof navigator === 'undefined' || !navigator.share) {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }
          setPdfSuccessMessage(`جاري فتح واتساب لمراسلة الزبون...`);
          setTimeout(() => {
            openWhatsApp({
              phone: currentOrder.customerPhone,
              text: `السلام عليكم ${currentOrder.customerName}، مرفق صورة الفاتورة رقم ${currentOrder.orderNumber} من ورشة ${settings.workshopName}.`,
            });
          }, 1200);
        }
        setTimeout(() => setPdfSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تجهيز صورة الفاتورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!invoicePaperRef.current) return;
    setIsGeneratingImage(true);
    try {
      const cleanCustomer = (currentOrder.customerName || 'الزبون').replace(/[\/\\?%*:|"<>]/g, '-').trim();
      const fileName = `فاتورة_${cleanCustomer}_${currentOrder.orderNumber}.png`;
      await exportElementToImage(invoicePaperRef.current, fileName, { autoDownload: true });
      setPdfSuccessMessage(`تم تحميل وحفظ صورة الفاتورة (${fileName}) بنجاح!`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحميل صورة الفاتورة.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickStandardWA = () => {
    openWhatsApp({
      phone: currentOrder.customerPhone,
      text: messageText,
      type: 'standard',
    });
  };

  const handleQuickBusinessWA = () => {
    openWhatsApp({
      phone: currentOrder.customerPhone,
      text: messageText,
      type: 'business',
    });
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (!signingTarget) return;

    const updated: CustomerOrder = {
      ...currentOrder,
      [signingTarget === 'customer' ? 'customerSignature' : 'workshopSignature']: signatureDataUrl,
    };

    setCurrentOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
    setSigningTarget(null);
  };

  const handleRemoveSignature = (target: 'customer' | 'workshop') => {
    const updated: CustomerOrder = {
      ...currentOrder,
      [target === 'customer' ? 'customerSignature' : 'workshopSignature']: undefined,
    };
    setCurrentOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  const payments = getOrderPayments(currentOrder);

  const handleDeletePayment = (paymentId: string) => {
    if (!confirm('هل تريد بالتأكيد حذف هذه الدفعة وإعادة احتساب رصيد الزبون؟')) return;
    const currentPayments = getOrderPayments(currentOrder);
    const remainingList = currentPayments.filter((p) => p.id !== paymentId);
    const newDeposit = Number(remainingList.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
    const newRemaining = Math.max(0, Number((currentOrder.finalSellingPrice - newDeposit).toFixed(2)));
    let running = 0;
    const recalculated = remainingList.map((p) => {
      running += p.amount;
      return {
        ...p,
        remainingAfter: Math.max(0, Number((currentOrder.finalSellingPrice - running).toFixed(2))),
      };
    });
    const updated: CustomerOrder = {
      ...currentOrder,
      deposit: newDeposit,
      remainingBalance: newRemaining,
      payments: recalculated,
      status: currentOrder.status === 'completed' && newRemaining > 0 ? 'in_progress' : currentOrder.status,
    };
    setCurrentOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
          {/* Actions Bar (hidden when printing) */}
          <div className="flex flex-wrap items-center justify-between px-3 sm:px-5 py-2.5 bg-slate-900 text-white gap-2 no-print border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">معاينة فاتورة البيع</span>
              <span className="text-xs text-slate-400 font-mono">({currentOrder.orderNumber})</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Quick Collect Payment Button if Remaining > 0 */}
              {currentOrder.remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCollectingPayment(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="تسجيل تحصيل دفعة أو تسديد من الزبون"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>تحصيل دفعة</span>
                </button>
              )}

              {/* Direct PDF Send Button */}
              <button
                type="button"
                disabled={isGeneratingPdf || isGeneratingImage}
                onClick={handleSharePdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="إرسال الفاتورة كملف PDF رسمي مع التوقيع عبر واتساب أو التطبيقات"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>إرسال PDF 📄</span>
              </button>

              {/* Direct Image Send Button */}
              <button
                type="button"
                disabled={isGeneratingPdf || isGeneratingImage}
                onClick={handleShareImage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="إرسال الفاتورة كصورة مباشرة في محادثة واتساب لتظهر فورا مع التوقيع"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                <span>إرسال كصورة 🖼️</span>
              </button>

              {/* Quick Standard WhatsApp */}
              <button
                type="button"
                onClick={handleQuickStandardWA}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="إرسال نص الفاتورة عبر واتساب"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">واتساب نصي</span>
              </button>

              {/* All Share Options Dialog Button */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                title="خيارات المشاركة والتحميل"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">خيارات أخرى</span>
              </button>

              {/* Quick Settings & Header Customization Button */}
              <button
                type="button"
                onClick={() => {
                  setHeaderFormData({
                    workshopName: settings.workshopName,
                    ownerName: settings.ownerName || '',
                    managementTitle: settings.managementTitle ?? 'إدارة:',
                    phone: settings.phone,
                    email: settings.email || '',
                    fontFamily: settings.fontFamily || 'Cairo',
                    invoiceNotes: settings.invoiceNotes || '',
                    showTermsHeading: !!settings.showTermsHeading,
                    hideTermsBox: !!settings.hideTermsBox,
                  });
                  setIsEditHeaderModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                title="تعديل اسم الإدارة، الإيميل، الخط، أو إلغاء الشروط"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">تعديل الإدارة والإيميل والخط</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                title="طباعة ورقية مباشرة"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {pdfSuccessMessage && (
            <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between no-print animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pdfSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfSuccessMessage(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Printable Paper Document */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-100 text-slate-900 invoice-paper-container"
            style={{ fontFamily: `'${settings.fontFamily || 'Cairo'}', 'Cairo', system-ui, sans-serif` }}
          >
            <div
              ref={invoicePaperRef}
              className="max-w-3xl mx-auto space-y-6 bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0"
              style={{ fontFamily: `'${settings.fontFamily || 'Cairo'}', 'Cairo', system-ui, sans-serif` }}
            >
              {/* Header / Brand */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt={settings.workshopName}
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-0.5"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                        <Wrench className="w-5 h-5" />
                      </div>
                    )}
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {settings.workshopName}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600 font-medium flex items-center flex-wrap gap-1">
                    {settings.ownerName ? (
                      <span>
                        {settings.managementTitle !== undefined && settings.managementTitle !== null
                          ? (settings.managementTitle ? `${settings.managementTitle} ` : '')
                          : 'إدارة: '}
                        <strong className="font-black text-slate-950">{settings.ownerName}</strong> | 
                      </span>
                    ) : null}
                    <span>هاتف: <strong className="font-mono font-bold text-slate-900">{settings.phone}</strong></span>
                    {settings.email ? (
                      <span> | إيميل: <strong className="font-mono font-bold text-slate-900">{settings.email}</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setHeaderFormData({
                            workshopName: settings.workshopName,
                            ownerName: settings.ownerName || '',
                            managementTitle: settings.managementTitle ?? 'إدارة:',
                            phone: settings.phone,
                            email: settings.email || '',
                            fontFamily: settings.fontFamily || 'Cairo',
                            invoiceNotes: settings.invoiceNotes || '',
                            showTermsHeading: !!settings.showTermsHeading,
                            hideTermsBox: !!settings.hideTermsBox,
                          });
                          setIsEditHeaderModalOpen(true);
                        }}
                        className="no-print inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded cursor-pointer mr-1 font-bold transition-colors"
                        title="إضافة بريد إلكتروني (إيميل) ليظهر في الفاتورة"
                      >
                        <Mail className="w-2.5 h-2.5 text-emerald-600" />
                        <span>+ إضافة إيميل</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderFormData({
                          workshopName: settings.workshopName,
                          ownerName: settings.ownerName || '',
                          managementTitle: settings.managementTitle ?? 'إدارة:',
                          phone: settings.phone,
                          email: settings.email || '',
                          fontFamily: settings.fontFamily || 'Cairo',
                          invoiceNotes: settings.invoiceNotes || '',
                          showTermsHeading: !!settings.showTermsHeading,
                          hideTermsBox: !!settings.hideTermsBox,
                        });
                        setIsEditHeaderModalOpen(true);
                      }}
                      className="no-print inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded cursor-pointer mr-1 font-bold transition-colors"
                      title="تغيير اسم الإدارة أو الإيميل أو نوع الخط أو الشروط"
                    >
                      <Edit2 className="w-2.5 h-2.5 text-blue-600" />
                      <span>تعديل الإدارة / الإيميل</span>
                    </button>
                  </p>
                  <p className="text-xs text-slate-500">
                    {settings.address} • تخصص ألمنيوم، أبواب أكرديون، ستائر زيبرا، أباجورات
                  </p>
                </div>

                <div className="text-left space-y-1">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded">
                    {currentOrder.status === 'quotation' ? 'عرض سعر مبدئي' : 'فاتورة بيع معتمدة'}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700">
                    رقم: {currentOrder.orderNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    التاريخ: {new Date(currentOrder.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">اسم الزبون:</span>
                  <span className="font-black text-slate-950 text-base">{currentOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">رقم الهاتف:</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm" dir="ltr">
                    {currentOrder.customerPhone || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">العنوان وموقع التركيب:</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{currentOrder.customerAddress || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[11px] block">موعد التركيب المتوقع:</span>
                  <span className="font-extrabold text-blue-900 text-xs sm:text-sm">{currentOrder.deliveryDate || 'حسب الاتفاق'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black text-xs sm:text-sm">
                      <th className="p-2.5 border border-slate-700 w-8 text-center">#</th>
                      <th className="p-2.5 border border-slate-700">البيان</th>
                      <th className="p-2.5 border border-slate-700 text-center">المقاس</th>
                      <th className="p-2.5 border border-slate-700 text-center">العدد</th>
                      <th className="p-2.5 border border-slate-700 text-center">القياس (م² / متر جر)</th>
                      <th className="p-2.5 border border-slate-700 text-center">سعر المتر</th>
                      <th className="p-2.5 border border-slate-700 text-left">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.items.map((item, idx) => {
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                          <td className="p-2.5 border border-slate-200 text-center font-mono font-bold text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 border border-slate-200">
                            <div className="font-black text-slate-950 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                              <span>{item.name}</span>
                              {item.category === 'kitchens' && (
                                <span className="text-[10px] bg-orange-100 text-orange-950 border border-orange-300 font-black px-1.5 py-0.5 rounded">
                                  تفصيل وتصنيع مطبخ (متر جر)
                                </span>
                              )}
                            </div>

                            {/* Kitchen Specific Specifications & Components */}
                            {item.category === 'kitchens' && item.options && (
                              <div className="mt-1 space-y-1 text-[11px] text-slate-800 bg-orange-50/60 p-2 rounded border border-orange-200/80">
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-850">
                                  {item.options.kitchenLayout && (
                                    <span><strong className="text-orange-950 font-black">التصميم:</strong> {item.options.kitchenLayout}</span>
                                  )}
                                  {item.options.kitchenDoorsType && (
                                    <span><strong className="text-orange-950 font-black">الدرف:</strong> {item.options.kitchenDoorsType}</span>
                                  )}
                                  {item.options.kitchenCountertop && (
                                    <span><strong className="text-orange-950 font-black">الرخام:</strong> {item.options.kitchenCountertop}</span>
                                  )}
                                  {item.options.kitchenCabinetBody && (
                                    <span><strong className="text-orange-950 font-black">الهيكل:</strong> {item.options.kitchenCabinetBody}</span>
                                  )}
                                </div>

                                {/* Kitchen Included Components / Bill of Materials */}
                                {item.options.kitchenComponents && item.options.kitchenComponents.length > 0 && (
                                  <div className="mt-1.5 pt-1.5 border-t border-orange-200/60">
                                    <div className="font-black text-[10px] text-orange-950 mb-0.5">
                                      الإضافات ومستلزمات تصنيع المطبخ المشمولة ({item.options.kitchenComponents.length} إضافات):
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
                                      {item.options.kitchenComponents.map((c, cIdx) => (
                                        <div key={c.id || cIdx} className="flex items-center justify-between bg-white/80 px-2 py-0.5 rounded border border-orange-200/50">
                                          <span className="truncate max-w-[200px] font-bold text-slate-900">• {c.name}</span>
                                          <span className="font-mono text-slate-800 shrink-0 font-black">
                                            {c.quantity} {c.unit} {c.totalPrice > 0 ? `(${formatCurrency(c.totalPrice, currency)})` : ''}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {(item.additionalPrice > 0 || item.additionalName) && item.category !== 'kitchens' && (
                              <div className="text-[11px] text-amber-950 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 inline-flex items-center gap-1">
                                <span>+ إضافات متفق عليها:</span>
                                <span className="font-black">{item.additionalName || 'مسكات باب / قفل / إكسسوار'}</span>
                                <span>(+{formatCurrency(item.additionalPrice, currency)}{item.quantity > 1 ? ` × ${item.quantity}` : ''})</span>
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5 font-medium">ملاحظة: {item.notes}</div>
                            )}
                          </td>
                          <td className="p-2.5 border border-slate-200 text-center font-mono text-slate-900 whitespace-nowrap font-black">
                            {item.category === 'kitchens'
                              ? `${item.unit === 'cm' ? (item.width / 100).toFixed(1) : item.width} متر جر`
                              : `${item.width} × ${item.height} ${item.unit === 'cm' ? 'سم' : 'م'}`}
                          </td>
                          <td className="p-2.5 border border-slate-200 text-center font-mono font-black text-slate-950 text-sm">
                            {item.quantity}
                          </td>
                          <td className="p-2.5 border border-slate-200 text-center font-mono font-black text-slate-950 text-xs sm:text-sm">
                            {item.totalArea} {item.category === 'kitchens' ? 'متر جر' : 'م²'}
                          </td>
                          <td className="p-2.5 border border-slate-200 text-center font-mono font-bold text-slate-800">
                            {formatCurrency(item.pricePerMeter, currency)}
                          </td>
                          <td className="p-2.5 border border-slate-200 text-left font-mono font-black text-slate-950 whitespace-nowrap text-xs sm:text-sm">
                            {formatCurrency(item.totalPrice, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Calculation Box */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
                {/* Notes and Terms Box (Cancels 'الشروط والأحكام' phrase as requested by user) */}
                {!settings.hideTermsBox && (settings.invoiceNotes || currentOrder.notes || settings.showTermsHeading) ? (
                  <div className="flex-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 relative">
                    {/* Only show 'الشروط والأحكام:' if explicitly enabled, otherwise canceled per user request */}
                    {settings.showTermsHeading ? (
                      <div className="font-bold text-slate-800 mb-1">الشروط والأحكام:</div>
                    ) : (
                      (settings.invoiceNotes || currentOrder.notes) ? (
                        <div className="font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>ملاحظات الفاتورة:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHeaderFormData({
                                workshopName: settings.workshopName,
                                ownerName: settings.ownerName || '',
                                managementTitle: settings.managementTitle ?? 'إدارة:',
                                phone: settings.phone,
                                email: settings.email || '',
                                fontFamily: settings.fontFamily || 'Cairo',
                                invoiceNotes: settings.invoiceNotes || '',
                                showTermsHeading: !!settings.showTermsHeading,
                                hideTermsBox: !!settings.hideTermsBox,
                              });
                              setIsEditHeaderModalOpen(true);
                            }}
                            className="no-print text-[10px] text-blue-600 hover:underline cursor-pointer"
                            title="تعديل الملاحظات"
                          >
                            تعديل
                          </button>
                        </div>
                      ) : null
                    )}
                    {settings.invoiceNotes && (
                      <p className="leading-relaxed text-slate-700">{settings.invoiceNotes}</p>
                    )}
                    {currentOrder.notes && (
                      <p className="text-amber-800 pt-1 border-t border-slate-200 font-medium">
                        ملاحظات خاصة بالطلب: {currentOrder.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Space filler / quick notes trigger when terms box is hidden */
                  <div className="flex-1 text-xs text-slate-400 no-print flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">(تم إلغاء عبارة الشروط والأحكام من الفاتورة)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderFormData({
                          workshopName: settings.workshopName,
                          ownerName: settings.ownerName || '',
                          managementTitle: settings.managementTitle ?? 'إدارة:',
                          phone: settings.phone,
                          email: settings.email || '',
                          fontFamily: settings.fontFamily || 'Cairo',
                          invoiceNotes: settings.invoiceNotes || '',
                          showTermsHeading: false,
                          hideTermsBox: false,
                        });
                        setIsEditHeaderModalOpen(true);
                      }}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      + إضافة ملاحظة
                    </button>
                  </div>
                )}

                <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-bold">المجموع الإجمالي:</span>
                    <span className="font-black font-mono text-slate-900 text-sm">
                      {formatCurrency(currentOrder.subtotal, currency)}
                    </span>
                  </div>

                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between items-center text-rose-700">
                      <span className="font-bold">خصم خاص:</span>
                      <span className="font-black font-mono text-sm">
                        -{formatCurrency(currentOrder.discount, currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-950 pt-2 border-t-2 border-slate-300 text-sm sm:text-base">
                    <span className="font-black">الصافي المطلوب:</span>
                    <span className="font-mono font-black text-blue-800 text-base sm:text-lg">
                      {formatCurrency(currentOrder.finalSellingPrice, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-800 font-bold pt-1.5 text-xs sm:text-sm">
                    <span>
                      {payments.length > 1
                        ? `إجمالي المقبوض (${payments.length} دفعات):`
                        : 'الدفعة المقدمة (العربون):'}
                    </span>
                    <span className="font-mono font-black text-emerald-700 text-sm sm:text-base">
                      {formatCurrency(currentOrder.deposit, currency)}
                    </span>
                  </div>

                  <div className={`flex justify-between items-center p-2.5 rounded-xl mt-2 text-xs sm:text-sm border ${
                    currentOrder.remainingBalance > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-black'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black'
                  }`}>
                    <span className="font-black">
                      {currentOrder.remainingBalance > 0 ? 'المتبقي عند التركيب:' : 'حالة الفاتورة:'}
                    </span>
                    <span className="font-mono font-black text-base sm:text-lg">
                      {currentOrder.remainingBalance > 0
                        ? formatCurrency(currentOrder.remainingBalance, currency)
                        : 'مسدد بالكامل ✅'}
                    </span>
                  </div>

                  {currentOrder.remainingBalance > 0 && (
                    <div className="no-print pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCollectingPayment(true)}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>تحصيل دفعة من الزبون الآن</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Payments Breakdown Section (تفصيل الدفعات كل واحدة على حدة) */}
              {payments.length > 0 && (
                <div className="pt-5 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        تفصيل وسجل الدفعات المسددة ({payments.length} {payments.length === 1 ? 'دفعة' : 'دفعات'})
                      </h4>
                    </div>
                    {currentOrder.remainingBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCollectingPayment(true)}
                        className="no-print text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>تحصيل دفعة جديدة</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 text-center w-12 font-mono">#</th>
                          <th className="p-2.5">بيان وتفصيل الدفعة</th>
                          <th className="p-2.5 text-center">طريقة الدفع</th>
                          <th className="p-2.5 text-center">تاريخ السداد</th>
                          <th className="p-2.5 text-left font-mono">المبلغ المسدد</th>
                          <th className="p-2.5 text-left font-mono">المتبقي بعدها</th>
                          <th className="p-2.5 text-center w-12 no-print">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((pmt, idx) => (
                          <tr key={pmt.id} className="hover:bg-slate-50/60">
                            <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900">
                              {pmt.note || (idx === 0 ? 'الدفعة الأولى (العربون)' : `دفعة سداد #${idx + 1}`)}
                            </td>
                            <td className="p-2.5 text-center text-slate-600">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium border border-slate-200">
                                {pmt.paymentMethod === 'bank'
                                  ? '🏦 تحويل بنكي'
                                  : pmt.paymentMethod === 'check'
                                  ? '🧾 شيك'
                                  : '💵 نقداً (كاش)'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-slate-600 font-mono text-[11px]">
                              {pmt.date
                                ? new Date(pmt.date).toLocaleDateString('ar-EG', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="p-2.5 text-left font-mono font-bold text-emerald-700">
                              +{formatCurrency(pmt.amount, currency)}
                            </td>
                            <td className="p-2.5 text-left font-mono text-slate-600">
                              {pmt.remainingAfter !== undefined
                                ? formatCurrency(pmt.remainingAfter, currency)
                                : '—'}
                            </td>
                            <td className="p-2.5 text-center no-print">
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(pmt.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="حذف هذه الدفعة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-800">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right font-bold">
                            إجمالي المقبوض المسدد حتى الآن:
                          </td>
                          <td className="p-2.5 text-left font-mono text-emerald-700 text-sm">
                            {formatCurrency(currentOrder.deposit, currency)}
                          </td>
                          <td colSpan={2} className="p-2.5 text-left font-mono text-rose-600 text-xs">
                            المتبقي: {formatCurrency(currentOrder.remainingBalance, currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Signatures Section (Interactive on Mobile Screen + High Quality Print) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t-2 border-slate-200 text-xs">
                {/* 1. Workshop Signature */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 text-center flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      ختم وتوقيع إدارة الورشة:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {settings.ownerName || settings.workshopName}
                    </span>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center min-h-[70px]">
                    {currentOrder.workshopSignature ? (
                      <div className="relative group">
                        <img
                          src={currentOrder.workshopSignature}
                          alt="توقيع الورشة"
                          className="max-h-20 max-w-full object-contain mx-auto block"
                          style={{ minHeight: '48px', display: 'block' }}
                          crossOrigin="anonymous"
                        />
                        <div className="no-print mt-1 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSigningTarget('workshop')}
                            className="text-[10px] text-blue-600 hover:underline px-1 cursor-pointer"
                          >
                            إعادة التوقيع
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature('workshop')}
                            className="text-[10px] text-rose-600 hover:underline px-1 cursor-pointer"
                          >
                            مسح
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-1.5">
                        <div className="w-36 border-b border-dashed border-slate-400 my-2"></div>
                        <button
                          type="button"
                          onClick={() => setSigningTarget('workshop')}
                          className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5 text-blue-600" />
                          <span>توقيع الورشة باللمس ✍️</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    معتمد رسمياً
                  </div>
                </div>

                {/* 2. Customer Signature */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 text-center flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      توقيع وموافقة الزبون:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {currentOrder.customerName}
                    </span>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center min-h-[70px]">
                    {currentOrder.customerSignature ? (
                      <div className="relative group">
                        <img
                          src={currentOrder.customerSignature}
                          alt="توقيع الزبون"
                          className="max-h-20 max-w-full object-contain mx-auto block"
                          style={{ minHeight: '48px', display: 'block' }}
                          crossOrigin="anonymous"
                        />
                        <div className="no-print mt-1 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSigningTarget('customer')}
                            className="text-[10px] text-blue-600 hover:underline px-1 cursor-pointer"
                          >
                            إعادة التوقيع
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature('customer')}
                            className="text-[10px] text-rose-600 hover:underline px-1 cursor-pointer"
                          >
                            مسح
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-1.5">
                        <div className="w-36 border-b border-dashed border-slate-400 my-2"></div>
                        <button
                          type="button"
                          onClick={() => setSigningTarget('customer')}
                          className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 hover:border-blue-400 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5 text-blue-600" />
                          <span>توقيع الزبون من شاشة الموبايل ✍️</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    موافقة على القياسات والأسعار
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal for Touch Signing */}
      {signingTarget && (
        <SignaturePadModal
          isOpen={!!signingTarget}
          title={signingTarget === 'customer' ? 'توقيع الزبون على الفاتورة' : 'ختم وتوقيع إدارة الورشة'}
          signerName={signingTarget === 'customer' ? currentOrder.customerName : (settings.ownerName || settings.workshopName)}
          initialSignature={signingTarget === 'customer' ? currentOrder.customerSignature : currentOrder.workshopSignature}
          onSave={handleSaveSignature}
          onClose={() => setSigningTarget(null)}
        />
      )}

      {/* Advanced WhatsApp Sharing Modal */}
      {isShareModalOpen && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          title="مشاركة فاتورة البيع"
          subtitle={`فاتورة رقم: ${currentOrder.orderNumber} - الزبون: ${currentOrder.customerName}`}
          defaultPhone={currentOrder.customerPhone}
          messageText={messageText}
          onSharePdf={handleSharePdf}
          onDownloadPdf={handleDownloadPdf}
          onShareImage={handleShareImage}
          onDownloadImage={handleDownloadImage}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
      {/* Customer Payment Modal for Collecting Balance/Installments */}
      {isCollectingPayment && (
        <CustomerPaymentModal
          isOpen={isCollectingPayment}
          order={currentOrder}
          settings={settings}
          onClose={() => setIsCollectingPayment(false)}
          onConfirm={(collectedAmount, note) => {
            const existingPayments = getOrderPayments(currentOrder);
            const newDeposit = Math.min(
              currentOrder.finalSellingPrice,
              Number(((currentOrder.deposit || 0) + collectedAmount).toFixed(2))
            );
            const newRemaining = Math.max(
              0,
              Number((currentOrder.finalSellingPrice - newDeposit).toFixed(2))
            );

            const pmtRecord: OrderPaymentRecord = {
              id: 'pmt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              amount: collectedAmount,
              date: new Date().toISOString(),
              note: note || `دفعة سداد #${existingPayments.length + 1}`,
              paymentMethod: 'cash',
              remainingAfter: newRemaining,
            };

            const updatedPayments = [...existingPayments, pmtRecord];

            let updatedNotes = currentOrder.notes || '';
            if (note) {
              const dateStr = new Date(pmtRecord.date).toLocaleDateString('ar-EG');
              const noteEntry = `[تحصيل دفعة: +${collectedAmount} ${currency} (${note}) بتاريخ ${dateStr}]`;
              updatedNotes = updatedNotes ? `${updatedNotes}\n${noteEntry}` : noteEntry;
            }

            const updated: CustomerOrder = {
              ...currentOrder,
              deposit: newDeposit,
              remainingBalance: newRemaining,
              payments: updatedPayments,
              notes: updatedNotes,
              status: currentOrder.status,
            };
            setCurrentOrder(updated);
            if (onUpdateOrder) {
              onUpdateOrder(updated);
            }
            setIsCollectingPayment(false);
          }}
        />
      )}

      {/* Quick Edit Management & Terms Modal */}
      {isEditHeaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">تعديل اسم الإدارة والشروط في الفاتورة</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditHeaderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeaderSettings} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Management Name (اسم الإدارة) */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950">
                    اسم المدير / الإدارة (الظاهر كـ "إدارة: ..."):
                  </label>
                  {headerFormData.ownerName && (
                    <button
                      type="button"
                      onClick={() => setHeaderFormData({ ...headerFormData, ownerName: '' })}
                      className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      مسح الاسم نهائياً
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={headerFormData.ownerName}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, ownerName: e.target.value })}
                  placeholder="مثال: المعلم أحمد أو اكتب اسمك (أو اتركه فارغاً لإلغاء ظهور الإدارة)"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-blue-300 rounded-lg bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-blue-800">
                  💡 لتغيير كلمة "أبو سند" أو مسحها تماماً حتى لا تظهر كلمة إدارة في الفاتورة.
                </p>

                {headerFormData.ownerName && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/80 text-xs">
                    <span className="text-slate-700">صفة الإدارة المطبوعة:</span>
                    <select
                      value={headerFormData.managementTitle}
                      onChange={(e) => setHeaderFormData({ ...headerFormData, managementTitle: e.target.value })}
                      className="text-xs px-2 py-1 border border-blue-300 rounded bg-white text-slate-800 font-medium"
                    >
                      <option value="إدارة:">إدارة:</option>
                      <option value="بإدارة:">بإدارة:</option>
                      <option value="إشراف:">إشراف:</option>
                      <option value="المدير:">المدير:</option>
                      <option value="المعلم:">المعلم:</option>
                      <option value="">بدون كلمة إدارة (الاسم مباشرة)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Terms and Conditions Controls (إلغاء عبارة الشروط والأحكام) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  إعدادات الشروط والملاحظات بالفاتورة:
                </span>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={!headerFormData.showTermsHeading}
                    onChange={(e) => setHeaderFormData({ ...headerFormData, showTermsHeading: !e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">إلغاء عبارة "الشروط والأحكام" من الفاتورة</span>
                    <span className="text-[10px] text-slate-500 block">
                      (مفعل - لن تظهر كلمة الشروط والأحكام وتظهر الملاحظات فقط بشكل بسيط)
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700 pt-1.5 border-t border-slate-200">
                  <input
                    type="checkbox"
                    checked={headerFormData.hideTermsBox}
                    onChange={(e) => setHeaderFormData({ ...headerFormData, hideTermsBox: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">إخفاء صندوق الملاحظات والشروط بالكامل</span>
                    <span className="text-[10px] text-slate-500 block">
                      (إلغاء المربع كاملاً من الفاتورة)
                    </span>
                  </div>
                </label>

                {!headerFormData.hideTermsBox && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      نص ملاحظات الفاتورة:
                    </label>
                    <textarea
                      rows={2}
                      value={headerFormData.invoiceNotes}
                      onChange={(e) => setHeaderFormData({ ...headerFormData, invoiceNotes: e.target.value })}
                      placeholder="أدخل أي ملاحظات ترغب بها، أو امسحها تماماً..."
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Workshop Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم المحل / الورشة:</label>
                  <input
                    type="text"
                    value={headerFormData.workshopName}
                    onChange={(e) => setHeaderFormData({ ...headerFormData, workshopName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={headerFormData.phone}
                    onChange={(e) => setHeaderFormData({ ...headerFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-right font-mono"
                  />
                </div>
              </div>

              {/* Email (البريد الإلكتروني الظاهر في الفاتورة) */}
              <div className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    البريد الإلكتروني (الإيميل في الفاتورة):
                  </label>
                  {headerFormData.email && (
                    <button
                      type="button"
                      onClick={() => setHeaderFormData({ ...headerFormData, email: '' })}
                      className="text-[11px] text-red-600 hover:underline cursor-pointer font-semibold"
                      title="مسح الإيميل لإلغاء ظهوره في الفاتورة"
                    >
                      مسح الإيميل نهائياً
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  dir="ltr"
                  value={headerFormData.email}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, email: e.target.value })}
                  placeholder="example@gmail.com (أو اتركه فارغاً لإلغاء ظهوره في الفاتورة)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-right font-mono focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  💡 اكتب إيميلك هنا ليظهر في ترويسة الفاتورة، أو اتركه فارغاً أو اضغط "مسح الإيميل" لإلغاء ظهوره تماماً.
                </span>
              </div>

              {/* Arabic Font Selection (نوع وتنسيق الخط) */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-600" />
                    <span>نوع الخط وتنسيقه في الفاتورة:</span>
                  </label>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                    عريض في الأماكن الهامة
                  </span>
                </div>
                <select
                  value={headerFormData.fontFamily || 'Cairo'}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, fontFamily: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 border border-amber-300 rounded-lg font-bold text-slate-900 bg-white shadow-2xs cursor-pointer focus:ring-2 focus:ring-amber-500"
                >
                  {SUPPORTED_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-800 leading-tight">
                  💡 يتم تطبيق التنسيق العريض تلقائياً على اسم الزبون، والأسعار، والصافي، والمتبقي، وعناوين الفاتورة.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditHeaderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتحديث الفاتورة فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
