"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import { Eye, Trash2, CheckCircle, XCircle, Hourglass, ToggleLeft, ToggleRight, CalendarDays, PlusCircle } from "lucide-react";
import type { Store } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

function StoreManagementCard({
  store,
  onStatusToggle,
  onDataUpdate,
  onDelete,
}: {
  store: Store;
  onStatusToggle: (storeId: string, isActive: boolean, store: Store) => void;
  onDataUpdate: (storeId: string, data: Partial<Store>) => void;
  onDelete: (storeId: string) => void;
}) {
  const activationDays = store.activationDate ? differenceInDays(new Date(), parseISO(store.activationDate)) : 0;
  const subscriptionDuration = store.subscriptionDuration || 30;
  const remainingDays = subscriptionDuration - activationDays;
  const isExpired = store.isActive && remainingDays <= 0;
  const isPending = !store.isActive && !store.activationDate;

  const getStoreStatus = () => {
    if (isPending) return { text: 'قيد المراجعة', variant: 'outline', icon: <Hourglass className="text-amber-500" /> };
    if (isExpired) return { text: 'منتهي الصلاحية', variant: 'destructive', icon: <XCircle /> };
    if (store.isActive) return { text: 'فعّال', variant: 'secondary', icon: <CheckCircle className="text-green-500" /> };
    return { text: 'موقوف', variant: 'destructive', icon: <XCircle /> };
  };

  const status = getStoreStatus();

  return (
    <Card className="flex flex-col text-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              alt={`${store.name} logo`}
              className="aspect-square rounded-md object-contain bg-muted"
              height={50}
              src={store.logoUrl || "https://picsum.photos/seed/placeholder/50/50"}
              width={50}
            />
            <div>
              <CardTitle className="text-base">{store.name}</CardTitle>
              <CardDescription>{store.location}</CardDescription>
            </div>
          </div>
          <Badge variant={status.variant as any} className="flex items-center gap-1">
            {status.icon}
            <span>{status.text}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <Label htmlFor={`status-${store.id}`} className="flex items-center gap-2 cursor-pointer">
            {store.isActive && !isExpired ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-red-500" />}
            <span>{isPending ? "تفعيل المتجر" : "حالة المتجر"}</span>
          </Label>
          <Switch id={`status-${store.id}`} checked={store.isActive} onCheckedChange={(checked) => onStatusToggle(store.id, checked, store)} />
        </div>
        {!isPending && store.activationDate && (
          <div className="rounded-lg border border-border/80 p-3 bg-muted/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <div>
                <p className="font-semibold">{isExpired ? "الاشتراك منتهي" : `الأيام المتبقية: ${remainingDays}`}</p>
                <p className="text-xs">{`تاريخ التفعيل: ${new Date(store.activationDate).toLocaleDateString('ar-SA')}`}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between flex-wrap gap-2">
        <Link href={`/store?id=${store.id}`} className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition">
          <Eye className="h-4 w-4" />
          عرض المتجر
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 ml-1" />
              حذف المتجر
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>سيتم حذف هذا المتجر وجميع منتجاته نهائياً.</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(store.id)}>نعم، حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

const MemoStoreManagementCard = React.memo(StoreManagementCard);

export function StoresTab({
  stores,
  onStatusToggle,
  onDataUpdate,
  onDeleteStore,
}: {
  stores: Store[];
  onStatusToggle: (storeId: string, isActive: boolean, store: Store) => void;
  onDataUpdate: (storeId: string, data: Partial<Store>) => void;
  onDeleteStore: (storeId: string) => void;
}) {
  const pendingStores = stores.filter((s) => !s.isActive && !s.activationDate);
  const activeStores = stores.filter((s) => s.isActive);
  const inactiveStores = stores.filter((s) => !s.isActive && !!s.activationDate);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>قائمة المتاجر ({stores.length})</CardTitle>
          <CardDescription>تحكم في حالة وباقات واشتراكات المتاجر المسجلة.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/add-store">
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة متجر جديد
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            <TabsTrigger value="pending" className="whitespace-normal text-center">
              <Hourglass className="ml-1 h-4 w-4 text-amber-500" />
              قيد المراجعة ({pendingStores.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
              المتاجر النشطة ({activeStores.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              <XCircle className="ml-1 h-4 w-4 text-red-500" />
              المتاجر المعطلة ({inactiveStores.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-6">
            {pendingStores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingStores.map((store) => (
                  <MemoStoreManagementCard key={store.id} store={store} onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا توجد متاجر تنتظر المراجعة.</p>
            )}
          </TabsContent>
          <TabsContent value="active" className="mt-6">
            {activeStores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeStores.map((store) => (
                  <MemoStoreManagementCard key={store.id} store={store} onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا يوجد متاجر نشطة حالياً.</p>
            )}
          </TabsContent>
          <TabsContent value="inactive" className="mt-6">
            {inactiveStores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inactiveStores.map((store) => (
                  <MemoStoreManagementCard key={store.id} store={store} onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا يوجد متاجر معطلة حالياً.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
