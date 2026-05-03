"use client";

import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show toast notification for install
      toast({
        title: "تثبيت التطبيق",
        description: "يمكنك الآن تثبيت تطبيق مركزي على جهازك للحصول على تجربة أفضل.",
        action: (
          <Button
            onClick={() => {
              setShowInstall(true);
            }}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            تثبيت الآن
          </Button>
        ),
        duration: 10000,
      });
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
      toast({
        title: "تم التثبيت بنجاح!",
        description: "تطبيق مركزي مثبت على جهازك الآن.",
      });
    } else {
      setShowInstall(false);
    }
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">تثبيت التطبيق</h3>
            <p className="text-xs text-muted-foreground">احصل على تجربة أفضل مع تطبيق مركزي</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleInstall} size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            تثبيت
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowInstall(false)}>
            لاحقاً
          </Button>
        </div>
      </div>
    </div>
  );
}
