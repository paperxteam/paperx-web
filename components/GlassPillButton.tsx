import React from 'react';
import { Button } from './Button';

export const GlassPillButton = ({ 
  children, 
  onClick, 
  className = "", 
  size = "default",
  type = "button",
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  size?: "default" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) => {
  return (
    <Button
      variant="premium"
      size={size === 'lg' ? 'lg' : 'md'}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${className}`}
    >
      {children}
    </Button>
  );
};
