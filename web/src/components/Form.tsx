import React from 'react';
import { cn } from '../lib/utils';
import { ChevronDown } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-sm font-semibold text-foreground/80 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl border transition-all duration-200 outline-none",
            "bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
            "placeholder:text-muted-foreground/50 text-sm",
            "dark:bg-white/[0.03] dark:border-white/[0.08]",
            "light:bg-black/[0.02] light:border-black/[0.08] light:text-black",
            error && "border-destructive/50 focus:border-destructive focus:ring-destructive/10",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive ml-1">{error}</p>}
      </div>
    );
  }
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-sm font-semibold text-foreground/80 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <select
            ref={ref}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border transition-all duration-200 outline-none appearance-none cursor-pointer",
              "bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
              "text-sm text-foreground",
              "dark:bg-card dark:border-white/[0.08]",
              "light:bg-white light:border-black/[0.08] light:text-black",
              "hover:border-white/20 dark:hover:border-white/20 light:hover:border-black/20",
              error && "border-destructive/50 focus:border-destructive focus:ring-destructive/10",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
            <ChevronDown size={18} />
          </div>
        </div>
        {error && <p className="text-xs text-destructive ml-1">{error}</p>}
      </div>
    );
  }
);
