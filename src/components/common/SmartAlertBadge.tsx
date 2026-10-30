import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SmartAlertBadgeProps {
  status: 'safe' | 'warning' | 'danger';
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SmartAlertBadge: React.FC<SmartAlertBadgeProps> = ({
  status,
  label,
  className,
  size = 'md'
}) => {
  const config = {
    safe: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      icon: ShieldCheck,
      defaultLabel: 'Aman Terkendali',
      glow: 'shadow-emerald-500/20'
    },
    warning: {
      color: 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
      icon: AlertTriangle,
      defaultLabel: 'Mendekati Limit (≥80%)',
      glow: 'shadow-amber-500/30'
    },
    danger: {
      color: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-700 animate-pulse',
      icon: AlertOctagon,
      defaultLabel: 'Melebihi Limit (>100%)',
      glow: 'shadow-rose-500/50 shadow-lg'
    }
  }[status];

  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm md:text-base px-3.5 py-1.5 gap-2'
  }[size];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center font-medium rounded-full border shadow-sm transition-all duration-300',
        config.color,
        config.glow,
        sizeClasses,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>{displayLabel}</span>
    </motion.div>
  );
};
