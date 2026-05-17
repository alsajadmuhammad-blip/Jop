"use client";







import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { differenceInDays, parseISO, isSameMonth } from 'date-fns';
import {
  Shield, Package, ToggleLeft, ToggleRight, Settings, Edit, CalendarDays, Trash2, PlusCircle, CheckCircle, XCircle, Clock, SlidersHorizontal, Package2, Users, LogOut, Hourglass, UserPlus, Copy, MoreVertical, DollarSign, Eye
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import type { Store, Product, HeroCarouselItem, User } from "@/lib/types";
import { mapStoreRow } from '@/services/supabase-db';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert, AlertTitle, AlertDescription
} from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { BackButton } from "@/components/layout/back-button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/use-auth';
import { createStoreOwner } from '@/services/supabase-functions';

async function createRepresentativeAction({ name, email, password, paymentSystem, monthlySalary, requiredStoresCount }: { name: string; email: string; password: string; paymentSystem: 'salary' | 'commission'; monthlySalary?: number; requiredStoresCount?: number }) {
    try {
        const insertPayload: any = {
            name,
            email,
            role: 'representative',
            payment_system: paymentSystem,
            total_earnings: 0,
            monthly_salary: paymentSystem === 'salary' ? monthlySalary ?? 0 : 0,
            required_stores_count: paymentSystem === 'salary' ? requiredStoresCount ?? 0 : 0,
        };

        const { data, error } = await supabase.from('users').insert(insertPayload).select().single();
        return { success: !error, error: error?.message, data };
    } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
    }
}


