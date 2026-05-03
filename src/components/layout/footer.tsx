
import { Store, Phone, Mail, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
      <div className="container mx-auto py-8 md:py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary p-2 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-primary font-headline">مركزي</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              منصة لإدارة المتاجر والصيدليات مع تركيز على تجربة تشغيل واضحة وبسيطة.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">للتواصل</span>
              </div>
              <p className="text-xs text-muted-foreground">+966 50 123 4567</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">البريد</span>
              </div>
              <p className="text-xs text-muted-foreground">support@markazi.com</p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} مركزي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
