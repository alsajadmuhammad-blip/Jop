"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { customerRegistrationSchema } from "@/lib/validations";

function StoreRegistrationForm() {
  return (
    <div className="space-y-5 p-1 text-center">
      <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background p-5 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">إنشاء متجر جديد</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900">ابدأ من صفحة مخصصة لإنشاء المتجر</h3>
        <p className="mt-2 text-sm text-muted-foreground">هذه الصفحة مخصصة لحساب العميل فقط. إذا كنت تريد فتح متجر جديد، استخدم الصفحة المخصصة لاختيار الباقة وإكمال إنشاء المتجر.</p>
      </div>
      <Link href="/create-store" className="block w-full">
        <Button className="w-full" size="lg">فتح متجر جديد</Button>
      </Link>
      <p className="text-sm text-muted-foreground">لن تظهر هنا أي تكرار في اختيار الباقة؛ كل شيء موحد داخل صفحة إنشاء المتجر.</p>
    </div>
  );
}

type CustomerFormValues = z.infer<typeof customerRegistrationSchema>;

function CustomerRegistrationForm() {
    const router = useRouter();
    const { registerUser } = useAuth();
    const { toast } = useToast();
    
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerRegistrationSchema),
        defaultValues: { name: "", email: "", password: "" },
    });
    
    const onSubmit: SubmitHandler<CustomerFormValues> = async (data) => {
        try {
            await registerUser({
                email: data.email,
                password: data.password,
                name: data.name,
                role: 'customer'
            });

            toast({
                title: "تم إنشاء الحساب بنجاح!",
                description: "يمكنك الآن تسجيل الدخول.",
            });

            router.push('/login');

        } catch (error) {
             toast({
                variant: "destructive",
                title: "حدث خطأ أثناء التسجيل",
                description: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى.",
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                                <Input placeholder="مثال: علي محمد" {...field} className="bg-background/50" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="customer@example.com" {...field} className="bg-background/50" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} className="bg-background/50" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full !mt-6" size="lg" disabled={form.formState.isSubmitting}>
                     {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {form.formState.isSubmitting ? "جاري الإنشاء..." : "إنشاء حساب"}
                </Button>
                <p className="text-center text-sm text-muted-foreground pt-2">
                    لديك حساب بالفعل؟{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        تسجيل الدخول
                    </Link>
                </p>
            </form>
        </Form>
    )
}


export default function RegisterPage() {
  return (
    <div className="relative flex min-h-[90vh] items-center justify-center overflow-hidden py-12">
        <div className="absolute inset-0 h-full w-full bg-gradient-animation -z-10" />
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md px-4"
        >
            <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm border-white/20">
                    <TabsTrigger value="customer">حساب عميل</TabsTrigger>
                    <TabsTrigger value="store">حساب متجر</TabsTrigger>
                </TabsList>
                <TabsContent value="customer">
                    <Card className="bg-card/80 backdrop-blur-sm border-white/20 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold font-headline">إنشاء حساب عميل</CardTitle>
                        <CardDescription>
                            انضم إلينا وابدأ رحلة التسوق في سوق الجوال.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CustomerRegistrationForm />
                    </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="store">
                    <Card className="bg-card/80 backdrop-blur-sm border-white/20 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold font-headline">تسجيل متجرك</CardTitle>
                        <CardDescription>
                            انضم لمنصتنا وقم بزيادة مبيعاتك.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StoreRegistrationForm />
                    </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    </div>
  );
}
