import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  active?: boolean;
}

// Renamed internally concept to just "Card" style, though keeping export name for compatibility
export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon, active = false }) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300 bg-white
        ${active 
          ? 'border-primary-500 ring-1 ring-primary-500 shadow-md' 
          : 'border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md'
        }
        ${className}
      `}
    >
      {(title || icon) && (
        <div className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/50">
          {icon && <span className="text-primary-600">{icon}</span>}
          {title && <h3 className="font-semibold text-slate-800 tracking-tight">{title}</h3>}
        </div>
      )}
      <div className="p-4 h-full">
        {children}
      </div>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:scale-[0.98]",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    ghost: "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && icon}
      {children}
    </button>
  );
};