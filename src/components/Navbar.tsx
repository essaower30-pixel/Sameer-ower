import React from 'react';
import {
  Wrench,
  Coins,
  Wallet,
  Users,
  Truck,
} from 'lucide-react';
import {
  WorkshopSettings,
  CustomerOrder,
  SupplierPurchaseInvoice,
  WorkshopExpense,
  SUPPORTED_CURRENCIES,
  MeasurementUnit,
} from '../types';
import { WorkshopSettingsDropdown } from './WorkshopSettingsDropdown';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveNavTab = 'orders' | 'suppliers' | 'finances' | 'calculator';

interface Props {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onNewOrder?: () => void;
  onNewPurchaseInvoice?: () => void;
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
  orders: CustomerOrder[];
  purchaseInvoices?: SupplierPurchaseInvoice[];
  expenses?: WorkshopExpense[];
  onImportData: (data: { orders: CustomerOrder[]; settings: WorkshopSettings }) => void;
  onResetData: () => void;
  onRestoreAllData?: (data: {
    settings: WorkshopSettings;
    orders: CustomerOrder[];
    purchases: SupplierPurchaseInvoice[];
    expenses: WorkshopExpense[];
  }) => void;
  onCurrencyChange: (currency: string) => void;
  onDefaultUnitChange: (unit: MeasurementUnit) => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  settings,
  onSaveSettings,
  orders,
  purchaseInvoices = [],
  expenses = [],
  onImportData,
  onResetData,
  onRestoreAllData,
  onCurrencyChange,
  onDefaultUnitChange,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print w-full">
      <div className="max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-16 gap-1 sm:gap-3">
          {/* 1. Right Side: Settings 3-Dashes + Workshop Logo/Name on lg+ */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 3-Bar Hamburger Settings Button */}
            <WorkshopSettingsDropdown
              settings={settings}
              onSaveSettings={onSaveSettings}
              orders={orders}
              purchaseInvoices={purchaseInvoices}
              expenses={expenses}
              onImportData={onImportData}
              onResetData={onResetData}
              onRestoreAllData={onRestoreAllData}
            />

            {/* Shop Logo & Name (Visible on lg+ screens to keep mobile bar lean) */}
            <div className="hidden lg:flex items-center gap-2 min-w-0">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.workshopName}
                  className="w-8 h-8 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 text-xs xl:text-sm leading-none truncate max-w-[140px] xl:max-w-[190px]">
                  {settings.workshopName}
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  ألمنيوم • أكرديون • زيبرا • شتر
                </p>
              </div>
            </div>
          </div>

          {/* 2. Main Navigation Tabs: الزبائن (بيع) | الموردين (شراء) | الأرباح والميزانية */}
          {/* Designed to fit 100% on any mobile screen without horizontal scrolling */}
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 p-0.5 sm:p-1 rounded-xl shrink-0">
            {/* 1. الزبائن (فواتير البيع وحساب المقايسة) */}
            <button
              id="nav-tab-orders"
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="الزبائن - فواتير البيع"
            >
              <Users
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  activeTab === 'orders' ? 'text-blue-600' : 'text-slate-500'
                }`}
              />
              <span>الزبائن</span>
              <span className="hidden md:inline text-[11px] font-medium text-slate-400">
                (فواتير البيع)
              </span>
            </button>

            {/* 2. الموردين (فواتير الشراء والخامات) */}
            <button
              id="nav-tab-suppliers"
              type="button"
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-white text-amber-700 shadow-xs ring-1 ring-slate-200/60 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="الموردين - فواتير الشراء ومستلزمات الورشة"
            >
              <Truck
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  activeTab === 'suppliers' ? 'text-amber-600' : 'text-slate-500'
                }`}
              />
              <span>الموردين</span>
              <span className="hidden md:inline text-[11px] font-medium text-slate-400">
                (فواتير الشراء)
              </span>
            </button>

            {/* 3. الأرباح والميزانية (التقارير المالية) */}
            <button
              id="nav-tab-finances"
              type="button"
              onClick={() => setActiveTab('finances')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'finances'
                  ? 'bg-white text-purple-700 shadow-xs ring-1 ring-slate-200/60 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="أرباح وميزانية المحل والورشة"
            >
              <Wallet
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  activeTab === 'finances' ? 'text-purple-600' : 'text-slate-500'
                }`}
              />
              <span className="hidden sm:inline">الأرباح والميزانية</span>
              <span className="sm:hidden">الأرباح</span>
            </button>
          </nav>

          {/* 3. Left Side: Action Buttons & Currency/Unit Toggles */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* PWA Install Button (أوفلاين) */}
            <PWAInstallButton />

            {/* Currency Quick Switcher (visible on md+) */}
            <div
              className="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200"
              title="تغيير العملة"
            >
              <div className="flex items-center px-1 text-slate-500">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <select
                value={settings.currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 pr-0.5 pl-3 py-1 appearance-none cursor-pointer focus:outline-hidden"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Unit Switcher (سم / م) (visible on md+) */}
            <div
              className="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs"
              title="وحدة القياس"
            >
              <button
                type="button"
                onClick={() => onDefaultUnitChange('cm')}
                className={`px-1.5 py-0.5 rounded text-xs font-bold transition-all ${
                  settings.defaultUnit === 'cm'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                سم
              </button>
              <button
                type="button"
                onClick={() => onDefaultUnitChange('m')}
                className={`px-1.5 py-0.5 rounded text-xs font-bold transition-all ${
                  settings.defaultUnit === 'm'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                م
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slim Shop Identity Sub-bar for Mobile (< lg) so branding is visible without crowding top row */}
      <div className="lg:hidden flex items-center justify-between px-3 py-1 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
        <div className="flex items-center gap-1.5 min-w-0">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="w-4 h-4 object-contain rounded shrink-0" />
          ) : (
            <Wrench className="w-3 h-3 text-amber-600 shrink-0" />
          )}
          <span className="font-bold text-slate-800 truncate">{settings.workshopName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">
            {activeTab === 'orders'
              ? 'سجل فواتير البيع'
              : activeTab === 'suppliers'
              ? 'فواتير الشراء والتوريد'
              : 'الأرباح والميزانية'}
          </span>
          {settings.phone && (
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline" dir="ltr">
              {settings.phone}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
