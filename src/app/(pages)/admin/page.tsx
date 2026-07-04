"use client";







import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Package2, Users, LogOut, DollarSign, SlidersHorizontal, BarChart3, Clock, RefreshCw, ShoppingBag, AlertTriangle } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import type { Store, StorePackage, User } from "@/lib/types";
import { mapStoreRow, fetchStorePackages } from '@/services/supabase-db';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/use-auth';

import { PartnersTab } from "./components/partners-tab";
import { StoresTab } from "./components/stores-tab";
import { SubscriptionsTab } from "./components/subscriptions-tab";
import { StatisticsTab } from "./components/statistics-tab";
import { HeroSliderManager } from "./components/hero-slider-manager";
import { OrdersTab } from "./components/orders-tab";

// ===== Main Dashboard Component =====
function AdminDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState('stores');
  const [isInitialViewLoaded, setIsInitialViewLoaded] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialViewLoaded) return;
    const view = searchParams?.get('view');
    if (view && ['stores', 'reps', 'subscriptions', 'ads', 'statistics', 'orders'].includes(view)) {
      setActiveView(view);
    }
    setIsInitialViewLoaded(true);
  }, [searchParams, isInitialViewLoaded]);

  const handleRepresentativeAdded = async () => {
    await fetchAll();
  };

  const handleLogout = () => {
    logout();
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    const basePath = '/admin';
    const url = view === 'stores' ? basePath : `${basePath}?view=${encodeURIComponent(view)}`;
    router.replace(url, { scroll: false });
  };

  const activeStoresCount  = stores.filter((store) => store.isActive).length;
  const inactiveStoresCount = stores.length - activeStoresCount;

  // متاجر ستنتهي اشتراكاتها خلال 7 أيام
  const expiringSoonCount = stores.filter(s => {
    if (!s.isActive || !s.activationDate) return false;
    const activationDays = Math.floor((Date.now() - new Date(s.activationDate).getTime()) / (1000 * 60 * 60 * 24));
    const remaining = (s.subscriptionDuration || 30) - activationDays;
    return remaining >= 0 && remaining <= 7;
  }).length;

  const adminViewTabs = [
    { key: 'stores',        label: 'المتاجر',    icon: Package2          },
    { key: 'reps',          label: 'الشركاء',    icon: Users             },
    { key: 'subscriptions', label: 'الباقات',    icon: DollarSign        },
    { key: 'orders',        label: 'الطلبات',    icon: ShoppingBag       },
    { key: 'ads',           label: 'الإعلانات',  icon: SlidersHorizontal },
    { key: 'statistics',    label: 'الإحصائيات', icon: BarChart3         },
  ];

  const fetchAll = async () => {
    try {
      const [{ data: storesData, error: storesError }, { data: usersData, error: usersError }, packagesData, ordersResult] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('users').select('*'),
        fetchStorePackages(),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ] as const);

      if (storesError) throw storesError;
      if (usersError) throw usersError;

      setStores((storesData || []).map((r: any) => mapStoreRow(r)));
      setRepresentatives((usersData || []).filter((u: any) => u.role === 'representative').map((u: any) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        storeId: u.store_id ?? u.storeId ?? null,
        role: u.role,
        paymentSystem: u.payment_system ?? u.paymentSystem,
        monthlySalary: u.monthly_salary ?? u.monthlySalary,
        requiredStoresCount: u.required_stores_count ?? u.requiredStoresCount,
        commissionPercent: u.commission_percent ?? u.commissionPercent ?? 0,
        packageDiscountPercent: u.package_discount_percent ?? u.packageDiscountPercent ?? 0,
        partnerCode: u.partner_code ?? u.partnerCode,
        totalEarnings: u.total_earnings ?? u.totalEarnings ?? 0,
        monthlyActivations: u.monthly_activations ?? u.monthlyActivations ?? 0,
      } as User)));
      setPackages(packagesData || []);
      setOrdersCount(ordersResult.count ?? 0);
      setLoading(false);
    } catch (error: any) {
      console.error('Supabase Error:', error);
      toast({ title: "خطأ في جلب بيانات لوحة التحكم", description: error.message || String(error), variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [toast]);
  

  const handleStatusToggle = async (storeId: string, newIsActive: boolean, storeData: Store) => {
    try {
      if (!newIsActive) {
        const { error } = await supabase.from('stores').update({ 
          is_active: false,
          isActive: false 
        }).eq('id', storeId);
        if (error) throw error;
        setStores((current) =>
          current.map((store) =>
            store.id === storeId ? { ...store, isActive: false } : store
          )
        );
        toast({ title: "✅ تم إيقاف المتجر" });
        return;
      }

      // Basic activation: mark active and set activation date
      const activationDate = new Date().toISOString();
      const updatePayload: any = { 
        is_active: true, 
        isActive: true,
        activation_date: activationDate,
        activationDate: activationDate
      };
      const { error } = await supabase.from('stores').update(updatePayload).eq('id', storeId);
      if (error) throw error;

      // Link the store to the owner user
      if (storeData.ownerEmail) {
        const { error: userError } = await supabase
          .from('users')
          .update({ store_id: storeId, storeId: storeId, role: 'store' })
          .eq('email', storeData.ownerEmail);
        if (userError) {
          console.error('Failed to link store to user:', userError);
          // Don't throw, as store is activated
        }
      }

      // ── زيادة عداد الشريك عند موافقة المشرف ──────────────────────
      if (storeData.registeredByAgentId) {
        try {
          const { data: partnerRow } = await supabase
            .from('users')
            .select('monthly_activations, total_earnings, commission_percent, payment_system')
            .eq('id', storeData.registeredByAgentId)
            .maybeSingle();

          if (partnerRow) {
            const newMonthlyActivations = (partnerRow.monthly_activations ?? 0) + 1;

            // احتساب العمولة إن كان نظام العمولة
            let earningsIncrement = 0;
            if (
              partnerRow.payment_system === 'commission' &&
              (partnerRow.commission_percent ?? 0) > 0 &&
              storeData.packageId
            ) {
              const { data: pkgRow } = await supabase
                .from('store_packages')
                .select('price')
                .eq('id', storeData.packageId)
                .maybeSingle();
              if (pkgRow?.price) {
                earningsIncrement = (pkgRow.price * partnerRow.commission_percent) / 100;
              }
            }

            await supabase
              .from('users')
              .update({
                monthly_activations: newMonthlyActivations,
                total_earnings: (partnerRow.total_earnings ?? 0) + earningsIncrement,
              })
              .eq('id', storeData.registeredByAgentId);
          }
        } catch (partnerErr) {
          console.error('Failed to update partner stats:', partnerErr);
          // لا نوقف التفعيل بسبب خطأ في تحديث الشريك
        }
      }

      setStores((current) =>
        current.map((store) =>
          store.id === storeId
            ? { ...store, isActive: true, activationDate }
            : store
        )
      );
      toast({ title: "✅ تم تفعيل المتجر بنجاح" });
    } catch (error: any) {
      console.error('Supabase error toggling store status:', error);
      toast({ title: "❌ فشل تحديث حالة المتجر", description: error.message || String(error), variant: "destructive" });
    }
  };


  const handleStoreDataUpdate = async (storeId: string, data: Partial<Store>) => {
    try {
      const updateData: any = {};
      
      // Convert camelCase to snake_case for database AND set both variants
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.logoUrl !== undefined) {
        updateData.logo_url = data.logoUrl;
        updateData.logoUrl = data.logoUrl;
      }
      if (data.coverImageUrl !== undefined) {
        updateData.cover_image_url = data.coverImageUrl;
        updateData.coverImageUrl = data.coverImageUrl;
      }
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.reviews !== undefined) updateData.reviews = data.reviews;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.marketType !== undefined) {
        updateData.market_type = data.marketType;
        updateData.marketType = data.marketType;
      }
      if (data.businessHours !== undefined) {
        updateData.business_hours = data.businessHours;
        updateData.businessHours = data.businessHours;
      }
      if (data.whatsappNumber !== undefined) {
        updateData.whatsapp_number = data.whatsappNumber;
        updateData.whatsappNumber = data.whatsappNumber;
      }
      if (data.hasDelivery !== undefined) {
        updateData.has_delivery = data.hasDelivery;
        updateData.hasDelivery = data.hasDelivery;
      }
      if (data.isActive !== undefined) {
        updateData.is_active = data.isActive;
        updateData.isActive = data.isActive;
      }
      if (data.productLimit !== undefined) {
        updateData.product_limit = data.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : data.productLimit;
        updateData.productLimit = data.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : data.productLimit;
      }
      if (data.subscriptionDuration !== undefined) {
        updateData.subscription_duration = data.subscriptionDuration;
        updateData.subscriptionDuration = data.subscriptionDuration;
      }
      if (data.activationDate !== undefined) {
        updateData.activation_date = data.activationDate;
        updateData.activationDate = data.activationDate;
      }
      if (data.ownerId !== undefined) {
        updateData.owner_id = data.ownerId;
        updateData.ownerId = data.ownerId;
      }
      if (data.ownerEmail !== undefined) {
        updateData.owner_email = data.ownerEmail;
        updateData.ownerEmail = data.ownerEmail;
      }
      if (data.registeredByAgentId !== undefined) {
        updateData.registered_by_agent_id = data.registeredByAgentId;
        updateData.registeredByAgentId = data.registeredByAgentId;
      }
      if (data.packageName !== undefined) {
        updateData.package_name = data.packageName;
        updateData.packageName = data.packageName;
      }

      const { error } = await supabase.from('stores').update(updateData).eq('id', storeId);
      if (error) throw error;
      setStores((current) =>
        current.map((store) =>
          store.id === storeId ? { ...store, ...data } : store
        )
      );
      toast({ title: "✅ تم تحديث بيانات المتجر بنجاح" });
    } catch (error: any) {
      console.error('Supabase error updating store:', error);
      toast({ title: "❌ فشل تحديث بيانات المتجر", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleStorePackageAssignment = async (storeId: string, packageSlug: string) => {
    const pkg = packages.find((item) => item.slug === packageSlug);
    if (!pkg) {
      toast({ title: '❌ الباقة غير موجودة', variant: 'destructive' });
      return;
    }

    try {
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + pkg.subscriptionDuration * 24 * 60 * 60 * 1000).toISOString();

      const { data: existingAssignments, error: fetchError } = await supabase
        .from('store_package_assignments')
        .select('id')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      if (existingAssignments && existingAssignments.length > 0) {
        const assignmentIds = existingAssignments.map((item: { id: string }) => item.id);
        const { error: deactivateError } = await supabase
          .from('store_package_assignments')
          .update({ is_active: false, updated_at: now })
          .in('id', assignmentIds);

        if (deactivateError) throw deactivateError;
      }

      const { error: insertError } = await supabase.from('store_package_assignments').insert({
        store_id: storeId,
        storeId,
        package_id: pkg.id,
        packageId: pkg.id,
        assigned_at: now,
        assignedAt: now,
        expires_at: expiresAt,
        expiresAt,
        is_active: true,
        isActive: true,
        custom_product_limit: pkg.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : pkg.productLimit,
        customProductLimit: pkg.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : pkg.productLimit,
        custom_subscription_duration: pkg.subscriptionDuration,
        customSubscriptionDuration: pkg.subscriptionDuration,
        custom_price: pkg.price,
        customPrice: pkg.price,
        notes: 'تم تعيين الباقة من صفحة المشرف',
        created_at: now,
        createdAt: now,
        updated_at: now,
        updatedAt: now,
      });

      if (insertError) throw insertError;

      const { error: storeError } = await supabase.from('stores').update({
        package_id: pkg.id,
        packageId: pkg.id,
        package_name: pkg.slug,
        packageName: pkg.slug,
        product_limit: pkg.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : pkg.productLimit,
        productLimit: pkg.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : pkg.productLimit,
        subscription_duration: pkg.subscriptionDuration,
        subscriptionDuration: pkg.subscriptionDuration,
        activation_date: now,
        activationDate: now,
        updated_at: now,
        updatedAt: now,
      }).eq('id', storeId);

      if (storeError) throw storeError;

      setStores((current) =>
        current.map((store) =>
          store.id === storeId
            ? {
                ...store,
                packageId: pkg.id,
                packageName: pkg.slug,
                productLimit: pkg.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : pkg.productLimit,
                subscriptionDuration: pkg.subscriptionDuration,
                activationDate: now,
              }
            : store
        )
      );
      toast({ title: '✅ تم تعيين الباقة بنجاح' });
    } catch (error: any) {
      console.error('Supabase error assigning package:', error);
      toast({ title: '❌ فشل تعيين الباقة للمتجر', description: error.message || String(error), variant: 'destructive' });
      throw error;
    }
  };


  const handleDeleteStore = async (storeId: string) => {
    try {
      const { error } = await supabase.from('stores').delete().eq('id', storeId);
      if (error) throw error;
      setStores((current) => current.filter((store) => store.id !== storeId));
      toast({ title: "✅ تم حذف المتجر بنجاح", variant: "default" });
    } catch (error: any) {
      console.error('Supabase error deleting store:', error);
      toast({ title: "❌ فشل حذف المتجر", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleDeleteRepresentative = async (repId: string) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', repId);
      if (error) throw error;
      setRepresentatives((current) => current.filter((rep) => rep.id !== repId));
      toast({ title: "✅ تم حذف الشريك بنجاح", variant: "default" });
    } catch (error: any) {
      console.error('Supabase error deleting partner:', error);
      toast({ title: "❌ فشل حذف الشريك", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleUpdateRepresentative = async (repId: string, updates: Partial<User>) => {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.paymentSystem !== undefined) {
        payload.payment_system = updates.paymentSystem;
        payload.paymentSystem = updates.paymentSystem;
      }
      if (updates.monthlySalary !== undefined) {
        payload.monthly_salary = updates.monthlySalary;
        payload.monthlySalary = updates.monthlySalary;
      }
      if (updates.requiredStoresCount !== undefined) {
        payload.required_stores_count = updates.requiredStoresCount;
        payload.requiredStoresCount = updates.requiredStoresCount;
      }
      if (updates.commissionPercent !== undefined) {
        payload.commission_percent = updates.commissionPercent;
      }
      if (updates.packageDiscountPercent !== undefined) {
        payload.package_discount_percent = updates.packageDiscountPercent;
      }
      if (updates.monthlyActivations !== undefined) {
        payload.monthly_activations = updates.monthlyActivations;
        payload.monthlyActivations = updates.monthlyActivations;
      }
      if (updates.lastResetDate !== undefined) {
        payload.last_reset_date = updates.lastResetDate;
        payload.lastResetDate = updates.lastResetDate;
      }

      const { error } = await supabase.from('users').update(payload).eq('id', repId);
      if (error) throw error;

      setRepresentatives((current) =>
        current.map((rep) => (rep.id === repId ? { ...rep, ...updates } : rep))
      );
      toast({ title: "✅ تم تحديث بيانات الشريك بنجاح" });
    } catch (error: any) {
      console.error('Supabase error updating partner:', error);
      toast({ title: "❌ فشل تحديث بيانات الشريك", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleStoreAdded = () => {
    // Refresh stores list
    fetchAll();
  };

  const pendingCount = stores.filter(s => !s.isActive && !s.activationDate).length;

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center gap-3 text-muted-foreground">
      <RefreshCw className="h-5 w-5 animate-spin" />
      <span>جاري تحميل البيانات...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 overflow-x-hidden" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* ── الهيدر ── */}
        <header className="mb-5 rounded-2xl bg-white shadow-sm border border-border/60 p-4 md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">لوحة تحكم المشرف</h1>
                <p className="text-xs text-muted-foreground mt-0.5">إدارة المتاجر والشركاء والباقات</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => fetchAll()} className="gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
                <LogOut className="h-3.5 w-3.5" /> خروج
              </Button>
            </div>
          </div>

          {/* ── بطاقات الإحصاء السريع ── */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'إجمالي المتاجر',   value: stores.length,          color: 'text-primary',      bg: 'bg-primary/8',   key: 'stores'     },
              { label: 'المتاجر النشطة',   value: activeStoresCount,      color: 'text-emerald-600',  bg: 'bg-emerald-50',  key: 'stores'     },
              { label: 'قيد المراجعة',     value: pendingCount,           color: 'text-amber-600',    bg: 'bg-amber-50',    key: 'stores'     },
              { label: 'الشركاء',           value: representatives.length, color: 'text-blue-600',     bg: 'bg-blue-50',     key: 'reps'       },
              { label: 'إجمالي الطلبات',   value: ordersCount,            color: 'text-violet-600',   bg: 'bg-violet-50',   key: 'orders'     },
            ].map(({ label, value, color, bg, key }) => (
              <button
                key={label}
                onClick={() => handleViewChange(key)}
                className={`rounded-xl border border-border/40 ${bg} p-3 text-center hover:opacity-80 transition cursor-pointer`}
              >
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </button>
            ))}
          </div>

          {/* ── تنبيهات ── */}
          <div className="mt-3 flex flex-col gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => handleViewChange('stores')}
                className="w-full flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 transition text-right"
              >
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{pendingCount}</strong> {pendingCount === 1 ? 'متجر ينتظر' : 'متجر ينتظرون'} موافقتك — انقر للمراجعة
                </span>
              </button>
            )}
            {expiringSoonCount > 0 && (
              <button
                onClick={() => handleViewChange('stores')}
                className="w-full flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 hover:bg-red-100 transition text-right"
              >
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span>
                  <strong>{expiringSoonCount}</strong> {expiringSoonCount === 1 ? 'متجر سينتهي' : 'متاجر ستنتهي'} اشتراكهم خلال 7 أيام
                </span>
              </button>
            )}
          </div>
        </header>

        {/* ── شريط التنقل ── */}
        <div className="mb-5 overflow-x-auto">
          <div className="inline-flex min-w-max gap-1.5 rounded-2xl border border-border/60 bg-white/90 p-1.5 shadow-sm">
            {adminViewTabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeView === tab.key ? 'default' : 'ghost'}
                size="sm"
                className="whitespace-nowrap rounded-xl text-xs h-8 px-3"
                onClick={() => handleViewChange(tab.key)}
              >
                <tab.icon className="ml-1.5 h-3.5 w-3.5" />
                {tab.label}
                {tab.key === 'stores' && pendingCount > 0 && (
                  <span className="mr-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold w-4 h-4">
                    {pendingCount}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeView === 'statistics' && (
            <StatisticsTab stores={stores} representatives={representatives} packages={packages} />
          )}
          {activeView === 'stores' && (
            <StoresTab 
              stores={stores}
              representatives={representatives}
              onStatusToggle={handleStatusToggle} 
              onDataUpdate={handleStoreDataUpdate}
              onDeleteStore={handleDeleteStore}
            />
          )}
          {activeView === 'reps' && (
            <PartnersTab
              representatives={representatives}
              stores={stores}
              onRepresentativeAdded={handleRepresentativeAdded}
              onRepresentativeDeleted={handleDeleteRepresentative}
              onRepresentativeUpdated={handleUpdateRepresentative}
              onRefresh={fetchAll}
            />
          )}
          {activeView === 'subscriptions' && (
            <SubscriptionsTab
              stores={stores}
              packages={packages}
              onAssignPackage={handleStorePackageAssignment}
              onPackagesChanged={fetchAll}
            />
          )}
          {activeView === 'ads' && <HeroSliderManager stores={stores} />}
          {activeView === 'orders' && <OrdersTab stores={stores} />}
        </div>
      </div>

    </div>
  );
  }

// ===== Auth Wrapper =====
export default function AdminPage() {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user || userRole !== 'admin') {
            router.replace('/login');
        }
    }, [user, userRole, loading, router]);
    
    if (loading || !user || userRole !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>جاري التحقق من الصلاحيات...</p>
            </div>
        );
    }
    
    return <AdminDashboard />;
}
