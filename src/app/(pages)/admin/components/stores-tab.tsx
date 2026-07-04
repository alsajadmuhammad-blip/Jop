"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import {
  Eye, Trash2, CheckCircle, XCircle, Hourglass,
  ToggleLeft, ToggleRight, CalendarDays, PlusCircle,
  Handshake, Search, Mail, Package,
} from "lucide-react";
import type { Store, User } from "@/lib/types";
import {
  Card, CardContent, CardHeader, CardTitle,
  CardDescription, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── بطاقة متجر ───────────────────────────────────────────────────
function StoreManagementCard({
  store,
  representatives,
  onStatusToggle,
  onDataUpdate,
  onDelete,
}: {
  store: Store;
  representatives: User[];
  onStatusToggle: (storeId: string, isActive: boolean, store: Store) => void;
  onDataUpdate: (storeId: string, data: Partial<Store>) => void;
  onDelete: (storeId: string) => void;
}) {
  const activationDays   = store.activationDate ? differenceInDays(new Date(), parseISO(store.activationDate)) : 0;
  const subscriptionDays = store.subscriptionDuration || 30;
  const remainingDays    = subscriptionDays - activationDays;
  const isExpired  = store.isActive && remainingDays <= 0;
  const isPending  = !store.isActive && !store.activationDate;
  const isExpiring = store.isActive && remainingDays > 0 && remainingDays <= 7;

  const getStatus = () => {
    if (isPending)   return { text: 'قيد المراجعة',     variant: 'outline',      icon: <Hourglass className="h-3 w-3 text-amber-500" /> };
    if (isExpired)   return { text: 'منتهي الصلاحية',   variant: 'destructive',  icon: <XCircle   className="h-3 w-3" /> };
    if (store.isActive) return { text: 'فعّال',          variant: 'secondary',    icon: <CheckCircle className="h-3 w-3 text-green-500" /> };
    return               { text: 'موقوف',                variant: 'destructive',  icon: <XCircle   className="h-3 w-3" /> };
  };

  const status          = getStatus();
  const assignedPartner = representatives.find(r => r.id === store.registeredByAgentId);

  const handlePartnerChange = (value: string) => {
    const newAgentId: string | null = value === '__none__' ? null : value;
    onDataUpdate(store.id, { registeredByAgentId: newAgentId });
  };

  return (
    <Card className="flex flex-col text-sm border border-border/70 shadow-sm hover:shadow-md transition-shadow">
      {/* ── الهيدر ── */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              alt={store.name}
              className="aspect-square rounded-lg object-contain bg-muted shrink-0"
              height={44}
              width={44}
              src={store.logoUrl || "https://picsum.photos/seed/placeholder/50/50"}
            />
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight truncate">{store.name}</CardTitle>
              {store.location && (
                <CardDescription className="text-xs truncate mt-0.5">{store.location}</CardDescription>
              )}
            </div>
          </div>
          <Badge variant={status.variant as any} className="flex items-center gap-1 shrink-0 text-xs">
            {status.icon}
            <span>{status.text}</span>
          </Badge>
        </div>
      </CardHeader>

      {/* ── المعلومات ── */}
      <CardContent className="flex-grow space-y-2.5 pb-3">

        {/* البريد والباقة */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {store.ownerEmail && (
            <div className="flex items-center gap-1.5 col-span-2 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{store.ownerEmail}</span>
            </div>
          )}
          {store.packageName && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3 w-3 shrink-0" />
              <span>{store.packageName}</span>
            </div>
          )}
          {store.marketType && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">📂</span>
              <span>{store.marketType}</span>
            </div>
          )}
        </div>

        {/* تفعيل / إيقاف */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/40">
          <Label htmlFor={`status-${store.id}`} className="flex items-center gap-2 cursor-pointer text-xs">
            {store.isActive && !isExpired
              ? <ToggleRight className="h-4 w-4 text-green-500" />
              : <ToggleLeft  className="h-4 w-4 text-red-500"   />}
            <span>{isPending ? "تفعيل المتجر" : "حالة المتجر"}</span>
          </Label>
          <Switch
            id={`status-${store.id}`}
            checked={store.isActive}
            onCheckedChange={checked => onStatusToggle(store.id, checked, store)}
          />
        </div>

        {/* الأيام المتبقية */}
        {!isPending && store.activationDate && (
          <div className={`rounded-lg border p-2.5 text-xs ${
            isExpired    ? 'border-red-200 bg-red-50'
            : isExpiring ? 'border-amber-200 bg-amber-50'
            : 'border-border/40 bg-muted/50'
          }`}>
            <div className="flex items-center gap-2">
              <CalendarDays className={`h-3.5 w-3.5 shrink-0 ${isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-muted-foreground'}`} />
              <div>
                <p className={`font-semibold ${isExpired ? 'text-red-700' : isExpiring ? 'text-amber-700' : ''}`}>
                  {isExpired ? '⚠️ الاشتراك منتهي' : `الأيام المتبقية: ${remainingDays}`}
                </p>
                <p className="text-muted-foreground">تفعيل: {new Date(store.activationDate).toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
          </div>
        )}

        {/* الشريك المسجّل */}
        {representatives.length > 0 && (
          <div className="rounded-lg border border-border/40 p-2.5 bg-muted/50 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Handshake className="h-3 w-3" />
              <span>المسوّق</span>
            </div>
            <Select
              value={store.registeredByAgentId ?? '__none__'}
              onValueChange={handlePartnerChange}
            >
              <SelectTrigger className="h-7 text-xs">
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
              <p className="text-xs text-emerald-600 font-medium">✓ {assignedPartner.name}</p>
            )}
          </div>
        )}
      </CardContent>

      {/* ── الأزرار ── */}
      <CardFooter className="justify-between flex-wrap gap-2 pt-2">
        <Link
          href={`/store?id=${store.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition"
        >
          <Eye className="h-3.5 w-3.5" /> عرض المتجر
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="text-xs h-7">
              <Trash2 className="h-3.5 w-3.5 ml-1" /> حذف
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
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
      </CardFooter>
    </Card>
  );
}

const MemoStoreCard = React.memo(StoreManagementCard);

// ─── شبكة المتاجر مع رسالة فارغة ──────────────────────────────────
function StoreGrid({
  stores, representatives, emptyMsg, onStatusToggle, onDataUpdate, onDelete,
}: {
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
        <p>{emptyMsg}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

// ─── المكوّن الرئيسي ──────────────────────────────────────────────
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

  const filter = (list: Store[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.ownerEmail ?? '').toLowerCase().includes(q) ||
      (s.marketType ?? '').toLowerCase().includes(q) ||
      (s.packageName ?? '').toLowerCase().includes(q)
    );
  };

  const pendingStores  = useMemo(() => filter(stores.filter(s => !s.isActive && !s.activationDate)), [stores, search]);
  const activeStores   = useMemo(() => filter(stores.filter(s => s.isActive)),                        [stores, search]);
  const inactiveStores = useMemo(() => filter(stores.filter(s => !s.isActive && !!s.activationDate)), [stores, search]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
        <div>
          <CardTitle>قائمة المتاجر ({stores.length})</CardTitle>
          <CardDescription>تحكم في حالة وباقات المتاجر المسجلة.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/stores">
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة متجر
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {/* شريط البحث */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم المتجر أو البريد أو الفئة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="gap-1.5">
              <Hourglass className="h-3.5 w-3.5 text-amber-500" />
              مراجعة ({stores.filter(s => !s.isActive && !s.activationDate).length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              نشطة ({stores.filter(s => s.isActive).length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              معطّلة ({stores.filter(s => !s.isActive && !!s.activationDate).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <StoreGrid
              stores={pendingStores}
              representatives={representatives}
              emptyMsg={search ? 'لا توجد نتائج للبحث' : 'لا توجد متاجر تنتظر المراجعة'}
              onStatusToggle={onStatusToggle}
              onDataUpdate={onDataUpdate}
              onDelete={onDeleteStore}
            />
          </TabsContent>

          <TabsContent value="active">
            <StoreGrid
              stores={activeStores}
              representatives={representatives}
              emptyMsg={search ? 'لا توجد نتائج للبحث' : 'لا يوجد متاجر نشطة حالياً'}
              onStatusToggle={onStatusToggle}
              onDataUpdate={onDataUpdate}
              onDelete={onDeleteStore}
            />
          </TabsContent>

          <TabsContent value="inactive">
            <StoreGrid
              stores={inactiveStores}
              representatives={representatives}
              emptyMsg={search ? 'لا توجد نتائج للبحث' : 'لا يوجد متاجر معطّلة حالياً'}
              onStatusToggle={onStatusToggle}
              onDataUpdate={onDataUpdate}
              onDelete={onDeleteStore}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
