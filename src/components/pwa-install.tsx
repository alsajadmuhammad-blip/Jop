'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // لا تُظهر البانر إذا التطبيق مثبّت مسبقاً (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as any).standalone === true) return;

    // إذا أغلق المستخدم البانر من قبل، لا تُظهره مجدداً لمدة يوم
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setVisible(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', String(Date.now()));
    setVisible(false);
  };

  if (installed) {
    return (
      <div
        className="fixed bottom-24 right-4 left-4 md:left-auto md:right-6 md:w-80 z-50
                   bg-green-600 text-white rounded-2xl shadow-2xl p-4
                   flex items-center gap-3 animate-in slide-in-from-bottom-4"
      >
        <Smartphone className="h-6 w-6 flex-shrink-0" />
        <p className="text-sm font-medium">تم تثبيت مركزي بنجاح! يمكنك فتحه من الشاشة الرئيسية.</p>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 right-3 left-3 md:left-auto md:right-6 md:w-96 z-50
                 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                 rounded-2xl shadow-2xl overflow-hidden
                 animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* شريط علوي */}
      <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-medium">تطبيق مركزي</span>
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* المحتوى */}
      <div className="p-4 flex items-center gap-4">
        <img
          src="https://i.ibb.co/JRWx4h0N/20260426-060854.png"
          alt="أيقونة مركزي"
          className="w-14 h-14 rounded-2xl flex-shrink-0 shadow"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 dark:text-white text-sm">ثبّت تطبيق مركزي</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
            وصول أسرع، يعمل بدون إنترنت، وتجربة أفضل
          </p>
        </div>
      </div>

      {/* زر التثبيت */}
      <div className="px-4 pb-4">
        <button
          onClick={handleInstall}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                     text-white font-semibold text-sm py-3 rounded-xl
                     flex items-center justify-center gap-2
                     transition-colors duration-150"
        >
          <Download className="h-4 w-4" />
          تثبيت التطبيق الآن
        </button>
      </div>
    </div>
  );
}
