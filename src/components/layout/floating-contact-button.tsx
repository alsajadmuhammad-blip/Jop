"use client";

import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const WHATSAPP_CONTACT = "https://wa.me/9647772323607?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%20%D9%85%D8%B1%D9%83%D8%B2%D9%8A";

const ALLOWED_ROLES = ["customer", "store", "representative"];

/* زر عائم للتواصل عبر واتساب — يحل محل شريط "اتصل بنا" السابق */
export function FloatingContactButton() {
  const { user, userRole } = useAuth();

  if (!user || !userRole || !ALLOWED_ROLES.includes(userRole)) return null;

  return (
    <a
      href={WHATSAPP_CONTACT}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-transform duration-200 hover:scale-105 active:scale-95 md:bottom-6 md:left-6"
    >
      <MessageCircle className="h-5 w-5 flex-shrink-0" strokeWidth={2.2} />
      <span>اتصل بنا</span>
    </a>
  );
}
