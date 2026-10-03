import {
  SupplierPurchaseInvoice,
  OrderItem,
  CustomerOrder,
  ProductCategory,
  WorkshopSettings,
  PurchaseCategory,
} from '../types';
import { calculateItemMetrics } from './calculator';

export interface CategoryPurchaseCostInfo {
  costPerMeter: number;
  additionalCost?: number;
  supplierName: string;
  invoiceNumber: string;
  date?: string;
  details: string;
}

/**
 * Extracts the latest material costs from supplier purchase invoices
 */
export function extractCostsFromPurchases(
  purchaseInvoices: SupplierPurchaseInvoice[],
  defaultCosts: WorkshopSettings['defaultCosts']
): Record<ProductCategory, CategoryPurchaseCostInfo> {
  // Fallbacks based on workshop defaults
  const result: Record<ProductCategory, CategoryPurchaseCostInfo> = {
    aluminum: {
      costPerMeter: defaultCosts.aluminum.costPerMeter,
      supplierName: 'سعر افتراضي للورشة',
      invoiceNumber: 'افتراضي',
      details: 'تكلفة بروفيل الألمنيوم والزجاج',
    },
    accordion: {
      costPerMeter: defaultCosts.accordion.costPerMeter,
      supplierName: 'سعر افتراضي للورشة',
      invoiceNumber: 'افتراضي',
      details: 'تكلفة أبواب الأكرديون PVC',
    },
    zebra: {
      costPerMeter: defaultCosts.zebra.costPerMeter,
      supplierName: 'سعر افتراضي للورشة',
      invoiceNumber: 'افتراضي',
      details: 'تكلفة أقمشة وماكينات الزيبرا',
    },
    shutters: {
      costPerMeter: defaultCosts.shutters.costPerMeter,
      additionalCost: 45,
      supplierName: 'سعر افتراضي للورشة',
      invoiceNumber: 'افتراضي',
      details: 'تكلفة شرائح الشتر والمحركات',
    },
  };

  if (!purchaseInvoices || purchaseInvoices.length === 0) {
    return result;
  }

  // Sort purchase invoices by date descending (latest first)
  const sortedInvoices = [...purchaseInvoices].sort(
    (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
  );

  // 1. Aluminum (Profiles + Glass)
  const aluminumInv = sortedInvoices.find(
    (inv) =>
      inv.category === 'aluminum' ||
      inv.items.some((i) => i.description.includes('ألمنيوم') || i.description.includes('بروفيل'))
  );
  const glassInv = sortedInvoices.find(
    (inv) =>
      inv.category === 'glass' ||
      inv.items.some((i) => i.description.includes('زجاج'))
  );

  if (aluminumInv) {
    const profileItem = aluminumInv.items.find(
      (i) => i.description.includes('بروفيل') || i.description.includes('ألمنيوم')
    ) || aluminumInv.items[0];
    const glassItem = glassInv?.items.find((i) => i.description.includes('زجاج')) || glassInv?.items[0];

    const profileUnitCost = profileItem ? profileItem.unitPrice : 28;
    const glassUnitCost = glassItem ? glassItem.unitPrice : 17;
    const combinedCost = Number((profileUnitCost + glassUnitCost).toFixed(2));

    result.aluminum = {
      costPerMeter: combinedCost,
      supplierName: glassInv
        ? `${aluminumInv.supplierName} + ${glassInv.supplierName}`
        : aluminumInv.supplierName,
      invoiceNumber: glassInv
        ? `${aluminumInv.invoiceNumber} / ${glassInv.invoiceNumber}`
        : aluminumInv.invoiceNumber,
      date: aluminumInv.invoiceDate,
      details: `بروفيل (${profileUnitCost} د.أ) + زجاج (${glassUnitCost} د.أ)`,
    };
  }

  // 2. Accordion Doors
  const accordionInv = sortedInvoices.find(
    (inv) =>
      inv.category === 'accordion' ||
      inv.items.some((i) => i.description.includes('أكرديون') || i.description.includes('باب'))
  );
  if (accordionInv) {
    const item = accordionInv.items.find(
      (i) => i.description.includes('أكرديون') || i.description.includes('باب')
    ) || accordionInv.items[0];
    if (item && item.unitPrice > 0) {
      result.accordion = {
        costPerMeter: item.unitPrice,
        supplierName: accordionInv.supplierName,
        invoiceNumber: accordionInv.invoiceNumber,
        date: accordionInv.invoiceDate,
        details: item.description,
      };
    }
  }

  // 3. Zebra Curtains
  const zebraInv = sortedInvoices.find(
    (inv) =>
      inv.category === 'zebra' ||
      inv.items.some((i) => i.description.includes('زيبرا') || i.description.includes('قماش') || i.description.includes('ستار'))
  );
  if (zebraInv) {
    const item = zebraInv.items.find(
      (i) => i.description.includes('زيبرا') || i.description.includes('قماش')
    ) || zebraInv.items[0];
    if (item && item.unitPrice > 0) {
      result.zebra = {
        costPerMeter: item.unitPrice,
        supplierName: zebraInv.supplierName,
        invoiceNumber: zebraInv.invoiceNumber,
        date: zebraInv.invoiceDate,
        details: item.description,
      };
    }
  }

  // 4. Shutters & Motors
  const shutterInv = sortedInvoices.find(
    (inv) =>
      inv.category === 'shutters' ||
      inv.items.some((i) => i.description.includes('شتر') || i.description.includes('أباجور') || i.description.includes('موتور'))
  );
  if (shutterInv) {
    const slatItem = shutterInv.items.find(
      (i) => i.description.includes('شريحة') || i.description.includes('فوم') || i.description.includes('شتر')
    );
    const motorItem = shutterInv.items.find(
      (i) => i.description.includes('موتور') || i.description.includes('محرك') || i.description.includes('سومفي')
    );

    const slatCost = slatItem ? slatItem.unitPrice : defaultCosts.shutters.costPerMeter;
    const motorCost = motorItem ? motorItem.unitPrice : 45;

    result.shutters = {
      costPerMeter: slatCost,
      additionalCost: motorCost,
      supplierName: shutterInv.supplierName,
      invoiceNumber: shutterInv.invoiceNumber,
      date: shutterInv.invoiceDate,
      details: `شرائح (${slatCost} د.أ/م²) + موتور (${motorCost} د.أ)`,
    };
  }

  return result;
}

/**
 * Synchronizes an order item with the latest purchase costs from supplier invoices
 */
export function syncOrderItemWithPurchases(
  item: OrderItem,
  categoryCosts: Record<ProductCategory, CategoryPurchaseCostInfo>
): OrderItem {
  const purchaseCost = categoryCosts[item.category];
  if (!purchaseCost) return item;

  const newCostPerMeter = purchaseCost.costPerMeter;
  let newAdditionalCost = item.additionalCost;

  // If shutters item with motor
  if (item.category === 'shutters' && purchaseCost.additionalCost && item.additionalPrice > 0) {
    newAdditionalCost = purchaseCost.additionalCost;
  }

  const metrics = calculateItemMetrics({
    category: item.category,
    width: item.width,
    height: item.height,
    unit: item.unit,
    quantity: item.quantity,
    minArea: item.minArea,
    costPerMeter: newCostPerMeter,
    pricePerMeter: item.pricePerMeter,
    additionalCost: newAdditionalCost,
    additionalPrice: item.additionalPrice,
    options: item.options,
  });

  return {
    ...item,
    costPerMeter: newCostPerMeter,
    additionalCost: newAdditionalCost,
    calculatedArea: metrics.calculatedArea,
    totalArea: metrics.totalArea,
    totalCost: metrics.totalCost,
    totalPrice: metrics.totalPrice,
    profit: metrics.profit,
    profitMargin: metrics.profitMargin,
    syncedPurchaseInfo: {
      supplierName: purchaseCost.supplierName,
      invoiceNumber: purchaseCost.invoiceNumber,
      suggestedCostPerMeter: newCostPerMeter,
      syncedAt: new Date().toISOString(),
    },
  };
}

/**
 * Automatically generates a linked supplier purchase invoice draft
 * based on the materials needed for a customer sales invoice
 */
export function generateLinkedPurchaseInvoice(
  order: CustomerOrder,
  settings: WorkshopSettings
): SupplierPurchaseInvoice {
  const invoiceItems: Array<{
    id: string;
    description: string;
    category: PurchaseCategory;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  // Group items by category to determine needed supplier materials
  order.items.forEach((item, idx) => {
    if (item.category === 'aluminum') {
      // Aluminum profile bar + glass
      const profileCost = Math.round(item.totalArea * (item.costPerMeter * 0.6));
      const glassCost = Math.round(item.totalArea * (item.costPerMeter * 0.4));

      invoiceItems.push({
        id: `pitem-${idx}-1`,
        description: `مقاطع ألمنيوم وإكسسوارات لـ (${item.name}) - مساحة ${item.totalArea} م²`,
        category: 'aluminum',
        quantity: Math.max(1, Math.ceil(item.totalArea * 1.5)),
        unit: 'بارة/م',
        unitPrice: Number((profileCost / Math.max(1, Math.ceil(item.totalArea * 1.5))).toFixed(2)),
        totalPrice: profileCost,
      });

      invoiceItems.push({
        id: `pitem-${idx}-2`,
        description: `ألواح زجاج ${item.options?.glassType || 'دبل جلاس'} مساحة ${item.totalArea} م²`,
        category: 'glass',
        quantity: Number(item.totalArea.toFixed(2)),
        unit: 'م²',
        unitPrice: Number((glassCost / Math.max(0.1, item.totalArea)).toFixed(2)),
        totalPrice: glassCost,
      });
    } else if (item.category === 'accordion') {
      invoiceItems.push({
        id: `pitem-${idx}-1`,
        description: `خامات وأبواب أكرديون جاهزة للتفصيل (${item.name}) - ${item.quantity} باب`,
        category: 'accordion',
        quantity: item.quantity,
        unit: 'باب',
        unitPrice: Number((item.totalCost / item.quantity).toFixed(2)),
        totalPrice: item.totalCost,
      });
    } else if (item.category === 'zebra') {
      invoiceItems.push({
        id: `pitem-${idx}-1`,
        description: `أقمشة وماكينات ستائر زيبرا تركي (${item.name}) - ${item.totalArea} م²`,
        category: 'zebra',
        quantity: Number(item.totalArea.toFixed(2)),
        unit: 'م²',
        unitPrice: item.costPerMeter,
        totalPrice: item.totalCost,
      });
    } else if (item.category === 'shutters') {
      const slatCost = Math.round(item.totalArea * item.costPerMeter);
      const motorCost = item.additionalCost * item.quantity;

      invoiceItems.push({
        id: `pitem-${idx}-1`,
        description: `شرائح وصناديق شتر ألمنيوم فوم (${item.name}) - ${item.totalArea} م²`,
        category: 'shutters',
        quantity: Number(item.totalArea.toFixed(2)),
        unit: 'م²',
        unitPrice: item.costPerMeter,
        totalPrice: slatCost,
      });

      if (motorCost > 0) {
        invoiceItems.push({
          id: `pitem-${idx}-2`,
          description: `محركات شتر إلكترونية (${item.options?.shutterOperation || 'موتور سومفي'}) - عدد ${item.quantity}`,
          category: 'shutters',
          quantity: item.quantity,
          unit: 'محرك',
          unitPrice: item.additionalCost,
          totalPrice: motorCost,
        });
      }
    }
  });

  const totalAmount = invoiceItems.reduce((sum, i) => sum + i.totalPrice, 0);

  const newPurchaseInvoice: SupplierPurchaseInvoice = {
    id: `pur-linked-${Date.now()}`,
    invoiceNumber: `PUR-ORD-${order.orderNumber.replace(/[^0-9]/g, '') || Math.floor(100 + Math.random() * 900)}`,
    supplierName: `مشتريات خامات لطلب الزبون: ${order.customerName}`,
    supplierPhone: order.customerPhone,
    supplierAddress: settings.address,
    category:
      order.items[0]?.category === 'aluminum'
        ? 'aluminum'
        : order.items[0]?.category === 'accordion'
        ? 'accordion'
        : order.items[0]?.category === 'zebra'
        ? 'zebra'
        : 'shutters',
    invoiceDate: new Date().toISOString().split('T')[0],
    items: invoiceItems,
    totalAmount,
    paidAmount: 0,
    remainingAmount: totalAmount,
    paymentStatus: 'unpaid',
    paymentMethod: 'credit',
    notes: `فاتورة شراء خامات تم توليدها تلقائياً ضمناً لطلب الزبون (${order.customerName}) - فاتورة بيع (${order.orderNumber}).`,
    createdAt: new Date().toISOString(),
  };

  return newPurchaseInvoice;
}
