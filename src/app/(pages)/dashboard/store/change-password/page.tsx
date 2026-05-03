"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Lock } from "lucide-react";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (authError) throw authError;

      // Update firstLogin flag in users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ firstLogin: false })
        .eq('id', user.id);

      if (dbError) throw dbError;

      toast({
        title: "تم تغيير كلمة المرور بنجاح",
        description: "سيتم توجيهك إلى لوحة التحكم الخاصة بمتجرك.",
      });

      // Redirect to store dashboard
      router.push('/dashboard/store');
    } catch (error: any) {
      toast({
        title: "فشل في تغيير كلمة المرور",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">تغيير كلمة المرور</CardTitle>
          <CardDescription>
            مرحباً بك في متجرك! يرجى تغيير كلمة المرور الافتراضية لضمان أمان حسابك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أدخل كلمة مرور جديدة"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تأكيد كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أعد إدخال كلمة المرور"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تغيير كلمة المرور ومتابعة
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={logout}
              className="w-full"
            >
              تسجيل الخروج
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}