"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, User, Users, LayoutDashboard, LogOut, LogIn,
  Search, Home, Store, Phone, Shield, UserCircle, Moon, Sun,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from 'react';

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CartSheet } from "@/components/cart/cart-sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "../ui/input";
import { useTheme } from "next-themes";

const WHATSAPP_CONTACT = "https://wa.me/9647772323607?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%20%D9%85%D8%B1%D9%83%D8%B2%D9%8A";

const navLinks = [
  { href: "/", label: "الرئيسية", icon: Home, roles: ["customer", "store"], external: false },
  { href: "/stores", label: "المتاجر", icon: Store, roles: ["customer", "store"], external: false },
  { href: WHATSAPP_CONTACT, label: "اتصل بنا", icon: Phone, roles: ["customer", "store", "representative"], external: true },
  { href: "/admin", label: "الإدارة", icon: Shield, roles: ["admin"], external: false },
];

function SearchBar() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<{ query: string }>();

  const onSubmit = (data: { query: string }) => {
    if (data.query.trim()) {
      router.push(`/search?query=${encodeURIComponent(data.query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative w-full max-w-md group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        {...register("query")}
        placeholder="ابحث..."
        className="w-full rounded-full border border-border bg-muted/30 px-10 py-2.5 text-sm placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
      />
    </form>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full flex-shrink-0"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">تبديل السمة</span>
    </Button>
  );
}

export function Header() {
  const { user, userRole, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin = userRole === 'admin';
  const isStore = userRole === 'store';
  const isRepresentative = userRole === 'representative';
  const isGuest = !user;
  const isStorePage = pathname === '/store' || pathname.startsWith('/store/');

  const visibleLinks = navLinks.filter(
    (link) => userRole && link.roles.includes(userRole)
  );

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="fixed top-0 inset-x-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/40">
      {/* ── الصف الأول: اللوغو + الأدوات ── */}
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
        {/* اللوغو */}
        {!isStorePage && (
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <Image
              src="/markazi-logo.webp"
              alt="مركزي"
              width={36}
              height={36}
              className="object-contain rounded-lg"
              priority
            />
            <span className="font-bold text-lg font-headline text-primary">مركزي</span>
          </Link>
        )}

        {/* روابط التنقل — تظهر فقط على الديسكتوب */}
        {!isGuest && (
          <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium flex-1 justify-center">
            {visibleLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl transition-all duration-150 text-foreground/60 hover:text-primary hover:bg-primary/5 flex items-center gap-1.5"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl transition-all duration-150 ${
                    pathname === link.href
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-foreground/60 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        )}

        {/* الأدوات */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />

          {!isGuest && userRole !== "admin" && (
            <div className="hidden lg:block">
              <SearchBar />
            </div>
          )}

          {!isGuest && userRole === "customer" && (
            <CartSheet>
              <Button variant="ghost" size="sm" className="rounded-xl px-3">
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </CartSheet>
          )}

          {isGuest ? (
            <Button asChild size="sm" className="rounded-xl gap-2 text-sm">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span>دخول</span>
              </Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-xl gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs max-w-[80px] truncate">
                    {user?.name || "حساب"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isStore && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/store">
                      <LayoutDashboard className="ml-2 h-4 w-4" />
                      لوحة المتجر
                    </Link>
                  </DropdownMenuItem>
                )}
                {isRepresentative && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/representative">
                      <Users className="ml-2 h-4 w-4" />
                      لوحة التسويق
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="ml-2 h-4 w-4" />
                      الإدارة
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="ml-2 h-4 w-4" />
                  خروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── الصف الثاني: روابط التنقل على الموبايل ── */}
      {!isGuest && visibleLinks.length > 0 && (
        <div className="md:hidden border-t border-border/30 bg-background/80">
          <div className="flex overflow-x-auto no-scrollbar px-2 py-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all text-xs text-foreground/50 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all text-xs ${
                    pathname === link.href
                      ? "text-primary font-semibold"
                      : "text-foreground/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
