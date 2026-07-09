
"use client";

import Image from "next/image";

interface LoadingSpinnerProps {
  isLoading: boolean;
}

export function LoadingSpinner({ isLoading }: LoadingSpinnerProps) {
  if (!isLoading) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
    >
      <div>
         <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
