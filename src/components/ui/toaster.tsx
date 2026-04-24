import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast";
import { useToastStore } from "@/hooks/useToast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const toasts = useToastStore();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant}>
          <div className="flex items-start gap-2.5 w-full">
            {variant === "success" && (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-success" />
            )}
            {variant === "error" && (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
            )}
            {(!variant || variant === "default") && (
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <ToastTitle>{title}</ToastTitle>
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
