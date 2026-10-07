import { OrderItem, CustomerOrder, ProductCategory, MeasurementUnit, ItemOptions } from '../types';

/**
 * Calculates item metrics based on dimensions and pricing
 */
export function calculateItemMetrics(params: {
  category: ProductCategory;
  width: number;
  height: number;
  unit: MeasurementUnit;
  quantity: number;
  minArea: number;
  costPerMeter: number;
  pricePerMeter: number;
  additionalCost?: number;
  additionalPrice?: number;
  options?: ItemOptions;
}): {
  effectiveWidthM: number;
  effectiveHeightM: number;
  rawArea: number;
  calculatedArea: number;
  totalArea: number;
  totalCost: number;
  totalPrice: number;
  profit: number;
  profitMargin: number;
} {
  const {
    category,
    width,
    height,
    unit,
    quantity,
    minArea,
    costPerMeter,
    pricePerMeter,
    additionalCost = 0,
    additionalPrice = 0,
    options,
  } = params;

  // Box allowance for shutters if applicable
  const extraHeightCm = (category === 'shutters' && options?.boxAllowanceCm) ? options.boxAllowanceCm : 0;

  const w = Math.max(0, Number(width) || 0);
  const h = Math.max(0, Number(height) || 0);
  const qty = Math.max(1, Number(quantity) || 1);

  let effectiveWidthM = unit === 'cm' ? w / 100 : w;
  let effectiveHeightM = unit === 'cm' ? (h + extraHeightCm) / 100 : (h + extraHeightCm / 100);

  // حساب المطابخ بمتر الجر (Linear Running Meters) أو باقي المنتجات بالمتر المربع
  const isKitchen = category === 'kitchens';
  const rawArea = isKitchen
    ? Number(effectiveWidthM.toFixed(2)) // في المطابخ: العرض/الطول هو أمتار الجر (متر جر)
    : Number((effectiveWidthM * effectiveHeightM).toFixed(3)); // في الألمنيوم والستائر: مساحة م² (عرض × ارتفاع)
  
  // Single piece calculated area or linear meters (respecting minimum threshold)
  const minimumThreshold = Math.max(0, Number(minArea) || 0);
  const calculatedArea = Number(Math.max(rawArea, minimumThreshold).toFixed(2));
  const totalArea = Number((calculatedArea * qty).toFixed(2));

  const addCost = Number(additionalCost) || 0;
  const addPrice = Number(additionalPrice) || 0;
  const cPerM = Number(costPerMeter) || 0;
  const pPerM = Number(pricePerMeter) || 0;

  const unitCost = (calculatedArea * cPerM) + addCost;
  const unitPrice = (calculatedArea * pPerM) + addPrice;

  const totalCost = Number((unitCost * qty).toFixed(2));
  const totalPrice = Number((unitPrice * qty).toFixed(2));
  const profit = Number((totalPrice - totalCost).toFixed(2));
  const profitMargin = totalPrice > 0 ? Number(((profit / totalPrice) * 100).toFixed(1)) : 0;

  return {
    effectiveWidthM: Number(effectiveWidthM.toFixed(2)),
    effectiveHeightM: Number(effectiveHeightM.toFixed(2)),
    rawArea,
    calculatedArea,
    totalArea,
    totalCost,
    totalPrice,
    profit,
    profitMargin,
  };
}

/**
 * Calculates overall order financial totals
 */
export function calculateOrderTotals(items: OrderItem[], discount = 0, deposit = 0, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const totalCost = items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const disc = Math.max(0, Number(discount) || 0);
  const afterDiscount = Math.max(0, subtotal - disc);

  const tax = taxRate > 0 ? (afterDiscount * taxRate) / 100 : 0;
  const finalSellingPrice = Number((afterDiscount + tax).toFixed(2));
  const dep = Math.max(0, Number(deposit) || 0);
  const remainingBalance = Math.max(0, Number((finalSellingPrice - dep).toFixed(2)));
  const netProfit = Number((finalSellingPrice - totalCost).toFixed(2));
  const profitMargin = finalSellingPrice > 0 ? Number(((netProfit / finalSellingPrice) * 100).toFixed(1)) : 0;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    discount: disc,
    tax: Number(tax.toFixed(2)),
    finalSellingPrice,
    deposit: dep,
    remainingBalance,
    netProfit,
    profitMargin,
  };
}

/**
 * Creates formatted WhatsApp message for sending quotation/receipt directly to customer
 */
export function generateWhatsAppMessage(order: CustomerOrder, workshopName: string, currency: string): string {
  const lines: string[] = [];
  lines.push(`السلام عليكم ورحمة الله وبركاته، الأخ الكريم / ${order.customerName || 'الزبون المحترم'}`);
  lines.push(`تحية طيبة من *${workshopName}* 🛠️`);
  lines.push(`يسعدنا تزويدكم بتفاصيل فاتورة البيع رقم: *${order.orderNumber}*`);
  lines.push('──────────────────');

  order.items.forEach((item, idx) => {
    lines.push(`*${idx + 1}. ${item.name}* (${item.quantity} قطع)`);
    lines.push(`▫️ المقاس: ${item.width} × ${item.height} ${item.unit === 'cm' ? 'سم' : 'م'}`);
    lines.push(`▫️ إجمالي المساحة: ${item.totalArea} م²`);
    lines.push(`▫️ السعر: ${item.totalPrice.toLocaleString()} ${currency}`);
    lines.push('');
  });

  lines.push('──────────────────');
  lines.push(`*المجموع الإجمالي:* ${order.subtotal.toLocaleString()} ${currency}`);
  if (order.discount > 0) {
    lines.push(`*الخصم:* ${order.discount.toLocaleString()} ${currency}`);
  }
  lines.push(`*الصافي المطلوب:* ${order.finalSellingPrice.toLocaleString()} ${currency}`);
  lines.push(`*الدفعة المقدمة (العربون):* ${order.deposit.toLocaleString()} ${currency}`);
  lines.push(`*المتبقي عند التركيب:* ${order.remainingBalance.toLocaleString()} ${currency}`);

  if (order.deliveryDate) {
    lines.push(`*موعد التسليم المتوقع:* ${order.deliveryDate}`);
  }

  if (order.notes) {
    lines.push(`*ملاحظات:* ${order.notes}`);
  }

  lines.push('──────────────────');
  lines.push('شاكرين ثقتكم بنا واختياركم لخدماتنا ✨');

  return encodeURIComponent(lines.join('\n'));
}

/**
 * Format currency number nicely
 */
export function formatCurrency(amount: number, currency: string = 'د.أ'): string {
  return `${Number(amount || 0).toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}
