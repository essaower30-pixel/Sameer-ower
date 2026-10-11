import { CustomerOrder, SupplierPurchaseInvoice, WorkshopSettings, WorkshopExpense } from '../types';
import { formatCurrency, getOrderPayments, getSupplierPayments } from './calculator';

export interface WhatsAppShareOptions {
  phone?: string;
  text: string;
  type?: 'standard' | 'business' | 'auto';
  countryCode?: string;
}

/**
 * Format phone number for WhatsApp deep link with international code resolution.
 * Ensures numbers like '0961141216' or '0599123456' resolve to '963961141216' or '970599123456'
 * so WhatsApp navigates directly into the customer chat without prompting for contact search.
 * Handles both Arabic-Indic numerals (٠-٩) and standard Latin digits (0-9).
 */
export function cleanPhoneNumber(phone?: string, defaultCountryCode?: string): string {
  if (!phone) return '';

  // 1. Convert Arabic-Indic (٠-٩) and Eastern Persian (۰-۹) digits to standard digits (0-9)
  const normalized = phone
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

  // 2. Remove all non-digit and non-plus characters
  let cleaned = normalized.replace(/[^0-9+]/g, '');
  if (!cleaned) return '';

  // 3. Remove leading international prefix '00' or '+'
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Clean default country code digits (e.g. "+963" -> "963")
  const defaultCode = (defaultCountryCode || '+963').replace(/[^0-9]/g, '') || '963';

  // 4. Already starts with a recognized international dial code
  const knownPrefixes = ['963', '970', '972', '962', '966', '961', '20', '971', '965', '974', '968', '973', '964'];
  for (const prefix of knownPrefixes) {
    if (cleaned.startsWith(prefix) && cleaned.length >= prefix.length + 7) {
      return cleaned;
    }
  }

  // 5. Auto-detection based on distinct national mobile prefixes (takes priority over default code)
  if (cleaned.startsWith('0')) {
    const withoutZero = cleaned.substring(1);

    // Syria: starts with 09... (e.g. 0961141216 -> 963961141216)
    if (cleaned.startsWith('09')) {
      return `963${withoutZero}`;
    }
    // Palestine: starts with 059... or 056... (Jawwal & Ooredoo)
    if (cleaned.startsWith('059') || cleaned.startsWith('056')) {
      return `970${withoutZero}`;
    }
    // Jordan: starts with 077, 078, 079
    if (cleaned.startsWith('07')) {
      return `962${withoutZero}`;
    }
    // Egypt: starts with 010, 011, 012, 015
    if (cleaned.startsWith('01')) {
      return `20${withoutZero}`;
    }
    // Saudi Arabia: starts with 05 (050, 053, 054, 055, 056, 058, 059)
    if (cleaned.startsWith('05') && cleaned.length === 10) {
      return `966${withoutZero}`;
    }
    // Lebanon: starts with 03
    if (cleaned.startsWith('03')) {
      return `961${withoutZero}`;
    }

    // If none of the specific national prefixes matched, use default country code
    return `${defaultCode}${withoutZero}`;
  }

  // 6. Local numbers without leading zero (e.g. 961141216 or 933123456 in Syria)
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `963${cleaned}`;
  }
  if (cleaned.length === 9 && (cleaned.startsWith('59') || cleaned.startsWith('56'))) {
    return `970${cleaned}`;
  }
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return `962${cleaned}`;
  }

  // 7. If the number does not already start with the default country code, prepend it
  if (!cleaned.startsWith(defaultCode) && cleaned.length <= 10) {
    return `${defaultCode}${cleaned}`;
  }

  return cleaned;
}

export interface DetectedPhoneInfo {
  countryCode: string;
  countryName: string;
  flag: string;
  cleaned: string;
  formattedDisplay: string;
  isValid: boolean;
}

/**
 * Detect country, validity, and formatted international number for display
 */
