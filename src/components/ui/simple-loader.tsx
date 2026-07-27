import React from "react";

interface SimpleLoaderProps {
    label?: string;
    minHeight?: string;
}

export function SimpleLoader({ label = "Loading...", minHeight = "min-h-[60vh]" }: SimpleLoaderProps) {
    return (
        <div className={`w-full ${minHeight} flex flex-col items-center justify-center py-16 px-4`}>
            <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-3 border-gray-200 dark:border-zinc-800 border-t-black dark:border-t-white animate-spin" />
                </div>
                {label && (
                    <span className="text-xs text-text-secondary font-medium tracking-wide">
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}
