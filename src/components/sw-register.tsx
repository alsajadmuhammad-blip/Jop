'use client';

import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = () =>
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {/* silent */});

    // إذا الصفحة حُمّلت بالفعل سجّل فوراً، وإلا انتظر حدث load
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
