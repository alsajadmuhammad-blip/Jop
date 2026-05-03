
import { BackButton } from "@/components/layout/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <div className="flex items-center gap-4 mb-8">
        <BackButton />
        <h1 className="text-3xl font-headline font-bold">اتصل بنا</h1>
      </div>
      <Card>
        <CardHeader>
          <p className="text-center text-muted-foreground">
            لديك سؤال أو استفسار؟ املأ النموذج أدناه وسنعاود الاتصال بك في أقرب وقت ممكن.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" placeholder="اسمك الكامل" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">الموضوع</Label>
              <Input id="subject" placeholder="بخصوص..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea id="message" placeholder="اكتب رسالتك هنا..." rows={6} />
            </div>
            <Button type="submit" className="w-full" size="lg">إرسال الرسالة</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    