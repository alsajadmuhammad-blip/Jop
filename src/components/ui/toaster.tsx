
"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "./card"
import { CheckCircle, AlertTriangle, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { Button } from "./button"
import { CartSheet } from "../cart/cart-sheet"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, productImage, variant, ...props }) {
        if (variant === "destructive") {
          return (
            <Toast key={id} variant="destructive" {...props}>
              <div className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
              </div>
              <ToastClose />
            </Toast>
          );
        }

        return (
          <Toast key={id} {...props}>
             <Card className="border-none shadow-2xl bg-background/80 backdrop-blur-xl rounded-2xl w-full max-w-sm">
                <CardContent className="p-4 w-full">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500"/>
                            {title && <ToastTitle className="text-base font-bold font-headline">{title}</ToastTitle>}
                        </div>
                        <div className="flex gap-3">
                            {productImage && (
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                                    <Image src={productImage} alt="Product image" fill className="object-cover" />
                                </div>
                            )}
                            <div className="flex flex-col justify-center">
                                {description && (
                                    <ToastDescription className="text-sm text-muted-foreground">{description}</ToastDescription>
                                )}
                            </div>
                        </div>
                        {action}
                    </div>
                </CardContent>
             </Card>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
