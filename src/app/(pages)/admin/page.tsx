"use client";







import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Package2, Users, LogOut, DollarSign, SlidersHorizontal } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import type { Store, StorePackage, User } from "@/lib/types";
import { mapStoreRow, fetchStorePackages } from '@/services/supabase-db';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/use-auth';

import { RepresentativesTab } from "./components/representatives-tab";
import { StoresTab } from "./components/stores-tab";
import { SubscriptionsTab } from "./components/subscriptions-tab";
import { StatisticsTab } from "./components/statistics-tab";
import { HeroSliderManager } from "./components/hero-slider-manager";

// ===== Main Dashboard Component =====
function AdminDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState('stores');
  const [isInitialViewLoaded, setIsInitialViewLoaded] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialViewLoaded) return;
    const view = searchParams?.get('view');
    if (view && ['stores', 'reps', 'subscriptions', 'ads', 'statistics'].includes(view)) {
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

  const activeStoresCount = stores.filter((store) => store.isActive).length;
  const inactiveStoresCount = stores.length - activeStoresCount;
  const adminViewTabs = [
    { key: 'stores', label: 'إدارة المتاجر', icon: Package2 },
    { key: 'reps', label: 'إدارة المندوبين', icon: Users },
    { key: 'subscriptions', label: 'الباقات', icon: DollarSign },
    { key: 'ads', label: 'الإعلانات', icon: SlidersHorizontal },
    { key: 'statistics', label: 'الإحصائيات', icon: SlidersHorizontal },
  ];

  const fetchAll = async () => {
    try {
      const [{ data: storesData, error: storesError }, { data: usersData, error: usersError }, packagesData] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('users').select('*'),
        fetchStorePackages(),
      ] as const);

      if (storesError) throw storesError;
      if (usersError) throw usersError;

      setStores((storesData || []).map((r: any) => mapStoreRow(r)));
      setRepresentatives((usersData || []).filter((u: any) => u.role === 'representative').map((u: any) => ({ id: String(u.id), ...u } as User)));
      setPackages(packagesData || []);
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
        const { error } = await supabase.from('stores').update({ is_active: false }).eq('id', storeId);
        if (error) throw error;
        setStores((current) =>
          current.map((store) =>
            store.id === storeId ? { ...store, isActive: false } : store
          )
        );
        toast({ title: "تم إيقاف المتجر" });
        return;
      }

      // Basic activation: mark active and set activation date. Complex business logic (commission calculation) should be implemented server-side (Edge Function / RPC).
      const activationDate = new Date().toISOString();
      const updatePayload: any = { is_active: true, activation_date: activationDate };
      const { error } = await supabase.from('stores').update(updatePayload).eq('id', storeId);
      if (error) throw error;

      // Link the store to the owner user
      if (storeData.ownerEmail) {
        const { error: userError } = await supabase
          .from('users')
          .update({ store_id: storeId, role: 'store' })
          .eq('email', storeData.ownerEmail);
        if (userError) {
          console.error('Failed to link store to user:', userError);
          // Don't throw, as store is activated
        }
      }

      setStores((current) =>
        current.map((store) =>
          store.id === storeId
            ? { ...store, isActive: true, activationDate }
            : store
        )
      );
      toast({ title: "تم تفعيل المتجر" });
    } catch (error: any) {
      console.error('Supabase error toggling store status:', error);
      toast({ title: "فشل تحديث حالة المتجر", description: error.message || String(error), variant: "destructive" });
    }
  };


  const handleStoreDataUpdate = async (storeId: string, data: Partial<Store>) => {
    try {
      const updateData: any = {};
      
      // Convert camelCase to snake_case for database
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
      if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl;
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.reviews !== undefined) updateData.reviews = data.reviews;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.marketType !== undefined) updateData.market_type = data.marketType;
      if (data.businessHours !== undefined) updateData.business_hours = data.businessHours;
      if (data.whatsappNumber !== undefined) updateData.whatsapp_number = data.whatsappNumber;
      if (data.hasDelivery !== undefined) updateData.has_delivery = data.hasDelivery;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.productLimit !== undefined) updateData.product_limit = data.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : data.productLimit;
      if (data.subscriptionDuration !== undefined) updateData.subscription_duration = data.subscriptionDuration;
      if (data.activationDate !== undefined) updateData.activation_date = data.activationDate;
      if (data.ownerId !== undefined) updateData.owner_id = data.ownerId;
      if (data.ownerEmail !== undefined) updateData.owner_email = data.ownerEmail;
      if (data.registeredByAgentId !== undefined) updateData.registered_by_agent_id = data.registeredByAgentId;
      if (data.packageName !== undefined) updateData.package_name = data.packageName;

      const { error } = await supabase.from('stores').update(updateData).eq('id', storeId);
      if (error) throw error;
      setStores((current) =>
        current.map((store) =>
          store.id === storeId ? { ...store, ...data } : store
        )
      );
      toast({ title: "تم تحديث بيانات المتجر" });
    } catch (error: any) {
      console.error('Supabase error updating store:', error);
      toast({ title: "فشل تحديث بيانات المتجر", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleStorePackageAssignment = async (storeId: string, packageSlug: string) => {
    const pkg = packages.find((item) => item.slug === packageSlug);
    if (!pkg) {
      toast({ title: 'الباقة غير موجودة', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('stores').update({
        package_name: pkg.slug,
        product_limit: pkg.productLimit >= Number.MAX_SAFE_INTEGER ? 999999 : pkg.productLimit,
        subscription_duration: pkg.subscriptionDuration,
      }).eq('id', storeId);

      if (error) throw error;

      setStores((current) =>
        current.map((store) =>
          store.id === storeId
            ? { ...store, packageName: pkg.slug, productLimit: pkg.productLimit, subscriptionDuration: pkg.subscriptionDuration }
            : store
        )
      );
    } catch (error: any) {
      console.error('Supabase error assigning package:', error);
      toast({ title: 'فشل تعيين الباقة للمتجر', description: error.message || String(error), variant: 'destructive' });
      throw error;
    }
  };


  const handleDeleteStore = async (storeId: string) => {
    try {
      const { error } = await supabase.from('stores').delete().eq('id', storeId);
      if (error) throw error;
      setStores((current) => current.filter((store) => store.id !== storeId));
      toast({ title: "تم حذف المتجر", variant: "destructive" });
    } catch (error: any) {
      console.error('Supabase error deleting store:', error);
      toast({ title: "فشل حذف المتجر", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleStoreAdded = () => {
    // Refresh stores list
    fetchAll();
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center">جاري تحميل البيانات...</div>;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl bg-white shadow-sm border border-border/80 p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold font-headline">لوحة تحكم المشرف</h1>
              <p className="mt-1 text-sm text-muted-foreground">واجهة إدارة مركزية مع ملخص شامل على الهاتف.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="ml-2 h-4 w-4" />
                خروج
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="min-w-0 rounded-3xl border p-4 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">المتاجر الإجمالية</CardTitle>
                <CardDescription className="mt-2 text-3xl font-semibold">{stores.length}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-3xl border p-4 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">المتاجر النشطة</CardTitle>
                <CardDescription className="mt-2 text-3xl font-semibold">{activeStoresCount}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-3xl border p-4 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">المتاجر المعلقة</CardTitle>
                <CardDescription className="mt-2 text-3xl font-semibold">{inactiveStoresCount}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-3xl border p-4 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">المندوبين</CardTitle>
                <CardDescription className="mt-2 text-3xl font-semibold">{representatives.length}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </header>

        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex min-w-max gap-2 rounded-full border border-border/80 bg-white/80 p-2 shadow-sm">
            {adminViewTabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeView === tab.key ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => handleViewChange(tab.key)}
              >
                <tab.icon className="ml-2 h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeView === 'statistics' && (
            <StatisticsTab stores={stores} representatives={representatives} />
          )}
          {activeView === 'stores' && (
            <StoresTab 
              stores={stores} 
              onStatusToggle={handleStatusToggle} 
              onDataUpdate={handleStoreDataUpdate}
              onDeleteStore={handleDeleteStore}
            />
          )}
          {activeView === 'reps' && (
            <RepresentativesTab representatives={representatives} stores={stores} onRepresentativeAdded={handleRepresentativeAdded} />
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
