"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { HeroCarouselItem, Store } from "@/lib/types";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export const HeroSliderManager = React.memo(function HeroSliderManager({ stores }: { stores: Store[] }) {
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
          storeId: row.store_id || null,
        })));
      } catch (error: any) {
        console.error('Supabase error fetching ads:', error);
        toast({ title: "خطأ في جلب الإعلانات", description: error.message || String(error), variant: "destructive" });
      }
    };

    fetchAds();
    return () => {
      mounted = false;
    };
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
    if (!editingAd) {
      return;
    }

    try {
      // Validate required fields
      if (!editingAd.src || !editingAd.src.trim()) {
        toast({ title: "خطأ", description: "يجب اختيار صورة للإعلان", variant: "destructive" });
        return;
      }

      const adDataToSave: any = {
        src: editingAd.src,
        text: editingAd.text || '',
        hint: editingAd.hint || '',
        storeId: editingAd.storeId || null,
        store_id: editingAd.storeId || null,
      };

      if (isNewAd) {
        const { data, error } = await supabase.from('hero_carousel_items').insert([adDataToSave]).select('*').single();
        if (error) throw error;
        toast({ title: "✅ تم إضافة الإعلان" });
      } else if (editingAd.id) {
        const { data, error } = await supabase.from('hero_carousel_items').update(adDataToSave).eq('id', editingAd.id).select('*').single();
        if (error) throw error;
        toast({ title: "✅ تم تحديث الإعلان" });
      }

      // Refresh ads list
      const { data } = await supabase.from('hero_carousel_items').select('*');
      if (data) {
        setAds((data || []).map((row: any) => ({
          id: String(row.id),
          src: row.src,
          text: row.text,
          hint: row.hint,
          storeId: row.storeId || row.store_id || null,
        })));
      }

      setIsDialogOpen(false);
      setEditingAd(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error('Supabase error saving ad:', error);
      toast({ title: "❌ حدث خطأ", description: error.message || "فشل حفظ الإعلان.", variant: "destructive" });
    }
  };

  const handleDelete = async (adId: string) => {
    try {
      const { error } = await supabase.from('hero_carousel_items').delete().eq('id', adId);
      if (error) throw error;
      toast({ title: "✅ تم حذف الإعلان بنجاح" });
      
      // Refresh ads list
      const { data } = await supabase.from('hero_carousel_items').select('*');
      if (data) {
        setAds((data || []).map((row: any) => ({
          id: String(row.id),
          src: row.src,
          text: row.text,
          hint: row.hint,
          storeId: row.storeId || row.store_id || null,
        })));
      }
    } catch (error: any) {
      console.error('Supabase error deleting ad:', error);
      toast({ title: "❌ فشل حذف الإعلان", description: error.message || String(error), variant: "destructive" });
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingAd) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        if (editingAd) {
          setEditingAd({ ...editingAd, src: result });
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
        <Button onClick={openNewDialog} size="sm">
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة إعلان
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {ads.length > 0 ? ads.map((ad) => (
          <div key={ad.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg gap-4">
            <div className="flex gap-4 items-center">
              <Image src={ad.src} width={100} height={50} alt={ad.text || 'Ad preview'} className="rounded-md object-cover aspect-video bg-muted" />
              <div>
                <p className="font-semibold">{ad.text}</p>
                <Badge variant={ad.storeId ? "secondary" : "outline"}>{ad.storeId ? `مرتبط بـ: ${stores.find((s) => s.id === ad.storeId)?.name || 'متجر محذوف'}` : 'بدون ربط'}</Badge>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(ad)}>
                <Edit className="h-3 w-3 mr-1" />تعديل
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-9 w-9">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogDescription>سيتم حذف هذا الإعلان نهائياً ولا يمكن التراجع.</AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(ad.id)}>نعم، حذف</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )) : (
          <p className="text-center text-muted-foreground py-8">لا توجد إعلانات لعرضها.</p>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNewAd ? "إضافة إعلان جديد" : "تعديل الإعلان"}</DialogTitle>
          </DialogHeader>
          {editingAd && (
            <div className="py-4 space-y-4">
              <Label>نص الإعلان</Label>
              <Input value={editingAd.text || ''} onChange={(e) => setEditingAd({ ...editingAd, text: e.target.value })} placeholder="مثال: خصم 50% على كل شيء" />
              <Label>كلمات مفتاحية (Hint)</Label>
              <Textarea value={editingAd.hint || ''} onChange={(e) => setEditingAd({ ...editingAd, hint: e.target.value })} placeholder="مثال: special offer" />
              <Label>صورة الإعلان</Label>
              {imagePreview && <Image src={imagePreview} width={200} height={100} alt="Ad preview" className="rounded-md object-cover mx-auto my-2" />}
              <Input type="file" accept="image/*" onChange={handleUpload} />
              <Label>ربط بمتجر (اختياري)</Label>
              <Select value={editingAd.storeId || "none"} onValueChange={(v) => setEditingAd({ ...editingAd, storeId: v === "none" ? undefined : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر متجراً لربط الإعلان به" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون ربط</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});
