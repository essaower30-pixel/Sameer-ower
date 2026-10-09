export type ProductCategory = 'aluminum' | 'accordion' | 'zebra' | 'shutters' | 'kitchens';

export type MeasurementUnit = 'cm' | 'm';

export type OrderStatus = 'quotation' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

/**
 * صنف أو مادة تدخل في صناعة وتفصيل المطبخ (Bill of Materials)
 */
export interface KitchenComponentItem {
  id: string;
  name: string; // اسم الصنف / الخامة (مثال: درف هاي غلوس، مفصلات هيدروليك بلوم، رخام كوارتز، سلة دوارة...)
  categoryType?: 'doors' | 'body' | 'countertop' | 'hardware' | 'accessories' | 'appliances' | 'other';
  quantity: number; // الكمية
  unit: string; // متر طولي، حبة، طقم، لوح، م²
  unitCost?: number; // تكلفة الصنف على الورشة
  unitPrice: number; // سعر بيع الصنف للزبون
  totalPrice: number; // الإجمالي للزبون
  notes?: string;
}

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

  // Kitchens specific (قسم وتفصيل المطابخ)
  kitchenLayout?: string; // مستقيم I-Shape، حرف L، حرف U، مع جزيرة وسطية
  kitchenCabinetBody?: string; // خشب لاتيه 18ملم، MDF ميلامين مقاوم للرطوبة، ألمنيوم دبل، خشب صولد
  kitchenDoorsType?: string; // هاي غلوس تركي/ألماني، بولي لاك Polylac، كلادينج، أكريليك، قشرة بلوط، زجاج بروفيل
  kitchenCountertop?: string; // رخام كوارتز تركي، جرانيت طبيعي جلاكسي، رخام صناعي كوربان، خشب معالج HPL
  kitchenHingesAndSlides?: string; // مفصلات ومجاري بلوم Blum هيدروليك، سوفت كلوز، ساميت تركي
  kitchenLinearMeters?: number; // إجمالي الأمتار الطولية للمطبخ (علوي + سفلي)
  kitchenComponentsRollup?: boolean; // هل يتم ترحيل أسعار الأصناف تلقائياً إلى إجمالي بيع المطبخ
  kitchenComponents?: KitchenComponentItem[]; // قائمة الأصناف والخامات الداخلة في صناعة المطبخ
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

export interface OrderPaymentRecord {
  id: string;
  amount: number;
  date: string; // ISO date string or formatted date
  note?: string; // e.g. 'دفعة مقدمة / عربون', 'سداد دفعة'
  paymentMethod?: 'cash' | 'bank' | 'check' | 'other';
  remainingAfter?: number; // الرصيد المتبقي بعد الدفعة
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  discount: number; // خصم مالي
  deposit: number; // الدفعة المقدمة / إجمالي المقبوض
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
  payments?: OrderPaymentRecord[]; // سجل وتفصيل الدفعات كل واحدة على حدة
  syncedWithPurchases?: boolean; // هل تم حساب التكلفة ضمناً من فواتير الشراء
  linkedPurchaseInvoiceId?: string; // معرف فاتورة الشراء المرتبطة
  currency?: string; // عملة الفاتورة المحددة (مثلاً $ أو ل.س)
  exchangeRate?: number; // سعر الصرف وقت تسجيل الفاتورة إن وجد
  customerSignature?: string; // صورة توقيع الزبون باللمس
  workshopSignature?: string; // صورة توقيع وختم الورشة باللمس
}

export interface WorkshopSettings {
  workshopName: string;
  ownerName: string;
  phone: string;
  address: string;
  email?: string;
  logoUrl?: string;
  appUrl?: string;
  currency: string;
  usdToSypRate?: number; // سعر صرف الدولار مقابل الليرة السورية
  defaultUnit: MeasurementUnit; // 'cm' | 'm'
  invoiceNotes: string;
  showTermsHeading?: boolean; // إظهار أو إلغاء عبارة "الشروط والأحكام" (افتراضياً: false ملغية)
  hideTermsBox?: boolean; // إخفاء صندوق الشروط والملاحظات بالكامل من الفاتورة
  managementTitle?: string; // صفة الإدارة (افتراضياً: 'إدارة:' أو تركها فارغة)
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
  kitchens: {
    title: 'مطابخ وتفصيل',
    subtitle: 'مطابخ ألمنيوم وخشب، هاي غلوس، بولي لاك، رخام وإكسسوارات',
    icon: 'UtensilsCrossed',
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

export interface SupplierPaymentRecord {
  id: string;
  amount: number;
  date: string; // ISO date string or formatted date
  note?: string; // e.g. 'سداد دفعة للمورد', 'دفعة شيك'
  paymentMethod?: 'cash' | 'bank' | 'check' | 'credit';
  remainingAfter?: number; // الرصيد المتبقي بعد الدفعة
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
  payments?: SupplierPaymentRecord[]; // سجل وتفصيل دفعات المورد كل وحدة على حدة
  paymentStatus: PurchasePaymentStatus;
  paymentMethod?: 'cash' | 'bank' | 'check' | 'credit';
  notes?: string;
  currency?: string; // عملة فاتورة المشتريات ($ أو ل.س)
  exchangeRate?: number;
  receiverSignature?: string; // توقيع المستلم باللمس
  supplierSignature?: string; // توقيع مندوب المورد باللمس
  createdAt: string;
}

export type ExpenseCategory = 'rent' | 'salaries' | 'materials' | 'tools' | 'transport' | 'utilities' | 'other';

export interface WorkshopExpense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  currency?: string; // عملة المصروف ($ أو ل.س)
  exchangeRate?: number;
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
  email: '',
  logoUrl: '',
  appUrl: '',
  currency: 'د.أ',
  usdToSypRate: 14500,
  defaultUnit: 'cm',
  invoiceNotes: 'يشمل السعر التوريد والتركيب مع ضمان لمدة 5 سنوات على الألمنيوم وسنتين على المحركات والإكسسوارات.',
  showTermsHeading: false, // إلغاء عبارة الشروط والأحكام افتراضياً
  hideTermsBox: false,
  managementTitle: 'إدارة:',
  defaultCosts: {
    aluminum: { costPerMeter: 45, pricePerMeter: 75, minArea: 1.0 },
    accordion: { costPerMeter: 25, pricePerMeter: 45, minArea: 1.8 },
    zebra: { costPerMeter: 12, pricePerMeter: 22, minArea: 1.5 },
    shutters: { costPerMeter: 35, pricePerMeter: 60, minArea: 1.5 },
    kitchens: { costPerMeter: 90, pricePerMeter: 160, minArea: 2.0 },
  },
};
