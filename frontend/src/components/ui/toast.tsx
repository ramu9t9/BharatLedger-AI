import { toast as sonner } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
};

export function toast({ title, description, variant = "default" }: ToastProps) {
  const options = {
    default: { unstyled: false },
    success: { unstyled: false, className: "border-green-500" },
    error: { unstyled: false, className: "border-red-500" },
    warning: { unstyled: false, className: "border-yellow-500" },
  };

  if (variant === "error") {
    sonner.error(title, { description, ...options[variant] });
  } else if (variant === "warning") {
    sonner.warning(title, { description, ...options[variant] });
  } else if (variant === "success") {
    sonner.success(title, { description, ...options[variant] });
  } else {
    sonner(title, { description });
  }
}

export function useToast() {
  return { toast };
}
