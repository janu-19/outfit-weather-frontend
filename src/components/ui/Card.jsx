import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className, ...props }) {
    return (
        <div
            className={twMerge("bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/20", className)}
            {...props}
        >
            {children}
        </div>
    );
}
