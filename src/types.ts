export type ProductCategory = 'aluminum' | 'accordion' | 'zebra' | 'shutters';

export type MeasurementUnit = 'cm' | 'm';

export type OrderStatus = 'quotation' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

export interface ItemOptions {
  // Aluminum specific
  profileType?: string; // سحاب 9سم، سحاب 12سم، مفصلي 4.5سم، واجهة استركشر
  glassType?: string; // زجاج مفرد، دبل جلاس، عاكس، سيكوريت، مثلج
  aluminumColor?: string; // أبيض، بيج، أسود، خشابي، شامبين

  // Accordion specific
  accordionMaterial?: string; // بلاستيك PVC، جلد فاخر، ألمنيوم شرايح
  accordionLock?: string; // قفل عادي بمفتاح، قفل مغناطيسي، بدون قفل

  // Zebra specific
  zebraFabric?: string; // سادة عازل خفيف، بلاك آوت عازل تام، مقلم، قماش تركي فاخر
  zebraCassette?: string; // شريط ماكينة عادي، ماكينة ألمنيوم مغلقة فاخرة

  // Shutters specific
  shutterSlat?: string; // شريحة فوم عازل، شريحة سحب ألمنيوم مقوى (حماية)
  shutterOperation?: string; // شريط منافيل يدوي، موتور سومفي فرنسي، موتور إيطالي/صيني، مفتاح حائط، ريموت
  boxAllowanceCm?: number; // زيادة ارتفاع صندوق الأباجور بالسنتيمتر (مثلاً +25سم أو +30سم)
}

export interface OrderItem {
  id: string;
  category: ProductCategory;
  name: string;
  width: number;
  height: number;
  unit: MeasurementUnit;
  quantity: number;
  minArea: number; // الحد الأدنى للمساحة بالمتر المربع
  calculatedArea: number; // مساحة الحبة الواحدة بالمتر المربع
  totalArea: number; // إجمالي المساحة (المساحة × الكمية)
  costPerMeter: number; // تكلفة المتر على صاحب الورشة
  pricePerMeter: number; // سعر بيع المتر للزبون
  additionalCost: number; // تكلفة إضافية لكل قطعة (إكسسوار، محرك، إلخ)
  additionalPrice: number; // سعر إضافي لكل قطعة للزبون
  additionalName?: string; // بيان الإضافة كمسكات الباب، القفل، الماتور
  hasAdditions?: boolean; // تفعيل مربع الإضافات الاختياري
  totalCost: number; // إجمالي التكلفة
  totalPrice: number; // إجمالي البيع
  profit: number; // صافي الربح
  profitMargin: number; // نسبة الربح %
  notes?: string;
  options?: ItemOptions;
  syncedPurchaseInfo?: {
    supplierName?: string;
    invoiceNumber?: string;
    suggestedCostPerMeter?: number;
    syncedAt?: string;
  };
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  discount: number; // خصم مالي
  deposit: number; // الدفعة المقدمة / العربون
  taxRate: number; // نسبة الضريبة إن وجدت %
  status: OrderStatus;
  deliveryDate?: string;
  createdAt: string;
  notes?: string;
  totalCost: number; // إجمالي تكلفة الشراء والمواد المحسوبة ضمناً
  subtotal: number;
  finalSellingPrice: number; // إجمالي فاتورة البيع للزبون
  netProfit: number; // صافي الربح = finalSellingPrice - totalCost
  remainingBalance: number;
  syncedWithPurchases?: boolean; // هل تم حساب التكلفة ضمناً من فواتير الشراء
  linkedPurchaseInvoiceId?: string; // معرف فاتورة الشراء المرتبطة
}

export interface WorkshopSettings {
  workshopName: string;
  ownerName: string;
  phone: string;
  address: string;
  email?: string;
  logoUrl?: string;
  currency: string;
  defaultUnit: MeasurementUnit; // 'cm' | 'm'
  invoiceNotes: string;
  defaultCosts: Record<ProductCategory, { costPerMeter: number; pricePerMeter: number; minArea: number }>;
}

export const SUPPORTED_CURRENCIES = [
  { code: '$', name: 'دولار أمريكي ($)' },
  { code: 'د.أ', name: 'دينار أردني (د.أ)' },
  { code: 'ل.س', name: 'ليرة سورية (ل.س)' },
];

export const CATEGORY_LABELS: Record<ProductCategory, { title: string; subtitle: string; icon: string }> = {
  aluminum: {
    title: 'ألمنيوم وشبابيك',
    subtitle: 'شبابيك، أبواب، قواطع، دبل جلاس، مفصلي وسحاب',
    icon: 'Grid',
  },
  accordion: {
    title: 'أبواب الأكرديون',
    subtitle: 'أبواب أكرديون سحاب PVC وجلد وألمنيوم',
    icon: 'Split',
  },
  zebra: {
    title: 'شبابيك وستائر زيبرا',
    subtitle: 'ستائر رول وزيبرا تركي وبلاك آوت للمنازل والمكاتب',
    icon: 'Blinds',
  },
  shutters: {
    title: 'أباجورات وشتر',
    subtitle: 'شتر ألمنيوم فوم وحماية، يدوي ومحركات كهربائية',
    icon: 'Maximize2',
  },
};

