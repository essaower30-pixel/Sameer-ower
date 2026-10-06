import React from 'react';
import { ProductCategory } from '../types';
import { Grid, Split, Blinds, Maximize2, UtensilsCrossed } from 'lucide-react';

interface Props {
  category: ProductCategory;
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryBadge: React.FC<Props> = ({ category, size = 'md' }) => {
  const configs: Record<
    ProductCategory,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    aluminum: {
      label: 'ألمنيوم وشبابيك',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <Grid className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    accordion: {
      label: 'باب أكرديون',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <Split className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    zebra: {
      label: 'ستائر زيبرا',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <Blinds className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    shutters: {
      label: 'أباجور شتر',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: <Maximize2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
    kitchens: {
      label: 'مطابخ وتفصيل',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: <UtensilsCrossed className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />,
    },
  };

  const config = configs[category] || configs.aluminum;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
