import React, { ReactNode } from 'react';

// --- NEW LOGO COMPONENT ---
export const Logo: React.FC<{ className?: string, size?: number }> = ({ className = "", size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 ${className}`}
    >
      {/* Soft Drop Shadow Filter */}
      <defs>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
        </filter>
        <linearGradient id="purple_gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" /> {/* Vibrant Purple */}
          <stop offset="1" stopColor="#6366F1" /> {/* Indigo/Purple */}
        </linearGradient>
      </defs>

      {/* Background: Rounded Square with Vibrant Purple */}
      <rect 
        width="40" 
        height="40" 
        rx="10" 
        fill="url(#purple_gradient)" 
        filter="url(#soft-shadow)"
      />
      
      {/* Concentric Circles: Target Symbol */}
      {/* Outer Ring */}
      <circle cx="20" cy="20" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.95" />
      
      {/* Middle Ring */}
      <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="2.5" strokeOpacity="0.95" />
      
      {/* Center Dot (Bullseye) */}
      <circle cx="20" cy="20" r="3.5" fill="white" />
    </svg>
  );
};

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  active?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  title, 
  subtitle,
  icon, 
  active = false 
}) => {
  return (
    <div 
      className={`
        bg-white rounded-2xl border transition-all duration-300
        ${active 
          ? 'border-primary-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-primary-100' 
          : 'border-slate-200 shadow-sm hover:shadow-md'
        }
        ${className}
      `}
    >
      {(title || icon) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
             {icon && <span className="text-primary-600">{icon}</span>}
             <div>
                {title && <h3 className="font-bold text-slate-800">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
             </div>
          </div>
        </div>
      )}
      <div className="p-0 h-full">
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
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
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
