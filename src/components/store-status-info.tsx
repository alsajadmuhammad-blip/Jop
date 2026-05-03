
"use client";

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import type { Store } from '@/lib/types';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';


interface StoreStatusInfoProps {
    businessHours?: Store['businessHours'];
    isCardVersion?: boolean;
    isDialogVersion?: boolean;
}

export function StoreStatusInfo({ businessHours, isCardVersion = false, isDialogVersion = false }: StoreStatusInfoProps) {
    const [isOpen, setIsOpen] = useState<boolean | null>(null);

    useEffect(() => {
        if (!businessHours) {
            setIsOpen(null);
            return;
        }

        const checkStatus = () => {
            const now = new Date();
            // Assuming local time of the user's browser is relevant
            const currentHour = now.getHours();
            
            const { open, close } = businessHours;

            if (open === undefined || close === undefined) {
                setIsOpen(null);
                return;
            }

            const status = open <= close 
                ? currentHour >= open && currentHour < close 
                : currentHour >= open || currentHour < close;
            setIsOpen(status);
        };

        checkStatus();
        const intervalId = setInterval(checkStatus, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, [businessHours]);
    
    if(isOpen === null) {
        return null; // Don't render anything if no hours or status not yet determined
    }

    const storeStatusText = isOpen ? "مفتوح الآن" : "مغلق الآن";

    if(isCardVersion){
        return (
            <Badge
                className={cn(
                    "absolute top-3 right-3 text-xs shadow-md border-none",
                    isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}
            >
                <Clock className="w-3 h-3 ml-1" />
                {isOpen ? "مفتوح" : "مغلق"}
            </Badge>
        )
    }

    if(isDialogVersion) {
         return (
            <div className="flex items-center justify-between gap-3 p-2.5 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                    <Clock className="w-[22px] h-[22px] text-primary shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-gray-600">حالة المتجر</span>
                </div>
                <div className={cn(
                    "text-base font-semibold text-left",
                    isOpen ? 'text-green-600' : 'text-destructive'
                )}>
                    {storeStatusText}
                </div>
            </div>
         )
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className={cn(
                "w-2.5 h-2.5 rounded-full",
                isOpen ? "bg-green-500" : "bg-red-500"
            )}></span>
            <span className={cn(
                "font-medium",
                 isOpen ? "text-green-700" : "text-red-700"
            )}>
                {storeStatusText}
            </span>
            <span className="text-muted-foreground" dir="ltr">
                • {businessHours?.open}:00 - {businessHours?.close}:00
            </span>
        </div>
    );
}


    