export const STATUS_LABELS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  quotation: { label: 'عرض سعر', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  in_progress: { label: 'قيد التفصيل والتصنيع', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  ready: { label: 'جاهز للتركيب', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  completed: { label: 'تم التسليم والتحصيل', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'ملغي', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export type PurchaseCategory =
  | 'aluminum'
  | 'glass'
  | 'accordion'
  | 'zebra'
  | 'shutters'
  | 'accessories'
  | 'other';

export const PURCHASE_CATEGORY_LABELS: Record<
  PurchaseCategory,
  { label: string; icon: string; description: string }
> = {
  aluminum: {
    label: 'بروفايلات وقطاعات ألمنيوم',
    icon: 'Layers',
    description: 'بارات سحاب، مفصلي، تيوبات، زوايا، قواطع ألمنيوم',
  },
  glass: {
    label: 'زجاج ودبل جلاس وسيكوريت',
    icon: 'Maximize2',
    description: 'دبل جلاس، مفرد، عاكس، مثلج، مرايا، سيكوريت',
  },
  accordion: {
    label: 'خامات ومستلزمات أكرديون',
    icon: 'Split',
    description: 'شرائح PVC، جلد عازل، مجاري سحب، مقابض ومغناطيس',
  },
  zebra: {
    label: 'أقمشة وماكينات زيبرا ورول',
    icon: 'Blinds',
    description: 'رولات قماش تركي، كاسيت ماكينة، جنازير وسلاسل',
  },
  shutters: {
    label: 'محركات وشرائح شتر وأباجورات',
    icon: 'Cpu',
    description: 'موتورات سومفي، شرائح فوم وحماية، ريموتات، صناديق',
  },
  accessories: {
    label: 'خردوات ومسكات وبراغي وسيليكون',
    icon: 'Wrench',
    description: 'فراشي عازل، كوشوك، مقابض، أقفال، سيليكون، براغي تثبيت',
  },
  other: {
    label: 'مشتريات ومواد متنوعة',
    icon: 'Package',
    description: 'مواد تغليف، كرتون، عدد وتجهيزات ورشة عامة',
  },
};

export type PurchasePaymentStatus = 'paid' | 'partial' | 'unpaid';

export const PURCHASE_PAYMENT_STATUS_LABELS: Record<
  PurchasePaymentStatus,
  { label: string; color: string; bg: string }
> = {
  paid: { label: 'مسدد بالكامل', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  partial: { label: 'مسدد جزئياً (متبقي رصيد)', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  unpaid: { label: 'غير مسدد (آجل / ذمة)', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export interface PurchaseInvoiceItem {
  id: string;
  description: string;
  category: PurchaseCategory;
  quantity: number;
  unit: string; // بارة / م² / حبة / رول / كرتونة / طقم
  unitPrice: number;
  totalPrice: number;
}

export interface SupplierPurchaseInvoice {
  id: string;
  invoiceNumber: string; // e.g. PUR-201
  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;
  category: PurchaseCategory;
  invoiceDate: string;
  dueDate?: string;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PurchasePaymentStatus;
  paymentMethod?: 'cash' | 'bank' | 'check' | 'credit';
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 'rent' | 'salaries' | 'materials' | 'tools' | 'transport' | 'utilities' | 'other';

export interface WorkshopExpense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string }> = {
  rent: { label: 'إيجار الورشة / المحل', icon: 'Building' },
  salaries: { label: 'أجور ورواتب صنايعية', icon: 'Users' },
  materials: { label: 'خامات ومشتريات إضافية', icon: 'Package' },
  tools: { label: 'صيانة ماكينات وعُدد', icon: 'Wrench' },
  transport: { label: 'نقل ومحروقات وبنزين', icon: 'Truck' },
  utilities: { label: 'كهرباء ومياه وانترنت', icon: 'Zap' },
  other: { label: 'نثريات ومصاريف أخرى', icon: 'Receipt' },
};

export const DEFAULT_SETTINGS: WorkshopSettings = {
  workshopName: 'ورشة الفن الحديث للألمنيوم والديكور',
  ownerName: 'المعلم أبو أحمد',
  phone: '0599000000',
  address: 'المنطقة الصناعية - الشارع الرئيسي',
  email: 'workshop@example.com',
  logoUrl: '',
  currency: 'د.أ',
  defaultUnit: 'cm',
  invoiceNotes: 'يشمل السعر التوريد والتركيب مع ضمان لمدة 5 سنوات على الألمنيوم وسنتين على المحركات والإكسسوارات.',
  defaultCosts: {
    aluminum: { costPerMeter: 45, pricePerMeter: 75, minArea: 1.0 },
    accordion: { costPerMeter: 25, pricePerMeter: 45, minArea: 1.8 },
    zebra: { costPerMeter: 12, pricePerMeter: 22, minArea: 1.5 },
    shutters: { costPerMeter: 35, pricePerMeter: 60, minArea: 1.5 },
  },
};
