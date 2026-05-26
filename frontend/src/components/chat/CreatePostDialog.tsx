import { useEffect, useRef, useState } from "react";
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
import { FileText, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import RichPostEditor, {
  type RichPostEditorHandle,
} from "./RichPostEditor";
import {
  extractImageUrlsFromHtml,
  extractPlainTextFromHtml,
  formatRichPostHtml,
} from "@/lib/richText";

interface CreatePostDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSend: (title: string, content: string, imgUrls: string[]) => Promise<void>;
  onUploadImage?: (file: File) => Promise<string>;
  initialTitle?: string;
  initialContent?: string;
  mode?: "create" | "edit";
}

const CreatePostDialog = ({
  open,
  setOpen,
  onSend,
  onUploadImage,
  initialTitle = "",
  initialContent = "",
  mode = "create",
}: CreatePostDialogProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef<RichPostEditorHandle>(null);
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setContent(initialContent);
    }
  }, [open, initialTitle, initialContent]);

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

    if (!trimmedTitle) {
      toast.warning("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    try {
      setSubmitting(true);

      const resolvedHtml =
        (await editorRef.current?.resolveHtml()) || content || "";
      const finalHtml = formatRichPostHtml(resolvedHtml);
      const plainText = extractPlainTextFromHtml(finalHtml).trim();
      const imgUrls = extractImageUrlsFromHtml(finalHtml);

      if (!plainText && imgUrls.length === 0) {
        toast.warning("Vui lòng nhập nội dung bài viết.");
        return;
      }

      await onSend(trimmedTitle, finalHtml, imgUrls);
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        isEditMode ? "Không thể cập nhật bài viết." : "Không thể đăng bài viết.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[72vw] bg-gradient-glass border-border/40 p-6 flex flex-col max-h-[90vh]">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <FileText className="size-5 text-primary" />
            <span>{isEditMode ? "Sửa Bài Viết" : "Soạn Bài Viết"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="space-y-1.5 shrink-0">
            <Label htmlFor="post-title" className="text-sm font-semibold text-foreground">
              Tiêu đề bài viết <span className="text-destructive">*</span>
            </Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề câu chuyện..."
              maxLength={100}
              className="glass-light border-border/30 h-10 text-sm font-medium"
              required
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="space-y-1.5 min-h-0 flex-1 flex flex-col overflow-hidden">
            <Label className="text-sm font-semibold text-foreground shrink-0">
              Nội dung chi tiết <span className="text-destructive">*</span>
            </Label>
            <RichPostEditor
              ref={editorRef}
              value={content}
              onChange={setContent}
              onUploadImage={onUploadImage}
              disabled={submitting}
              placeholder="Viết câu chuyện của bạn. Dán ảnh trực tiếp vào đây."
            />
          </div>

          <DialogFooter className="mt-2 shrink-0 flex gap-2 sm:justify-end">
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
              disabled={submitting || !title.trim()}
              className="bg-gradient-chat hover:shadow-glow hover:scale-[1.02] transition-smooth px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-1.5 text-white" />
                  {isEditMode ? "Lưu thay đổi" : "Gửi bài viết"}
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
