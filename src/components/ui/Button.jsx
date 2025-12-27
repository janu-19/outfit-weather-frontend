import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function Button({ children, className, isLoading, variant = 'primary', ...props }) {
    const baseStyles = "flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30",
        outline: "border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600",
        ghost: "hover:bg-slate-100 text-slate-600"
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant], className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {children}
        </button>
    );
}
