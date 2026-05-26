import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { FileText, Send, X } from "lucide-react";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSend: (title: string, content: string) => Promise<void>;
}

const CreatePostDialog = ({ open, setOpen, onSend }: CreatePostDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTitle("");
      setContent("");
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      toast.warning("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    if (!trimmedContent) {
      toast.warning("Vui lòng nhập nội dung bài viết.");
      return;
    }

    try {
      setSubmitting(true);
      await onSend(trimmedTitle, trimmedContent);
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Không thể đăng bài viết.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[50vw] bg-gradient-glass border-border/40 p-6 flex flex-col max-h-[85vh]">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <FileText className="size-5 text-primary" />
            <span>Soạn Thảo Bài Viết / Câu Chuyện</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Tiêu đề */}
          <div className="space-y-1.5 shrink-0">
            <Label htmlFor="post-title" className="text-sm font-semibold text-foreground">
              Tiêu đề bài viết <span className="text-destructive">*</span>
            </Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề câu chuyện ngắn gọn..."
              maxLength={100}
              className="glass-light border-border/30 h-10 text-sm font-medium"
              required
              disabled={submitting}
              autoFocus
            />
          </div>

          {/* Nội dung */}
          <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
            <Label htmlFor="post-content" className="text-sm font-semibold text-foreground shrink-0">
              Nội dung chi tiết <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết câu chuyện hoặc nội dung bài viết của bạn ở đây... (Bạn có thể nhấn Enter để xuống dòng thoải mái)"
              className="flex-1 glass-light border-border/30 resize-none p-3 text-sm beautiful-scrollbar min-h-[150px]"
              required
              disabled={submitting}
            />
            <p className="text-[10px] text-muted-foreground text-right shrink-0">
              Ký tự: {content.length}
            </p>
          </div>

          <DialogFooter className="mt-4 shrink-0 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className="hover:bg-muted"
            >
              <X className="size-4 mr-1.5" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="bg-gradient-chat hover:shadow-glow hover:scale-[1.02] transition-smooth px-5"
            >
              {submitting ? (
                "Đang gửi..."
              ) : (
                <>
                  <Send className="size-4 mr-1.5 text-white" />
                  Gửi bài viết
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
