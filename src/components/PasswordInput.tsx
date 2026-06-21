import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  label?: string;
  className?: string;
  value?: any;
  onChange?: (e: any) => void;
  required?: boolean;
  placeholder?: string;
  [key: string]: any;
}

export default function PasswordInput({
  label,
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className={`w-full px-3 py-2 border border-slate-300 rounded-xs text-sm focus:outline-hidden focus:border-emerald-500 pr-10 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 cursor-pointer"
          title={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