// ===== Representative Registration Dialog =====
const RepresentativeDialog = React.memo(function RepresentativeDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [paymentSystem, setPaymentSystem] = useState<'salary' | 'commission' | ''>('');
    const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
    const [requiredStoresCount, setRequiredStoresCount] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!name || !email || !password || !paymentSystem) {
            toast({ title: "الرجاء ملء جميع الحقول", variant: "destructive" });
            return;
        }
        if (paymentSystem === 'salary' && (!monthlySalary || !requiredStoresCount)) {
            toast({ title: "الرجاء تحديد الراتب الشهري وعدد المتاجر المطلوبة لنظام الراتب", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createRepresentativeAction({ 
                name, 
                email, 
                password, 
                paymentSystem, 
                monthlySalary: paymentSystem === 'salary' ? Number(monthlySalary) : undefined,
                requiredStoresCount: paymentSystem === 'salary' ? Number(requiredStoresCount) : undefined,
            });
             if (result.success) {
                toast({ title: "تم تسجيل المندوب بنجاح" });
                setName('');
                setEmail('');
                setPassword('');
                setPaymentSystem('');
                setMonthlySalary('');
                setRequiredStoresCount('');
                onOpenChange(false);
            } else {
                throw new Error(result.error || "An unknown error occurred.");
            }
        } catch (error: any) {
            toast({ title: "فشل تسجيل المندوب", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة مندوب تسويق جديد</DialogTitle>
                    <DialogDescription>
                        أدخل تفاصيل المندوب لإنشاء حساب خاص به. سيتمكن من تسجيل الدخول باستخدام هذه البيانات.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rep-name">اسم المندوب الكامل</Label>
                        <Input id="rep-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: علي حسن" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rep-email">البريد الإلكتروني (للدخول)</Label>
                        <Input id="rep-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rep@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rep-password">كلمة المرور</Label>
                        <Input id="rep-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="payment-system">نظام الدفع</Label>
                        <Select value={paymentSystem} onValueChange={(value) => setPaymentSystem(value as any)}>
                            <SelectTrigger id="payment-system">
                                <SelectValue placeholder="اختر نظام الدفع للمندوب" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="salary">نظام الراتب الشهري</SelectItem>
                                <SelectItem value="commission">نظام العمولات</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {paymentSystem === 'salary' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="monthly-salary">الراتب الشهري (د.ع)</Label>
                                <Input 
                                    id="monthly-salary" 
                                    type="number" 
                                    value={monthlySalary} 
                                    onChange={(e) => setMonthlySalary(e.target.value ? Number(e.target.value) : '')} 
                                    placeholder="مثال: 500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="required-stores">عدد المتاجر المطلوبة للراتب</Label>
                                <Input 
                                    id="required-stores" 
                                    type="number" 
                                    value={requiredStoresCount} 
                                    onChange={(e) => setRequiredStoresCount(e.target.value ? Number(e.target.value) : '')} 
                                    placeholder="مثال: 10" 
                                />
                            </div>
                        </>
                    )}
                    {paymentSystem === 'commission' && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-medium">سيتم حساب العمولة تلقائياً وفقاً لسياسات المنصة الداخلية.</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء حساب'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});


// ===== Representatives Tab Content =====
function RepresentativesTab({ representatives, stores }: { representatives: User[], stores: Store[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const getStoreCountForRep = (repId: string) => {
        return stores.filter(store => store.registeredByAgentId === repId).length;
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>إدارة المندوبين ({representatives.length})</CardTitle>
                    <CardDescription>إضافة وتتبع أداء ومستحقات مندوبي التسويق.</CardDescription>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}><UserPlus className="ml-2 h-4 w-4" /> إضافة مندوب</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>اسم المندوب</TableHead>
                            <TableHead>الراتب الشهري</TableHead>
                            <TableHead>المتاجر المطلوبة</TableHead>
                            <TableHead>المتاجر المسجلة</TableHead>
                            <TableHead>إجمالي المستحقات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {representatives.length > 0 ? representatives.map(rep => (
                            <TableRow key={rep.id}>
                                <TableCell className="font-medium">{rep.name}</TableCell>
                                <TableCell>{(rep.monthlySalary || 0).toLocaleString()} د.ع</TableCell>
                                <TableCell>{rep.requiredStoresCount || 0}</TableCell>
                                <TableCell className="font-bold text-lg">{getStoreCountForRep(rep.id)}</TableCell>
                                <TableCell className="font-bold text-green-600">
                                    {(rep.totalEarnings || 0).toLocaleString()} د.ع
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                    لا يوجد مندوبون لعرضهم.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <RepresentativeDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </Card>
    );
}

// ===== Hero Slider Manager =====
const HeroSliderManager = React.memo(function HeroSliderManager({ stores }: { stores: Store[] }) {
  const [ads, setAds] = useState<HeroCarouselItem[]>([]);
  const [editingAd, setEditingAd] = useState<Partial<HeroCarouselItem> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewAd, setIsNewAd] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase.from('hero_carousel_items').select('*');
        if (error) throw error;
        if (!mounted) return;
        setAds((data || []).map((row: any) => ({
          id: String(row.id),
          src: row.src,
          text: row.text,
          hint: row.hint,
          storeId: row.store_id || row.storeId || null,
        } as HeroCarouselItem)));
      } catch (error: any) {
        console.error('Supabase error fetching ads:', error);
        toast({ title: "خطأ في جلب الإعلانات", description: error.message || String(error), variant: "destructive" });
      }
    };

    fetchAds();
    return () => { mounted = false; };
  }, [toast]);
  
  const openNewDialog = () => {
    const newAdSeed = `new-ad-${Date.now()}`;
    setEditingAd({
        src: `https://picsum.photos/seed/${newAdSeed}/1200/400`,
        text: '',
        hint: '',
    });
    setImagePreview(`https://picsum.photos/seed/${newAdSeed}/1200/400`);
    setIsNewAd(true);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (ad: HeroCarouselItem) => {
    setEditingAd({ ...ad });
    setImagePreview(ad.src);
    setIsNewAd(false);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingAd) { return; }

    try {
      const adDataToSave: any = {
        src: editingAd.src || '',
        text: editingAd.text || '',
        hint: editingAd.hint || '',
        store_id: editingAd.storeId || null,
      };

      if (isNewAd) {
        const { error } = await supabase.from('hero_carousel_items').insert([adDataToSave]);
        if (error) throw error;
        toast({ title: "تم إضافة الإعلان" });
      } else if (editingAd.id) {
        const { error } = await supabase.from('hero_carousel_items').update(adDataToSave).eq('id', editingAd.id);
        if (error) throw error;
        toast({ title: "تم تحديث الإعلان" });
      }

      setIsDialogOpen(false);
      setEditingAd(null);
      setImagePreview(null);

      // Refresh ads list
      const { data } = await supabase.from('hero_carousel_items').select('*');
      setAds((data || []).map((row: any) => ({ id: String(row.id), src: row.src, text: row.text, hint: row.hint, storeId: row.store_id || null })));
    } catch (error: any) {
      console.error('Supabase error saving ad:', error);
      toast({ title: "حدث خطأ", description: error.message || "فشل حفظ الإعلان.", variant: "destructive" });
    }
  };

  const handleDelete = async (adId: string) => {
    try {
      const { error } = await supabase.from('hero_carousel_items').delete().eq('id', adId);
      if (error) throw error;
      toast({ title: "تم حذف الإعلان", variant: "destructive" });
      // Refresh ads
      const { data } = await supabase.from('hero_carousel_items').select('*');
      setAds((data || []).map((row: any) => ({ id: String(row.id), src: row.src, text: row.text, hint: row.hint, storeId: row.store_id || null })));
    } catch (error: any) {
      console.error('Supabase error deleting ad:', error);
      toast({ title: "فشل حذف الإعلان", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleUpload = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0];
    if(file && editingAd){
      const reader = new FileReader();
      reader.onloadend = () => { 
          const result = reader.result as string;
          setImagePreview(result);
          if(editingAd) {
            setEditingAd({...editingAd, src: result});
          }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
         <div>
            <CardTitle>إعلانات السلايدر</CardTitle>
            <CardDescription>إدارة الإعلانات في الصفحة الرئيسية.</CardDescription>
         </div>
        <Button onClick={openNewDialog} size="sm"><PlusCircle className="ml-2 h-4 w-4"/>إضافة إعلان</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {ads.length > 0 ? ads.map(ad=>(
          <div key={ad.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg gap-4">
            <div className="flex gap-4 items-center">
              <Image src={ad.src} width={100} height={50} alt={ad.text} className="rounded-md object-cover aspect-video bg-muted"/>
              <div>
                <p className="font-semibold">{ad.text}</p>
                <Badge variant={ad.storeId ? "secondary" : "outline"}>{ad.storeId ? `مرتبط بـ: ${stores.find(s=>s.id===ad.storeId)?.name || 'متجر محذوف'}` : 'بدون ربط'}</Badge>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
              <Button variant="outline" size="sm" onClick={()=>openEditDialog(ad)}><Edit className="h-3 w-3 mr-1"/>تعديل</Button>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-9 w-9"><Trash2 className="h-4 w-4"/></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogDescription>سيتم حذف هذا الإعلان نهائياً ولا يمكن التراجع.</AlertDialogDescription>
                      <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={()=>handleDelete(ad.id)}>نعم، حذف</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )) : <p className="text-center text-muted-foreground py-8">لا توجد إعلانات لعرضها.</p>}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNewAd ? "إضافة إعلان جديد" : "تعديل الإعلان"}</DialogTitle></DialogHeader>
          {editingAd && <div className="py-4 space-y-4">
            <Label>نص الإعلان</Label>
            <Input value={editingAd.text || ''} onChange={e=>setEditingAd({...editingAd,text:e.target.value})} placeholder="مثال: خصم 50% على كل شيء" />
            <Label>كلمات مفتاحية (Hint)</Label>
            <Textarea value={editingAd.hint || ''} onChange={e=>setEditingAd({...editingAd, hint: e.target.value})} placeholder="مثال: special offer" />
            <Label>صورة الإعلان</Label>
            {imagePreview && <Image src={imagePreview} width={200} height={100} alt="Ad preview" className="rounded-md object-cover mx-auto my-2"/>}
            <Input type="file" accept="image/*" onChange={handleUpload} />
            <Label>ربط بمتجر (اختياري)</Label>
            <Select value={editingAd.storeId || "none"} onValueChange={v=>setEditingAd({...editingAd, storeId:v==="none"?undefined:v})}>
              <SelectTrigger><SelectValue placeholder="اختر متجراً لربط الإعلان به"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون ربط</SelectItem>
                {stores.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

// ===== Store Management Card =====
const StoreManagementCard = React.memo(function StoreManagementCard({ store, onStatusToggle, onDataUpdate, onDelete }: {
    store: Store,
    onStatusToggle: (storeId: string, isActive: boolean, store: Store) => void,
    onDataUpdate: (storeId: string, data: Partial<Store>) => void,
    onDelete: (storeId: string) => void
}) {
    const activationDays = store.activationDate ? differenceInDays(new Date(), parseISO(store.activationDate)) : 0;
    const subscriptionDuration = store.subscriptionDuration || 30;
    const remainingDays = subscriptionDuration - activationDays;
    const isExpired = store.isActive && remainingDays <= 0;
    const isPending = !store.isActive && !store.activationDate;

    const getStoreStatus = () => {
        if(isPending) return { text: 'قيد المراجعة', variant: 'outline', icon: <Hourglass className="text-amber-500"/> };
        if(isExpired) return { text: 'منتهي الصلاحية', variant: 'destructive', icon: <XCircle/> };
        if(store.isActive) return { text: 'فعّال', variant: 'secondary', icon: <CheckCircle className="text-green-500"/> };
        return { text: 'موقوف', variant: 'destructive', icon: <XCircle/> };
    }

    const status = getStoreStatus();

    return (
        <Card className="flex flex-col text-sm">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <Image
                            alt={`${store.name} logo`}
                            className="aspect-square rounded-md object-contain bg-muted"
                            height="50"
                            src={store.logoUrl || "https://picsum.photos/seed/placeholder/50/50"}
                            width="50"
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
                    <Switch
                        id={`status-${store.id}`}
                        checked={store.isActive}
                        onCheckedChange={(checked) => onStatusToggle(store.id, checked, store)}
                    />
                </div>
                {!isPending && store.activationDate && (
                    <Alert variant={isExpired ? "destructive" : "default"} className="p-2">
                        <CalendarDays className="h-4 w-4" />
                        <AlertTitle className="text-xs font-semibold">
                            {isExpired ? "الاشتراك منتهي" : `الأيام المتبقية: ${remainingDays}`}
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                            {isExpired ? "أعد تفعيل المتجر لبدء دورة جديدة." : `تاريخ التفعيل: ${new Date(store.activationDate).toLocaleDateString('ar-SA')}`}
                        </AlertDescription>
                    </Alert>
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
                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle></AlertDialogHeader>
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
});

// ===== Stores Tab Content =====
function StoresTab({ stores, onStatusToggle, onDataUpdate, onDeleteStore, onOpenAddStoreDialog }: {
    stores: Store[],
    onStatusToggle: (storeId: string, isActive: boolean, store: Store) => void,
    onDataUpdate: (storeId: string, data: Partial<Store>) => void,
    onDeleteStore: (storeId: string) => void,
    onOpenAddStoreDialog: () => void,
}) {
    // A store is pending if it's not active and has no activation date.
    const pendingStores = stores.filter(s => !s.isActive && !s.activationDate);
    // Active stores are those that are active.
    const activeStores = stores.filter(s => s.isActive);
    // Inactive stores are those that are not active but have an activation date (i.e., previously active).
    const inactiveStores = stores.filter(s => !s.isActive && !!s.activationDate);


    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>قائمة المتاجر ({stores.length})</CardTitle>
                    <CardDescription>تحكم في حالة وباقات واشتراكات المتاجر المسجلة.</CardDescription>
                </div>
                <Button onClick={onOpenAddStoreDialog}>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة متجر جديد
                </Button>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending">
                   <TabsList className="grid w-full grid-cols-3">
                       <TabsTrigger value="pending">
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
                                {pendingStores.map(store => (
                                    <StoreManagementCard key={store.id} store={store} onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore} />
                                ))}
                            </div>
                        ) : <p className="text-center text-muted-foreground py-8">لا توجد متاجر تنتظر المراجعة.</p>}
                   </TabsContent>
                   <TabsContent value="active" className="mt-6">
                        {activeStores.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeStores.map(store => (
                                    <StoreManagementCard key={store.id} store={store} onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore} />
                                ))}
                            </div>
                        ) : <p className="text-center text-muted-foreground py-8">لا يوجد متاجر نشطة حالياً.</p>}
                   </TabsContent>
                   <TabsContent value="inactive" className="mt-6">
                       {inactiveStores.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {inactiveStores.map(store => (
                                    <StoreManagementCard key={store.id} store={store} onStatusToggle={onStatusToggle} onDataUpdate={onDataUpdate} onDelete={onDeleteStore}/>
                                ))}
                            </div>
                       ) : <p className="text-center text-muted-foreground py-8">لا يوجد متاجر معطلة حالياً.</p>}
                   </TabsContent>
               </Tabs>
            </CardContent>
        </Card>
    );
}

// ===== Main Dashboard Component =====
function AdminDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState(searchParams?.get('view') || 'stores');
  const { logout } = useAuth();
  const router = useRouter();
  const [isAddStoreDialogOpen, setIsAddStoreDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
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
      const { data: storesData, error: storesError } = await supabase.from('stores').select('*');
      if (storesError) throw storesError;
      setStores((storesData || []).map((r: any) => mapStoreRow(r)));

      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      if (usersError) throw usersError;

      setRepresentatives((usersData || []).filter((u:any) => u.role === 'representative').map((u:any) => ({ id: String(u.id), ...u } as User)));

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
  
  useEffect(() => {
    if (searchParams) {
      const view = searchParams.get('view') || 'stores';
      if (view !== activeView) {
        setActiveView(view);
      }
    }
  }, [searchParams, activeView]);

  useEffect(() => {
    const currentView = searchParams?.get('view') || 'stores';
    if (activeView !== currentView) {
      const basePath = '/admin';
      const newUrl = activeView === 'stores' ? basePath : `${basePath}?view=${encodeURIComponent(activeView)}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [activeView, router, searchParams]);

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
    <div className="min-h-screen bg-slate-50">
      <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
               <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <span className="text-base font-semibold">لوحة التحكم</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {adminViewTabs.map((tab) => (
                  <SidebarMenuItem key={tab.key}>
                    <SidebarMenuButton onClick={() => handleViewChange(tab.key)} isActive={activeView === tab.key}>
                      <tab.icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                    <span>تسجيل الخروج</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        <SidebarInset>
          <div className="p-4 md:p-8">
            <header className="mb-6 rounded-3xl bg-white shadow-sm border border-border/80 p-4 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-headline">لوحة تحكم المشرف</h1>
                  <p className="mt-1 text-sm text-muted-foreground">واجهة إدارة مركزية مع ملخص شامل وصلابة الواجهة على الهاتف.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    <LogOut className="ml-2 h-4 w-4" />
                    خروج
                  </Button>
                  <SidebarTrigger className="md:hidden" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="rounded-3xl border p-4 bg-slate-50">
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

              <div className="mt-4 flex flex-wrap gap-2 md:hidden">
                {adminViewTabs.map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeView === tab.key ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 min-w-[120px] justify-center"
                    onClick={() => handleViewChange(tab.key)}
                  >
                    <tab.icon className="ml-2 h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </header>

            {activeView === 'statistics' && (
              <StatisticsTab stores={stores} representatives={representatives} />
            )}
            {activeView === 'stores' && (
              <StoresTab 
                stores={stores} 
                onStatusToggle={handleStatusToggle} 
                onDataUpdate={handleStoreDataUpdate}
                onDeleteStore={handleDeleteStore}
                onOpenAddStoreDialog={() => setIsAddStoreDialogOpen(true)}
              />
            )}
            {activeView === 'reps' && (
              <RepresentativesTab representatives={representatives} stores={stores} />
            )}
            {activeView === 'subscriptions' && (
              <SubscriptionsTab stores={stores} />
            )}
            {activeView === 'ads' && <HeroSliderManager stores={stores} />}
          </div>
        </SidebarInset>
        </SidebarProvider>
        <AddStoreDialog
          isOpen={isAddStoreDialogOpen}
          onOpenChange={setIsAddStoreDialogOpen}
          onStoreAdded={handleStoreAdded}
        />
      </div>
    );
  }

function SubscriptionsTab({ stores }: { stores: Store[] }) {
  // TODO: Replace with real subscription/package data
  const packages = [
    { name: 'الباقة الأساسية', price: 0, limit: 50, duration: 30 },
    { name: 'باقة متقدمة', price: 10000, limit: 150, duration: 90 },
    { name: 'باقة غير محدودة', price: 25000, limit: 999999, duration: 365 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الاشتراكات والباقات</CardTitle>
        <CardDescription>إدارة باقات الاشتراك والمتاجر المشتركة.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الباقة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>عدد المنتجات</TableHead>
                <TableHead>مدة الاشتراك</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map(pkg => (
                <TableRow key={pkg.name}>
                  <TableCell>{pkg.name}</TableCell>
                  <TableCell>{pkg.price === 0 ? 'مجانية' : `${pkg.price.toLocaleString()} د.ع`}</TableCell>
                  <TableCell>{pkg.limit === 999999 ? 'غير محدود' : pkg.limit}</TableCell>
                  <TableCell>{pkg.duration} يوم</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <CardTitle className="mb-4">المتاجر المشتركة</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المتجر</TableHead>
                <TableHead>الباقة الحالية</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length > 0 ? stores.map(store => (
                <TableRow key={store.id}>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>{store.productLimit === 50 ? 'الأساسية' : store.productLimit === 150 ? 'متقدمة' : store.productLimit >= 999999 ? 'غير محدودة' : 'مخصصة'}</TableCell>
                  <TableCell>{store.activationDate && store.subscriptionDuration ? new Date(new Date(store.activationDate).getTime() + store.subscriptionDuration * 24 * 60 * 60 * 1000).toLocaleDateString() : 'غير محدد'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                    لا يوجد متاجر مشتركة.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
// ===== Statistics Tab Content =====
function StatisticsTab({ stores, representatives }: { stores: Store[], representatives: User[] }) {
  // TODO: Replace with real orders and more stats if available
  const ordersCount = 0; // Placeholder
  return (
    <Card>
      <CardHeader>
        <CardTitle>إحصائيات المنصة</CardTitle>
        <CardDescription>نظرة عامة على أهم الأرقام في المنصة.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <span className="text-3xl font-bold text-primary">{stores.length}</span>
            <span className="mt-2 text-muted-foreground">عدد المتاجر</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <span className="text-3xl font-bold text-primary">{representatives.length}</span>
            <span className="mt-2 text-muted-foreground">عدد المندوبين</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <span className="text-3xl font-bold text-primary">{ordersCount}</span>
            <span className="mt-2 text-muted-foreground">عدد الطلبات</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Add Store Dialog =====
function AddStoreDialog({ isOpen, onOpenChange, onStoreAdded }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onStoreAdded: () => void }) {
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    whatsappNumber: '',
    storeType: 'فعلي' as 'فعلي' | 'إلكتروني',
    marketType: 'phones',
    province: '',
    city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.storeName || !formData.ownerName || !formData.ownerEmail || !formData.password) {
      toast({ title: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create auth user
      const result = await createStoreOwner({
        ownerEmail: formData.ownerEmail,
        ownerName: formData.ownerName,
        ownerPassword: formData.password,
        storeName: formData.storeName,
        whatsappNumber: formData.whatsappNumber,
        marketType: formData.marketType,
        packageName: 'basic',
        storeType: formData.storeType,
      });

      if (!result.success) {
        throw new Error(result.error || 'فشل إنشاء المتجر.');
      }

      toast({ title: "تم إضافة المتجر بنجاح" });
      setFormData({
        storeName: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        whatsappNumber: '',
        storeType: 'فعلي',
        marketType: 'phones',
        province: '',
        city: '',
      });
      onOpenChange(false);
      onStoreAdded();
    } catch (error: any) {
      toast({ title: "فشل في إضافة المتجر", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة متجر جديد</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المتجر وصاحبه. سيتم إنشاء حساب جديد لصاحب المتجر.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">اسم المتجر *</Label>
            <Input
              id="store-name"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="مثال: متجر الأجهزة"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-name">اسم صاحب المتجر *</Label>
            <Input
              id="owner-name"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="مثال: محمد أحمد"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-email">البريد الإلكتروني *</Label>
            <Input
              id="owner-email"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              placeholder="owner@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الأولية *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">رقم الواتساب</Label>
            <Input
              id="whatsapp"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="07xxxxxxxxx"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">المحافظة</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="بغداد"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="الكرادة"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-type">نوع المتجر</Label>
            <Select value={formData.storeType} onValueChange={(value: 'فعلي' | 'إلكتروني') => setFormData({ ...formData, storeType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="فعلي">متجر فعلي</SelectItem>
                <SelectItem value="إلكتروني">متجر إلكتروني</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المتجر'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
