import { CustomerOrder, SupplierPurchaseInvoice, WorkshopSettings, WorkshopExpense } from '../types';
import { formatCurrency, getOrderPayments, getSupplierPayments } from './calculator';

export interface WhatsAppShareOptions {
  phone?: string;
  text: string;
  type?: 'standard' | 'business';
}

/**
 * Format phone number for WhatsApp deep link
 */
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Opens WhatsApp Messenger or WhatsApp Business
 */
export function openWhatsApp({ phone, text, type = 'standard' }: WhatsAppShareOptions): void {
  const cleanedPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const phoneParam = cleanedPhone ? `phone=${cleanedPhone}&` : '';

  if (type === 'business') {
    if (isAndroid) {
      // Android Intent directly targeting WhatsApp Business package
      const intentUrl = `intent://send?${phoneParam}text=${encodedText}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
      try {
        window.location.href = intentUrl;
        return;
      } catch (e) {
        console.warn('Failed to launch WhatsApp Business via intent', e);
      }
    } else if (isIOS) {
      // iOS WhatsApp Business URL scheme
      const iosUrl = `whatsapp-business://send?${phoneParam}text=${encodedText}`;
      window.location.href = iosUrl;
      return;
    }

    // Fallback: Custom scheme or web
    const businessScheme = `whatsapp-business://send?${phoneParam}text=${encodedText}`;
    try {
      window.location.href = businessScheme;
      // If nothing happens after 800ms, fallback to web
      setTimeout(() => {
        const fallbackUrl = cleanedPhone
          ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`
          : `https://api.whatsapp.com/send?text=${encodedText}`;
        window.open(fallbackUrl, '_blank');
      }, 900);
      return;
    } catch {
      // Fallback
    }
  }

  // Standard WhatsApp
  if (isMobile) {
    const mobileScheme = `whatsapp://send?${phoneParam}text=${encodedText}`;
    try {
      window.location.href = mobileScheme;
      setTimeout(() => {
        const webUrl = cleanedPhone
          ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`
          : `https://api.whatsapp.com/send?text=${encodedText}`;
        window.open(webUrl, '_blank');
      }, 900);
      return;
    } catch {
      // Fallback
    }
  }

  const webUrl = cleanedPhone
    ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(webUrl, '_blank');
}

/**
 * Share via native device share sheet (Web Share API)
 */
export async function shareViaNativeSheet(title: string, text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return true;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Native share failed', e);
      }
      return false;
    }
  }
  return false;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Generate formatted text for customer invoice
 */
export function generateCustomerInvoiceText(order: CustomerOrder, workshopName: string, currency: string): string {
  const lines: string[] = [];
  lines.push(`السلام عليكم ورحمة الله وبركاته، الأخ الكريم / ${order.customerName || 'الزبون المحترم'}`);
  lines.push(`تحية طيبة من *${workshopName}* 🛠️`);
  lines.push(`يسعدنا تزويدكم بتفاصيل ${order.status === 'quotation' ? 'عرض السعر' : 'فاتورة البيع'} رقم: *${order.orderNumber}*`);
  lines.push(`التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}`);
  lines.push('──────────────────');

  order.items.forEach((item, idx) => {
    lines.push(`*${idx + 1}. ${item.name}* (${item.quantity} ${item.category === 'kitchens' ? 'متر جر' : 'قطع'})`);
    if (item.category === 'kitchens') {
      lines.push(`▫️ الطول: ${item.unit === 'cm' ? (item.width / 100).toFixed(1) : item.width} متر جر`);
    } else {
      lines.push(`▫️ المقاس: ${item.width} × ${item.height} ${item.unit === 'cm' ? 'سم' : 'م'}`);
      lines.push(`▫️ إجمالي المساحة: ${item.totalArea} م²`);
    }
    lines.push(`▫️ الإجمالي: ${formatCurrency(item.totalPrice, currency)}`);
    if (item.additionalPrice > 0 || item.additionalName) {
      lines.push(`▫️ إضافات: ${item.additionalName || 'إكسسوار'} (+${formatCurrency(item.additionalPrice, currency)})`);
    }
    lines.push('');
  });

  lines.push('──────────────────');
  lines.push(`*المجموع الإجمالي:* ${formatCurrency(order.subtotal, currency)}`);
  if (order.discount > 0) {
    lines.push(`*خصم خاص:* -${formatCurrency(order.discount, currency)}`);
  }
  lines.push(`*الصافي المطلوب:* ${formatCurrency(order.finalSellingPrice, currency)}`);

  const payments = getOrderPayments(order);
  if (payments.length > 1) {
    lines.push('──────────────────');
    lines.push(`*سجل وتفصيل الدفعات المسددة (${payments.length} دفعات):*`);
    payments.forEach((p, idx) => {
      const dStr = p.date ? new Date(p.date).toLocaleDateString('ar-EG') : '';
      lines.push(`  ▫️ الدفعة #${idx + 1}: +${formatCurrency(p.amount, currency)} (${p.note || 'دفعة'}${dStr ? ' بتاريخ ' + dStr : ''})`);
    });
    lines.push(`*إجمالي المقبوض:* ${formatCurrency(order.deposit, currency)}`);
  } else {
    lines.push(`*الدفعة المقدمة (العربون):* ${formatCurrency(order.deposit, currency)}`);
  }

  lines.push(`*المتبقي عند التركيب:* ${formatCurrency(order.remainingBalance, currency)}`);

  if (order.deliveryDate) {
    lines.push(`*موعد التسليم المتوقع:* ${order.deliveryDate}`);
  }

  if (order.notes) {
    lines.push(`*ملاحظات:* ${order.notes}`);
  }

  lines.push('──────────────────');
  lines.push('شاكرين ثقتكم بنا واختياركم لخدماتنا ✨');

  return lines.join('\n');
}

