"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import {
  Eye, Trash2, CheckCircle, XCircle, Hourglass,
  PlusCircle, Handshake, Search, Package, CalendarDays,
  ToggleLeft, ToggleRight, AlertTriangle, Phone,
} from "lucide-react";
import type { Store, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── مساعد الأيام ───────────────────────────────────────────────────
function getSubscriptionInfo(store: Store) {
  const isPending = !store.isActive && !store.activationDate;
  const activationDays = store.activationDate
    ? differenceInDays(new Date(), parseISO(store.activationDate))
    : 0;
  const total = store.subscriptionDuration || 30;
  const remaining = total - activationDays;
  const isExpired  = store.isActive && remaining <= 0;
  const isExpiring = store.isActive && remaining > 0 && remaining <= 7;
  const progress   = Math.max(0, Math.min(100, (activationDays / total) * 100));
  return { isPending, remaining, isExpired, isExpiring, progress, total };
}

// ─── بطاقة متجر ────────────────────────────────────────────────────
function StoreCard({
  store, representatives, onStatusToggle, onDataUpdate, onDelete,
}: {
  store: Store;
  representatives: User[];
  onStatusToggle: (id: string, active: boolean, store: Store) => void;
  onDataUpdate: (id: string, data: Partial<Store>) => void;
  onDelete: (id: string) => void;
}) {
  const { isPending, remaining, isExpired, isExpiring, progress } = getSubscriptionInfo(store);
  const assignedPartner = representatives.find(r => r.id === store.registeredByAgentId);

  const statusBadge = () => {
    if (isPending)     return { text: 'قيد المراجعة',   cls: 'border-amber-200 bg-amber-50 text-amber-700',   icon: <Hourglass    className="h-3 w-3" /> };
    if (isExpired)     return { text: 'منتهي الصلاحية', cls: 'border-red-200 bg-red-50 text-red-700',          icon: <XCircle      className="h-3 w-3" /> };
    if (isExpiring)    return { text: `${remaining}د تنتهي`,  cls: 'border-orange-200 bg-orange-50 text-orange-700', icon: <AlertTriangle className="h-3 w-3" /> };
    if (store.isActive) return { text: 'فعّال',           cls: 'border-green-200 bg-green-50 text-green-700',  icon: <CheckCircle  className="h-3 w-3" /> };
    return               { text: 'موقوف',               cls: 'border-red-200 bg-red-50 text-red-700',          icon: <XCircle      className="h-3 w-3" /> };
  };
  const s = statusBadge();

  return (
    <Card className="flex flex-col border border-border/70 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* شريط الاشتراك العلوي */}
      {!isPending && store.activationDate && (
        <div className="h-1 w-full bg-muted">
          <div
            className={`h-full transition-all duration-500 ${isExpired ? 'bg-red-400' : isExpiring ? 'bg-orange-400' : 'bg-emerald-400'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* الرأس */}
        <div className="flex items-start gap-3">
          <Image
            alt={store.name}
            src={store.logoUrl || 'https://picsum.photos/seed/placeholder/50/50'}
            width={44} height={44}
            className="rounded-xl object-contain bg-muted shrink-0 border border-border/50"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sm leading-tight truncate">{store.name}</p>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0 ${s.cls}`}>
                {s.icon}{s.text}
              </span>
            </div>
            {store.location && <p className="text-xs text-muted-foreground mt-0.5 truncate">{store.location}</p>}
          </div>
        </div>

        {/* المعلومات */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {store.ownerEmail && (
            <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground truncate">
              <span className="shrink-0">✉️</span>
              <span className="truncate">{store.ownerEmail}</span>
            </div>
          )}
          {store.whatsappNumber && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span dir="ltr">{store.whatsappNumber}</span>
            </div>
          )}
          {store.packageName && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="h-3 w-3 shrink-0" />
              <span className="truncate">{store.packageName}</span>
            </div>
          )}
          {store.marketType && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>📂</span>
              <span className="truncate">{store.marketType}</span>
            </div>
          )}
          {store.productLimit && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>📦</span>
              <span>{store.productLimit >= 999999 ? 'منتجات غير محدودة' : `${store.productLimit} منتج`}</span>
            </div>
          )}
        </div>

        {/* الاشتراك */}
        {!isPending && store.activationDate && (
          <div className={`rounded-xl border p-2.5 text-xs ${
            isExpired ? 'border-red-200 bg-red-50' : isExpiring ? 'border-orange-200 bg-orange-50' : 'border-border/40 bg-muted/30'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays className={`h-3.5 w-3.5 ${isExpired ? 'text-red-500' : isExpiring ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <span className={`font-semibold ${isExpired ? 'text-red-700' : isExpiring ? 'text-orange-700' : ''}`}>
                  {isExpired ? 'الاشتراك منتهي' : `${remaining} يوم متبقي`}
                </span>
              </div>
              <span className="text-muted-foreground">من {store.subscriptionDuration} يوم</span>
            </div>
          </div>
        )}

        {/* تبديل الحالة */}
        <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/40 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            {store.isActive && !isExpired
              ? <ToggleRight className="h-4 w-4 text-green-500" />
              : <ToggleLeft  className="h-4 w-4 text-muted-foreground" />}
            <span>{isPending ? 'تفعيل المتجر' : store.isActive ? 'متجر مفعّل' : 'متجر موقوف'}</span>
          </div>
          <Switch
            checked={!!store.isActive}
            onCheckedChange={v => onStatusToggle(store.id, v, store)}
          />
        </div>

        {/* المسوّق */}
        {representatives.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Handshake className="h-3 w-3" /><span>المسوّق المسؤول</span>
            </div>
            <Select value={store.registeredByAgentId ?? '__none__'} onValueChange={v => onDataUpdate(store.id, { registeredByAgentId: v === '__none__' ? null : v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="لا يوجد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— لا يوجد —</SelectItem>
                {representatives.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}{r.partnerCode ? ` (${r.partnerCode})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedPartner && (
              <p className="text-xs text-emerald-600 font-medium px-1">✓ {assignedPartner.name}</p>
            )}
          </div>
        )}

        {/* أزرار */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Link
            href={`/store?id=${store.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition"
          >
            <Eye className="h-3.5 w-3.5" /> عرض المتجر
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="text-xs h-8 px-3">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>حذف المتجر؟</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription>
                سيتم حذف <strong>{store.name}</strong> وجميع بياناته نهائياً ولا يمكن التراجع.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(store.id)}>نعم، احذف</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

const MemoStoreCard = React.memo(StoreCard);

// ─── شبكة المتاجر ──────────────────────────────────────────────────
function StoreGrid({ stores, representatives, emptyMsg, onStatusToggle, onDataUpdate, onDelete }: {
  stores: Store[];
  representatives: User[];
  emptyMsg: string;
  onStatusToggle: (id: string, active: boolean, store: Store) => void;
  onDataUpdate: (id: string, data: Partial<Store>) => void;
  onDelete: (id: string) => void;
}) {
  if (stores.length === 0) {
    return (
      <div className="text-center py-14 text-muted-foreground">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm">{emptyMsg}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {stores.map(store => (
        <MemoStoreCard
          key={store.id}
          store={store}
          representatives={representatives}
          onStatusToggle={onStatusToggle}
          onDataUpdate={onDataUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ─── المكوّن الرئيسي ────────────────────────────────────────────────
export function StoresTab({
  stores,
  representatives = [],
  onStatusToggle,
  onDataUpdate,
  onDeleteStore,
}: {
  stores: Store[];
  representatives?: User[];
  onStatusToggle: (storeId: string, isActive: boolean, store: Store) => void;
  onDataUpdate: (storeId: string, data: Partial<Store>) => void;
  onDeleteStore: (storeId: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filterFn = (list: Store[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.ownerEmail ?? '').toLowerCase().includes(q) ||
      (s.marketType ?? '').toLowerCase().includes(q) ||
      (s.packageName ?? '').toLowerCase().includes(q) ||
      (s.whatsappNumber ?? '').includes(q)
    );
  };

  const pendingStores  = useMemo(() => filterFn(stores.filter(s => !s.isActive && !s.activationDate)), [stores, search]);
  const activeStores   = useMemo(() => filterFn(stores.filter(s => s.isActive)),                        [stores, search]);
  const inactiveStores = useMemo(() => filterFn(stores.filter(s => !s.isActive && !!s.activationDate)), [stores, search]);

  const pendingCount  = stores.filter(s => !s.isActive && !s.activationDate).length;
  const activeCount   = stores.filter(s => s.isActive).length;
  const inactiveCount = stores.filter(s => !s.isActive && !!s.activationDate).length;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
        <div>
          <CardTitle>قائمة المتاجر <span className="text-muted-foreground font-normal text-base">({stores.length})</span></CardTitle>
          <CardDescription>تحكم في حالة وباقات المتاجر المسجّلة</CardDescription>
        </div>
        <Button asChild size="sm" className="gap-1.5 text-xs h-8">
          <Link href="/admin/stores">
            <PlusCircle className="h-3.5 w-3.5" /> إضافة متجر
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {/* بحث */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم المتجر أو البريد أو الفئة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 h-9"
          />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3 mb-5 h-auto">
            <TabsTrigger value="pending" className="flex-col sm:flex-row gap-1 py-2 text-xs">
              <div className="flex items-center gap-1">
                <Hourglass className="h-3.5 w-3.5 text-amber-500" />
                <span>مراجعة</span>
              </div>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold w-5 h-5">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-col sm:flex-row gap-1 py-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span>نشطة</span>
              </div>
              <span className="text-muted-foreground text-[10px]">({activeCount})</span>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex-col sm:flex-row gap-1 py-2 text-xs">
              <div className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                <span>معطّلة</span>
              </div>
              <span className="text-muted-foreground text-[10px]">({inactiveCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <StoreGrid
              stores={pendingStores} representatives={representatives}
              emptyMsg={search ? 'لا نتائج للبحث' : 'لا توجد متاجر تنتظر المراجعة 🎉'}
              onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore}
            />
          </TabsContent>
          <TabsContent value="active">
            <StoreGrid
              stores={activeStores} representatives={representatives}
              emptyMsg={search ? 'لا نتائج للبحث' : 'لا يوجد متاجر نشطة حالياً'}
              onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore}
            />
          </TabsContent>
          <TabsContent value="inactive">
            <StoreGrid
              stores={inactiveStores} representatives={representatives}
              emptyMsg={search ? 'لا نتائج للبحث' : 'لا يوجد متاجر معطّلة حالياً'}
              onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
