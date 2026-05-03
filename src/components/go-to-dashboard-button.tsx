
"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface GoToDashboardButtonProps {
  ownerId: string;
}

export function GoToDashboardButton({ ownerId }: GoToDashboardButtonProps) {
  const { user } = useAuth();

  // Show the button only if there is a logged-in user, and that user's ID matches the store's ownerId
  if (!user || user.id !== ownerId) {
    return null;
  }

  return (
    <div className="mt-4">
      <Button asChild variant="outline" size="lg" className="w-full">
        <Link href="/dashboard/store">
          <LayoutDashboard className="ml-2 h-4 w-4" />
          الذهاب إلى لوحة التحكم
        </Link>
      </Button>
    </div>
  );
}
