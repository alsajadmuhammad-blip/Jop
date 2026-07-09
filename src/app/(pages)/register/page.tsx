"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Store, UserRound, ArrowLeft } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { customerRegistrationSchema } from "@/lib/validations";

type CustomerFormValues = z.infer<typeof customerRegistrationSchema>;

function StoreRegistrationForm() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-background to-background p-5 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Store className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">إنشاء متجرك بخطوات بسيطة</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          اختر الباقة المناسبة وأكمل بيانات متجرك في صفحة مخصصة لذلك.
        </p>
      </div>

      <Link href="/create-store" className="block">
        <Button className="w-full gap-2" size="lg">
          <Store className="w-4 h-4" />
          فتح متجر جديد
          <ArrowLeft className="w-4 h-4 mr-auto" />
        </Button>
      </Link>

      <p className="text-xs text-center text-muted-foreground">
        ستختار الباقة وتكمل التسجيل في خطوة واحدة سلسة.
      </p>
    </div>
  );
}

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
        role: "customer",
      });

      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: "يمكنك الآن تسجيل الدخول.",
      });

      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ أثناء التسجيل",
        description: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى.",
      });
    }
  };

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
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  {...field}
                  className="bg-background/50"
                />
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

        <Button
          type="submit"
          className="w-full !mt-6 gap-2"
          size="lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <UserRound className="h-4 w-4" />
              إنشاء حساب
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-1">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </Form>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-[90vh] items-center justify-center overflow-hidden py-12">
      <div className="absolute inset-0 h-full w-full bg-gradient-animation -z-10" />
      <div
        className="w-full max-w-md px-4"
      >
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm border-white/20 mb-1">
            <TabsTrigger value="customer" className="gap-1.5">
              <UserRound className="w-4 h-4" />
              حساب عميل
            </TabsTrigger>
            <TabsTrigger value="store" className="gap-1.5">
              <Store className="w-4 h-4" />
              حساب متجر
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <Card className="bg-card/80 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold font-headline">إنشاء حساب عميل</CardTitle>
                <CardDescription>انضم إلينا وابدأ رحلة التسوق.</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerRegistrationForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store">
            <Card className="bg-card/80 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold font-headline">تسجيل متجرك</CardTitle>
                <CardDescription>انضم للمنصة وزد من مبيعاتك.</CardDescription>
              </CardHeader>
              <CardContent>
                <StoreRegistrationForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
