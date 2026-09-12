import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative isolate overflow-hidden inline-flex items-center justify-center font-semibold tracking-tight whitespace-nowrap transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-900 shadow-xl shadow-black/20 hover:shadow-black/40 focus:ring-black border border-gray-800",
    secondary: "bg-white/60 backdrop-blur-xl text-black border border-gray-200 hover:border-gray-300 hover:bg-white shadow-sm focus:ring-gray-200",
    ghost: "bg-transparent text-gray-600 hover:text-black hover:bg-black/5 focus:ring-gray-200",
    outline: "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white focus:ring-black",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-transparent focus:ring-red-200",
    premium: "group bg-black text-white rounded-full shadow-md hover:shadow-lg border border-white/10 hover:border-white/25 transition-all duration-300 hover:bg-stone-900 active:scale-[0.99]"
  };

  const sizes = {
    sm: variant === 'premium' ? "text-xs px-4 py-1.5 rounded-full" : "text-xs px-4 py-2 rounded-xl",
    md: variant === 'premium' ? "text-sm px-6 py-2.5 rounded-full tracking-tight" : "text-sm px-6 py-3 rounded-2xl",
    lg: variant === 'premium' ? "text-base px-8 py-3.5 rounded-full tracking-tight" : "text-base px-8 py-4 rounded-[1.25rem]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Premium Liquid Effect */}
      {variant === 'premium' && !isLoading && !props.disabled && (
        <span className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
          {/* Main Glassy Gradient */}
          <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
          
          {/* Top Edge Highlight */}
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[35%] bg-gradient-to-b from-white/20 to-transparent rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
          
          {/* Subtle Inner Highlight */}
          <span className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] rounded-full transition-all duration-300" />
        </span>
      )}

      {/* Shimmer Effect for Primary Buttons */}
      {variant === 'primary' && !isLoading && !props.disabled && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
           <span 
              className="absolute w-[100%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-pulse" 
           />
        </span>
      )}

      {isLoading ? (
        <span className="flex items-center gap-2 relative z-10">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Processing...</span>
        </span>
      ) : (
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      )}
    </button>
  );
};
