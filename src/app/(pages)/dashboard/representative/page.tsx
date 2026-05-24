
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Store } from '@/lib/types';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, CheckCircle, Hourglass, XCircle, Store as StoreIcon, TrendingUp, Users, CalendarDays, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import Image from 'next/image';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


const getStatusBadge = (store: Store) => {
    if (store.isActive) {
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="ml-1 h-3 w-3" /> نشط</Badge>;
    }
    if (!store.activationDate) {
        return <Badge variant="outline" className="border-amber-300"><Hourglass className="ml-1 h-3 w-3 text-amber-500" /> قيد المراجعة</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="ml-1 h-3 w-3" /> موقوف</Badge>;
};


function RepresentativeDashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'overview' | 'stores'>('overview');

    useEffect(() => {
        if (!user || user.role !== 'representative') return;

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('registered_by_agent_id', user.id);

                if (error) {
                    throw error;
                }

                const mappedStores: Store[] = (data || []).map((row: any) => ({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    logoUrl: row.logo_url || row.logoUrl,
                    coverImageUrl: row.cover_image_url || row.coverImageUrl,
                    rating: row.rating || 0,
                    reviews: row.reviews || 0,
                    location: row.location || '',
                    latitude: row.latitude ?? null,
                    longitude: row.longitude ?? null,
                    type: row.type,
                    marketType: row.market_type || row.marketType || '',
                    businessHours: row.business_hours || row.businessHours,
                    products: row.products || [],
                    whatsappNumber: row.whatsapp_number || row.whatsappNumber,
                    hasDelivery: row.has_delivery || row.hasDelivery || false,
                    isActive: row.is_active || row.isActive || false,
                    productLimit: row.product_limit || row.productLimit || Number.MAX_SAFE_INTEGER,
                    subscriptionDuration: row.subscription_duration || row.subscriptionDuration || 0,
                    activationDate: row.activation_date || row.activationDate || null,
                    ownerId: row.owner_id || row.ownerId || null,
                    ownerEmail: row.owner_email || row.ownerEmail,
                    password: row.password,
                    createdAt: row.created_at || row.createdAt || null,
                    registeredByAgentId: row.registered_by_agent_id || row.registeredByAgentId || null,
                    referralCode: row.referral_code || row.referralCode || null,
                } as Store));

                setStores(mappedStores);
            } catch (error) {
                console.error("Error fetching stores: ", error);
                toast({ title: "خطأ في تحميل المتاجر", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        })();

    }, [user, toast]);
    
    const monthlyStats = useMemo(() => {
        const stats: { [key: string]: { month: string, stores: number } } = {};

        stores.forEach(store => {
             const createdAt = store.createdAt;
            if (createdAt) {
                // Handle both server timestamp formats and ISO string
                const date = typeof createdAt === 'string' 
                    ? new Date(createdAt) 
                    : (createdAt as any).toDate();
                    
                if (date instanceof Date && !isNaN(date.valueOf())) {
                    const month = date.toLocaleString('ar-SA', { month: 'long', year: 'numeric' });
                    if (!stats[month]) {
                        stats[month] = { month, stores: 0 };
                    }
                    stats[month].stores++;
                }
            }
        });

        return Object.values(stats).sort((a,b) => {
            const [aMonth, aYear] = a.month.split(' ');
            const [bMonth, bYear] = b.month.split(' ');
            // A simple sort based on year then month index might be needed if localeCompare fails
            return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
        });
    }, [stores]);


    const chartConfig = {
      stores: {
        label: "المتاجر",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig

    const handleLogout = () => {
        logout();
    };

    if (loading) {
        return <LoadingSpinner isLoading={true} />;
    }
    
    if (!user) {
        return null;
    }

    const totalStores = stores.length;
    const activeStores = stores.filter(s => s.isActive).length;
    const requiredStores = user.requiredStoresCount || 0;
    const monthlySalary = user.monthlySalary || 0;
    const hasAchievedTarget = totalStores >= requiredStores;

    return (
        <div className="bg-muted/30 min-h-screen">
            <div className="px-4 py-6 md:px-6 md:py-8">
                <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                         <div className="relative h-16 w-16">
                            <Image
                              src={`https://i.pravatar.cc/150?u=${user.id}`}
                              alt={user.name || "User Avatar"}
                              className="rounded-full border-2 border-primary"
                              width={64}
                              height={64}
                            />
                            <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-background"/>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold font-headline">لوحة تحكم المندوب</h1>
                            <p className="text-muted-foreground mt-1">أهلاً بعودتك، {user?.name}!</p>
                        </div>
                    </div>
                    <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
                        <LogOut className="ml-2 h-4 w-4" />
                        تسجيل الخروج
                    </Button>
                </header>

                <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'stores' | 'overview')}>
                  <TabsList className="mb-6 rounded-3xl bg-white/80 p-1 shadow-sm border border-border/80">
                    <TabsTrigger value="overview">الملخص</TabsTrigger>
                    <TabsTrigger value="stores">المتاجر</TabsTrigger>
                  </TabsList>
                </Tabs>

                {activeSection === 'overview' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">الراتب الشهري</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{monthlySalary.toLocaleString()} <span className="text-sm">د.ع</span></div>
                                <p className="text-xs text-muted-foreground">راتبك الشهري المحدد</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">إجمالي المتاجر المسجلة</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalStores}</div>
                                <p className="text-xs text-muted-foreground">المتاجر التي قمت بتسجيلها</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">المتاجر النشطة</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeStores}</div>
                                <p className="text-xs text-muted-foreground">المتاجر المفعّلة حالياً</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">الهدف الشهري</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{hasAchievedTarget ? 'مكتمل' : 'قيد التنفيذ'}</div>
                                <p className="text-xs text-muted-foreground">{hasAchievedTarget ? 'لقد حققت هدفك الشهري' : `متبقي ${requiredStores - totalStores} متجر`}</p>
                            </CardContent>
                        </Card>

                        {monthlyStats.length > 0 && (
                            <Card className="lg:col-span-4">
                                <CardHeader>
                                    <CardTitle>أداء التسجيل الشهري</CardTitle>
                                    <CardDescription>عدد المتاجر التي سجلتها كل شهر.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                        <BarChart accessibilityLayer data={monthlyStats}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                tickFormatter={(value) => value.slice(0, 8)}
                                            />
                                            <YAxis />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="stores" fill="var(--color-stores)" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>قائمة المتاجر المسجلة</CardTitle>
                            <CardDescription>هذه هي المتاجر التي قمت بتسجيلها مباشرة في النظام.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stores.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>اسم المتجر</TableHead>
                                                <TableHead>الموقع</TableHead>
                                                <TableHead className="text-center">الحالة</TableHead>
                                                <TableHead>تاريخ التسجيل</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stores.map(store => (
                                                <TableRow key={store.id}>
                                                    <TableCell className="font-medium">{store.name}</TableCell>
                                                    <TableCell>{store.location}</TableCell>
                                                    <TableCell className="text-center">{getStatusBadge(store)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays className="h-4 w-4 text-muted-foreground"/>
                                                            <span>{store.createdAt ? new Date(typeof store.createdAt === 'string' ? store.createdAt : (store.createdAt as any).toDate()).toLocaleDateString('ar-EG') : 'غير معروف'}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-16 rounded-lg bg-background border-2 border-dashed">
                                    <StoreIcon className="mx-auto h-16 w-16 text-muted-foreground" strokeWidth={1} />
                                    <h2 className="mt-4 text-xl font-semibold">ابدأ رحلتك الآن!</h2>
                                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                                        لم تقم بتسجيل أي متاجر بعد. ابدأ بإضافة متاجر جديدة لتحقيق هدفك الشهري.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}


export default function RepresentativePage() {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) {
            return; // Wait for the loading to finish
        }
        if (!user || userRole !== 'representative') {
            router.replace('/login');
        }
    }, [user, userRole, loading, router]);

    if (loading || !user || userRole !== 'representative') {
        return <LoadingSpinner isLoading={true} />;
    }

    return <RepresentativeDashboard />;
}
