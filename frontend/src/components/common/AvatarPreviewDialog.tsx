import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

interface AvatarPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string | null;
  name: string;
}

const AvatarPreviewDialog = ({
  open,
  onOpenChange,
  imageUrl,
  name,
}: AvatarPreviewDialogProps) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[96vw]">
        <DialogTitle className="sr-only">Xem avatar {name}</DialogTitle>
        <div className="flex min-h-[82vh] items-center justify-center">
          <img
            src={imageUrl}
            alt={`Avatar ${name}`}
            className="h-auto max-h-[94vh] w-auto max-w-[96vw] rounded-2xl object-contain shadow-2xl sm:min-h-[620px]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPreviewDialog;