/**
 * Generate formatted text for supplier purchase invoice
 */
export function generatePurchaseInvoiceText(invoice: SupplierPurchaseInvoice, workshopName: string, currency: string): string {
  const lines: string[] = [];
  lines.push(`*فاتورة شراء وتوريد رقم: ${invoice.invoiceNumber}* 📦`);
  lines.push(`المورد: *${invoice.supplierName}*`);
  if (invoice.supplierPhone) {
    lines.push(`هاتف المورد: ${invoice.supplierPhone}`);
  }
  lines.push(`التاريخ: ${invoice.invoiceDate}`);
  lines.push(`المستلم: *${workshopName}*`);
  lines.push('──────────────────');

  invoice.items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.description} - الكمية: ${item.quantity} ${item.unit} × ${formatCurrency(item.unitPrice, currency)} = ${formatCurrency(item.totalPrice, currency)}`);
  });

  lines.push('──────────────────');
  lines.push(`*إجمالي الفاتورة:* ${formatCurrency(invoice.totalAmount, currency)}`);

  const supplierPayments = getSupplierPayments(invoice);
  if (supplierPayments.length > 1) {
    lines.push(`*سجل وتفصيل دفعات السداد للمورد (${supplierPayments.length} دفعات):*`);
    supplierPayments.forEach((p, idx) => {
      const dStr = p.date ? new Date(p.date).toLocaleDateString('ar-EG') : '';
      lines.push(`  ▫️ الدفعة #${idx + 1}: +${formatCurrency(p.amount, currency)} (${p.note || 'سداد'}${dStr ? ' بتاريخ ' + dStr : ''})`);
    });
    lines.push(`*إجمالي المسدد:* ${formatCurrency(invoice.paidAmount, currency)}`);
  } else {
    lines.push(`*المدفوع:* ${formatCurrency(invoice.paidAmount, currency)}`);
  }

  lines.push(`*المتبقي بذمة الورشة:* ${formatCurrency(invoice.remainingAmount, currency)}`);
  lines.push(`*حالة السداد:* ${invoice.paymentStatus === 'paid' ? 'مسدد بالكامل ✅' : invoice.paymentStatus === 'partial' ? 'مسدد جزئياً ⏳' : 'غير مسدد (آجل) ⚠️'}`);

  if (invoice.notes) {
    lines.push(`*ملاحظات:* ${invoice.notes}`);
  }

  return lines.join('\n');
}

/**
 * Generate formatted text for financial reports
 */
