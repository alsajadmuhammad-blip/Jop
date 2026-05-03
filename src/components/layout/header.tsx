
"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Users, LayoutDashboard, LogOut, LogIn, Search, Home, Store, Phone, Shield, UserCircle, Bell, PanelLeft, Menu, X, Moon, Sun } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useEffect } from 'react';

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
import { Separator } from "../ui/separator";
import { useTheme } from "next-themes";

const navLinks = [
  { href: "/", label: "الرئيسية", icon: Home, roles: ["customer", "store", "representative"] },
  { href: "/stores", label: "المتاجر", icon: Store, roles: ["customer", "store", "representative"] },
  { href: "/contact", label: "اتصل بنا", icon: Phone, roles: ["customer", "store", "representative"] },
  { href: "/admin", label: "الإدارة", icon: Shield, roles: ["admin"] },
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
            <Input
                {...register("query")}
                placeholder="ابحث..."
                className="w-full rounded-full border border-border bg-muted/30 px-10 py-2.5 text-sm placeholder:text-muted-foreground transition-all duration-200 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none hover:border-primary/40"
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
      className="rounded-full"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  const isAdmin = userRole === 'admin';
  const isStore = userRole === 'store';
  const isRepresentative = userRole === 'representative';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md transition-all duration-200">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo - Simplified */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group hover:opacity-80 transition-opacity">
          <Image
            src="/icons/icon-192x192.png"
            alt="مركزي"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="hidden sm:inline font-bold text-lg font-headline text-primary">مركزي</span>
        </Link>

        {/* Desktop Navigation - Optimized */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks
            .filter((link) => !userRole || link.roles.includes(userRole))
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg transition-all duration-150 ${
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/70 hover:text-primary hover:bg-primary/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

        {/* Right Side - Streamlined */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Search - Desktop only */}
          {userRole !== 'admin' && (
            <div className="hidden lg:block">
              <SearchBar />
            </div>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Cart */}
          <CartSheet>
            <Button variant="ghost" size="sm" className="rounded-lg gap-2 px-3">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </CartSheet>

          {/* User Menu */}
          {userRole ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-lg gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{user?.name || 'حساب'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">{user?.email}</DropdownMenuLabel>
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
          ) : (
            <Button asChild size="sm" className="rounded-lg gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">دخول</span>
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden rounded-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle className="text-right">القائمة</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 p-4">
                {/* Mobile Search */}
                {userRole !== 'admin' && <SearchBar />}

                {/* Mobile Navigation */}
                <nav className="space-y-1">
                  {navLinks
                  .filter((link) => !userRole || link.roles.includes(userRole))
                  .map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          pathname === link.href
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground/70 hover:bg-primary/5'
                        }`}
                      >
                        <link.icon className="h-4 w-4" />
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                {userRole ? (
                  <div className="border-t pt-3 space-y-2">
                    <div className="px-3 py-2">
                      <p className="text-xs font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    {isStore && (
                      <SheetClose asChild>
                        <Link href="/dashboard/store" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-primary/5">
                          <LayoutDashboard className="h-4 w-4" />
                          لوحة المتجر
                        </Link>
                      </SheetClose>
                    )}
                    {isRepresentative && (
                      <SheetClose asChild>
                        <Link href="/dashboard/representative" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-primary/5">
                          <Users className="h-4 w-4" />
                          لوحة التسويق
                        </Link>
                      </SheetClose>
                    )}
                    {isAdmin && (
                      <SheetClose asChild>
                        <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-primary/5">
                          <Shield className="h-4 w-4" />
                          الإدارة
                        </Link>
                      </SheetClose>
                    )}
                    <Button 
                      onClick={handleLogout} 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-destructive text-xs"
                    >
                      <LogOut className="ml-2 h-4 w-4" />
                      خروج
                    </Button>
                  </div>
                ) : (
                  <Button asChild size="sm" className="w-full">
                    <Link href="/login">
                      <LogIn className="ml-2 h-4 w-4" />
                      دخول
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
