
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({ className, href }: { className?: string; href?: string }) {
  const router = useRouter();
  const buttonClasses = cn("h-10 w-10 rounded-full bg-background/50 backdrop-blur-sm", className);

  if (href) {
    return (
      <Button asChild variant="outline" size="icon" className={buttonClasses}>
        <Link href={href}>
          <ArrowRight className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={buttonClasses}
      onClick={() => router.back()}
    >
      <ArrowRight className="h-5 w-5" />
      <span className="sr-only">Go back</span>
    </Button>
  );
}

    