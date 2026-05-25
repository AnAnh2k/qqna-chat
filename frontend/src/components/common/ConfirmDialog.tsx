import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, type LucideIcon } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  icon?: LucideIcon;
  onConfirm: () => void | Promise<void>;
};

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "default",
  loading = false,
  icon: Icon = AlertTriangle,
  onConfirm,
}: ConfirmDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        showCloseButton={!loading}
        className="overflow-hidden border border-border/40 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md"
      >
        <div className="p-6">
          <DialogHeader className="items-center text-center">
            <div
              className={
                variant === "destructive"
                  ? "mb-2 flex size-12 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive"
                  : "mb-2 flex size-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"
              }
            >
              <Icon className="size-6" />
            </div>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription className="max-w-sm leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="m-0 border-t border-border/50 bg-muted/40 p-4 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="min-w-28"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className="min-w-28"
          >
            {loading ? "Đang xử lý..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