export function generateFinancialReportText({
  reportType,
  settings,
  orders,
  expenses,
  purchaseInvoices,
  currency,
  exchangeRate,
}: {
  reportType: 'profit_loss' | 'dual_currency' | 'sales_report' | 'purchases_report' | 'expenses' | 'overview';
  settings: WorkshopSettings;
  orders: CustomerOrder[];
  expenses: WorkshopExpense[];
  purchaseInvoices: SupplierPurchaseInvoice[];
  currency: string;
  exchangeRate: number;
}): string {
  const lines: string[] = [];
  const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  lines.push(`📊 *تقرير مالي معتمد - ${settings.workshopName}*`);
  lines.push(`📅 التاريخ: ${dateStr}`);
  if (settings.ownerName) {
    lines.push(`👤 إشراف: ${settings.ownerName}`);
  }
  lines.push('──────────────────');

  // Calculations
  const totalSales = orders.reduce((sum, o) => sum + (o.finalSellingPrice || 0), 0);
  const totalReceived = orders.reduce((sum, o) => sum + (o.deposit || 0), 0);
  const totalCustomerRemaining = orders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);

  const totalPurchases = purchaseInvoices.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPurchasesPaid = purchaseInvoices.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalPurchasesRemaining = purchaseInvoices.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netEstimatedProfit = totalSales - totalPurchases - totalExpenses;

  if (reportType === 'profit_loss') {
    lines.push(`📋 *قائمة الأرباح والخسائر (Profit & Loss)*`);
    lines.push('──────────────────');
    lines.push(`▫️ *إجمالي المبيعات (الإيرادات):* ${formatCurrency(totalSales, currency)} (${orders.length} طلبات)`);
    lines.push(`▫️ *إجمالي تكلفة المشتريات والمواد:* ${formatCurrency(totalPurchases, currency)} (${purchaseInvoices.length} فواتير)`);
    lines.push(`▫️ *إجمالي المصاريف التشغيلية:* ${formatCurrency(totalExpenses, currency)} (${expenses.length} مصاريف)`);
    lines.push('──────────────────');
    lines.push(`🌟 *صافي الأرباح التقديري:* ${formatCurrency(netEstimatedProfit, currency)}`);
    const margin = totalSales > 0 ? ((netEstimatedProfit / totalSales) * 100).toFixed(1) : '0';
    lines.push(`📈 *هامش الربح الصافي:* ${margin}%`);
  } else if (reportType === 'dual_currency') {
    lines.push(`💱 *تقرير العملتين ($ ول.س) وسعر الصرف*`);
    lines.push(`▫️ سعر الصرف المعتمد: 1$ = ${exchangeRate.toLocaleString()} ل.س`);
    lines.push('──────────────────');

    const ordersUSD = orders.filter((o) => (o.currency || currency) === '$');
    const ordersSYP = orders.filter((o) => (o.currency || currency) === 'ل.س');
    const sumSalesUSD = ordersUSD.reduce((s, o) => s + (o.finalSellingPrice || 0), 0);
    const sumSalesSYP = ordersSYP.reduce((s, o) => s + (o.finalSellingPrice || 0), 0);

    const purUSD = purchaseInvoices.filter((p) => (p.currency || currency) === '$');
    const purSYP = purchaseInvoices.filter((p) => (p.currency || currency) === 'ل.س');
    const sumPurUSD = purUSD.reduce((s, p) => s + (p.totalAmount || 0), 0);
    const sumPurSYP = purSYP.reduce((s, p) => s + (p.totalAmount || 0), 0);

    lines.push(`*💵 حسابات الدولار ($):*`);
    lines.push(`• مبيعات: ${sumSalesUSD.toLocaleString()} $`);
    lines.push(`• مشتريات: ${sumPurUSD.toLocaleString()} $`);
    lines.push(`• صافي الدولار: ${(sumSalesUSD - sumPurUSD).toLocaleString()} $`);
    lines.push('');
    lines.push(`*🪙 حسابات الليرة السورية (ل.س):*`);
    lines.push(`• مبيعات: ${sumSalesSYP.toLocaleString()} ل.س`);
    lines.push(`• مشتريات: ${sumPurSYP.toLocaleString()} ل.س`);
    lines.push(`• صافي الليرة: ${(sumSalesSYP - sumPurSYP).toLocaleString()} ل.س`);
  } else if (reportType === 'sales_report') {
    lines.push(`🛍️ *تقرير المبيعات وفواتير الزبائن*`);
    lines.push(`▫️ عدد الطلبات والفواتير: ${orders.length}`);
    lines.push(`▫️ إجمالي المبيعات: ${formatCurrency(totalSales, currency)}`);
    lines.push(`▫️ المقبوض نقداً (العربون/الدفعات): ${formatCurrency(totalReceived, currency)}`);
    lines.push(`▫️ ديون متبقية بذمة الزبائن: ${formatCurrency(totalCustomerRemaining, currency)}`);
  } else if (reportType === 'purchases_report') {
    lines.push(`📦 *تقرير المشتريات وفواتير التوريد*`);
    lines.push(`▫️ عدد فواتير الشراء: ${purchaseInvoices.length}`);
    lines.push(`▫️ إجمالي المشتريات: ${formatCurrency(totalPurchases, currency)}`);
    lines.push(`▫️ المسدد للموردين: ${formatCurrency(totalPurchasesPaid, currency)}`);
    lines.push(`▫️ المتبقي بذمة الورشة للموردين: ${formatCurrency(totalPurchasesRemaining, currency)}`);
  } else if (reportType === 'expenses') {
    lines.push(`💼 *تقرير المصاريف التشغيلية العامة*`);
    lines.push(`▫️ عدد سندات الصرف: ${expenses.length}`);
    lines.push(`▫️ إجمالي المصاريف: ${formatCurrency(totalExpenses, currency)}`);
  } else {
    // Overview
    lines.push(`📈 *الملخص المالي الشامل*`);
    lines.push(`▫️ إجمالي المبيعات: ${formatCurrency(totalSales, currency)}`);
    lines.push(`▫️ إجمالي المشتريات: ${formatCurrency(totalPurchases, currency)}`);
    lines.push(`▫️ إجمالي المصاريف: ${formatCurrency(totalExpenses, currency)}`);
    lines.push(`▫️ ديون للورشة عند الزبائن: ${formatCurrency(totalCustomerRemaining, currency)}`);
    lines.push(`▫️ ديون على الورشة للموردين: ${formatCurrency(totalPurchasesRemaining, currency)}`);
    lines.push(`▫️ صافي الربح التقديري: ${formatCurrency(netEstimatedProfit, currency)}`);
  }

  lines.push('──────────────────');
  lines.push(`تم تصدير هذا التقرير آلياً عبر نظام إدارة ورشة الألمنيوم 🛠️`);
  return lines.join('\n');
}
