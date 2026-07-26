import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast";
import { useToast } from "./use-toast";

const VARIANT_ICON = {
    success: CheckCircle2,
    destructive: AlertCircle,
    default: Info,
} as const;

export function Toaster() {
    const { toasts } = useToast();
    return (
        <ToastProvider swipeDirection="right">
            {toasts.map(({ id, title, description, variant, ...props }) => {
                const Icon = VARIANT_ICON[variant ?? "default"] ?? VARIANT_ICON.default;
                const iconColor =
                    variant === "success"
                        ? "text-state-success"
                        : variant === "destructive"
                            ? "text-state-danger"
                            : "text-btn-primary";
                return (
                    <Toast key={id} variant={variant} {...props}>
                        <div className="flex flex-1 items-start gap-3">
                            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden />
                            <div className="grid flex-1 gap-0.5">
                                {title && <ToastTitle>{title}</ToastTitle>}
                                {description && <ToastDescription>{description}</ToastDescription>}
                            </div>
                        </div>
                        <ToastClose />
                    </Toast>
                );
            })}
            <ToastViewport />
        </ToastProvider>
    );
}