export function detectPhoneCountry(phone?: string, defaultCountryCode?: string): DetectedPhoneInfo {
  const defCode = defaultCountryCode || '+963';
  if (!phone || !phone.trim()) {
    return {
      countryCode: defCode,
      countryName: defCode === '+970' ? 'فلسطين' : defCode === '+962' ? 'الأردن' : defCode === '+966' ? 'السعودية' : 'سوريا',
      flag: defCode === '+970' ? '🇵🇸' : defCode === '+962' ? '🇯🇴' : defCode === '+966' ? '🇸🇦' : '🇸🇾',
      cleaned: '',
      formattedDisplay: '',
      isValid: false,
    };
  }

  const cleaned = cleanPhoneNumber(phone, defCode);
  if (!cleaned || cleaned.length < 8) {
    return {
      countryCode: defCode,
      countryName: 'غير مكتمل',
      flag: '⚠️',
      cleaned,
      formattedDisplay: phone,
      isValid: false,
    };
  }

  if (cleaned.startsWith('963')) {
    const local = cleaned.substring(3);
    return {
      countryCode: '+963',
      countryName: 'سوريا',
      flag: '🇸🇾',
      cleaned,
      formattedDisplay: `+963 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`.trim(),
      isValid: true,
    };
  }
  if (cleaned.startsWith('970') || cleaned.startsWith('972')) {
    const local = cleaned.substring(3);
    return {
      countryCode: '+970',
      countryName: 'فلسطين',
      flag: '🇵🇸',
      cleaned,
      formattedDisplay: `+970 ${local.substring(0, 3)} ${local.substring(3)}`.trim(),
      isValid: true,
    };
  }
  if (cleaned.startsWith('962')) {
    const local = cleaned.substring(3);
    return {
      countryCode: '+962',
      countryName: 'الأردن',
      flag: '🇯🇴',
      cleaned,
      formattedDisplay: `+962 ${local.substring(0, 2)} ${local.substring(2)}`.trim(),
      isValid: true,
    };
  }
  if (cleaned.startsWith('966')) {
    const local = cleaned.substring(3);
    return {
      countryCode: '+966',
      countryName: 'السعودية',
      flag: '🇸🇦',
      cleaned,
      formattedDisplay: `+966 ${local.substring(0, 2)} ${local.substring(2)}`.trim(),
      isValid: true,
    };
  }
  if (cleaned.startsWith('961')) {
    const local = cleaned.substring(3);
    return {
      countryCode: '+961',
      countryName: 'لبنان',
      flag: '🇱🇧',
      cleaned,
      formattedDisplay: `+961 ${local.substring(0, 2)} ${local.substring(2)}`.trim(),
      isValid: true,
    };
  }
  if (cleaned.startsWith('20')) {
    const local = cleaned.substring(2);
    return {
      countryCode: '+20',
      countryName: 'مصر',
      flag: '🇪🇬',
      cleaned,
      formattedDisplay: `+20 ${local.substring(0, 3)} ${local.substring(3)}`.trim(),
      isValid: true,
    };
  }
  if (cleaned.startsWith('90')) {
    const local = cleaned.substring(2);
    return {
      countryCode: '+90',
      countryName: 'تركيا',
      flag: '🇹🇷',
      cleaned,
      formattedDisplay: `+90 ${local.substring(0, 3)} ${local.substring(3)}`.trim(),
      isValid: true,
    };
  }
  if (cleaned.startsWith('964')) {
    const local = cleaned.substring(3);
    return {
      countryCode: '+964',
      countryName: 'العراق',
      flag: '🇮🇶',
      cleaned,
      formattedDisplay: `+964 ${local.substring(0, 3)} ${local.substring(3)}`.trim(),
      isValid: true,
    };
  }

  return {
    countryCode: `+${cleaned.substring(0, 3)}`,
    countryName: 'دولي',
    flag: '🌍',
    cleaned,
    formattedDisplay: `+${cleaned}`,
    isValid: true,
  };
}

/**
 * Copies an image Blob to the clipboard so the user can paste it directly into WhatsApp
 */
export async function copyImageBlobToClipboard(blob: Blob): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !window.ClipboardItem) {
    return false;
  }
  try {
    const item = new ClipboardItem({ [blob.type || 'image/png']: blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Clipboard write failed:', err);
    return false;
  }
}

/**
 * Opens WhatsApp Messenger or WhatsApp Business directly into the customer's chat.
 * Uses official direct deep-links (https://api.whatsapp.com/send?phone=<phone> or https://wa.me/<phone>)
 * that bypass the contact-picker and immediately navigate into the customer's chat.
 */
export function openWhatsApp({
  phone,
  text,
  type = 'auto',
  countryCode,
}: WhatsAppShareOptions): void {
  const cleanedPhone = cleanPhoneNumber(phone, countryCode);
  const encodedText = encodeURIComponent(text);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const triggerDirectUrl = (url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = url;
    }
  };

  // When a valid customer phone is available, open the exact chat directly!
  if (cleanedPhone) {
    const directChatUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`;
    const waMeUrl = `https://wa.me/${cleanedPhone}?text=${encodedText}`;

    // On Android: if user explicitly selected WhatsApp Business
    if (type === 'business' && isAndroid) {
      // Use HTTPS scheme with package name to ensure WhatsApp Business handles the phone parameter
      const businessIntentUrl = `intent://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}#Intent;package=com.whatsapp.w4b;scheme=https;end`;
      try {
        triggerDirectUrl(businessIntentUrl);
        return;
      } catch (e) {
        console.warn('Failed to launch WhatsApp Business via intent', e);
      }
    }

    // On Android: if user explicitly selected standard WhatsApp
    if (type === 'standard' && isAndroid) {
      const standardIntentUrl = `intent://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}#Intent;package=com.whatsapp;scheme=https;end`;
      try {
        triggerDirectUrl(standardIntentUrl);
        return;
      } catch (e) {
        console.warn('Failed to launch WhatsApp via intent', e);
      }
    }

    // Universal direct route:
    if (isMobile) {
      triggerDirectUrl(directChatUrl);
    } else {
      window.open(waMeUrl, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  // Fallback if no phone number was found:
  const fallbackUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (isMobile) {
    triggerDirectUrl(fallbackUrl);
  } else {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  }
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
