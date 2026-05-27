import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "../ui/button";
import {
  Bold,
  AlignCenter,
  AlignLeft,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  Underline,
} from "lucide-react";
import { toast } from "sonner";
import {
  extractPlainTextFromHtml,
  formatRichPostHtml,
  normalizeHtmlInput,
} from "@/lib/richText";
import { cn } from "@/lib/utils";
import type { ChangeEvent, ClipboardEvent } from "react";

export interface RichPostEditorHandle {
  resolveHtml: () => Promise<string>;
  focus: () => void;
}

interface RichPostEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const normalizeUrl = (value: string) =>
  value.startsWith("www.") ? `https://${value}` : value;

const RichPostEditor = forwardRef<RichPostEditorHandle, RichPostEditorProps>(
  (
    {
      value,
      onChange,
      onUploadImage,
      disabled = false,
      placeholder = "Bắt đầu viết câu chuyện của bạn...",
      className,
    },
    ref,
  ) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobFilesRef = useRef<Map<string, File>>(new Map());
  const uploadPromisesRef = useRef<Map<string, Promise<void>>>(new Map());
  const [isFocused, setIsFocused] = useState(false);

  const normalizedValue = useMemo(() => normalizeHtmlInput(value), [value]);
  const isEmpty = useMemo(() => {
    const text = extractPlainTextFromHtml(normalizedValue).trim();
    return text.length === 0 && !/<img\b/i.test(normalizedValue);
  }, [normalizedValue]);

  const syncDomFromValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement === editor) return;

    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  };

  useEffect(() => {
    syncDomFromValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedValue]);

  useEffect(() => {
    return () => {
      blobFilesRef.current.forEach((_file, blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      blobFilesRef.current.clear();
    };
  }, []);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(editor.innerHTML);
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const insertHtml = (html: string) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    emitChange();
  };

  const replaceBlobImage = (blobUrl: string, finalUrl: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const images = Array.from(editor.querySelectorAll("img"));
    const target = images.find(
      (img) =>
        img.getAttribute("src") === blobUrl ||
        img.getAttribute("data-blob-src") === blobUrl,
    );

    if (!target) return;

    target.setAttribute("src", finalUrl);
    target.removeAttribute("data-blob-src");
    target.removeAttribute("data-uploading");
    emitChange();
  };

  const uploadBlobImage = async (blobUrl: string, file: File) => {
    if (!onUploadImage) return;

    try {
      const uploadedUrl = await onUploadImage(file);
      replaceBlobImage(blobUrl, uploadedUrl);
      URL.revokeObjectURL(blobUrl);
      blobFilesRef.current.delete(blobUrl);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải ảnh dán lên.");
    }
  };

  const insertImageFile = async (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    blobFilesRef.current.set(blobUrl, file);
    insertHtml(
      `<img src="${blobUrl}" data-blob-src="${blobUrl}" data-uploading="true" alt="Ảnh dán" />`,
    );
    const uploadPromise = uploadBlobImage(blobUrl, file).finally(() => {
      uploadPromisesRef.current.delete(blobUrl);
    });

    uploadPromisesRef.current.set(blobUrl, uploadPromise);
    await uploadPromise;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) {
      return;
    }

    for (const file of files) {
      void insertImageFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items || disabled) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0) {
      return;
    }

    e.preventDefault();
    for (const file of imageFiles) {
      void insertImageFile(file);
    }
  };

  const applyCommand = (command: string, value?: string) => {
    if (disabled) return;
    focusEditor();
    document.execCommand(command, false, value);
    emitChange();
  };

  const handleLink = () => {
    if (disabled) return;

    const rawUrl = window.prompt("Nhập đường link");
    if (!rawUrl?.trim()) return;

    const url = normalizeUrl(rawUrl.trim());
    focusEditor();
    document.execCommand("createLink", false, url);
    emitChange();
  };

  const handleHeading = (tag: "H1" | "H2" | "H3" | "H4") => {
    applyCommand("formatBlock", tag);
  };

  useImperativeHandle(
    ref,
    () => ({
      resolveHtml: async () => {
        const editor = editorRef.current;
        if (!editor) return "";

        const pendingImages = Array.from(editor.querySelectorAll("img")).filter(
          (img) => {
            const src = img.getAttribute("src") || "";
            return src.startsWith("blob:") || img.hasAttribute("data-uploading");
          },
        );

        for (const image of pendingImages) {
          const blobUrl = image.getAttribute("src") || "";
          const pendingUpload = uploadPromisesRef.current.get(blobUrl);
          if (pendingUpload) {
            await pendingUpload;
          }

          if (!image.getAttribute("src")?.startsWith("blob:")) {
            continue;
          }

          const file = blobFilesRef.current.get(blobUrl);

          if (!file || !onUploadImage) continue;

          try {
            const uploadedUrl = await onUploadImage(file);
            image.setAttribute("src", uploadedUrl);
            image.removeAttribute("data-blob-src");
            image.removeAttribute("data-uploading");
            URL.revokeObjectURL(blobUrl);
            blobFilesRef.current.delete(blobUrl);
          } catch (error) {
            console.error(error);
            toast.error("Không thể tải ảnh dán lên.");
          }
        }

        const finalHtml = editor.innerHTML;
        onChange(finalHtml);
        return formatRichPostHtml(finalHtml);
      },
      focus: focusEditor,
    }),
    [onChange, onUploadImage],
  );

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/40 bg-muted/30 p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleHeading("H1")}
          disabled={disabled}
          title="Tiêu đề lớn"
        >
          <Heading1 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleHeading("H2")}
          disabled={disabled}
          title="Tiêu đề vừa"
        >
          <Heading2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleHeading("H3")}
          disabled={disabled}
          title="Tiêu đề nhỏ"
        >
          <Heading3 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleHeading("H4")}
          disabled={disabled}
          title="Tiêu đề phụ"
        >
          <Heading4 className="size-4" />
        </Button>

        <span className="mx-1 h-6 w-px bg-border/60" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("bold")}
          disabled={disabled}
          title="Đậm"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("italic")}
          disabled={disabled}
          title="Nghiêng"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("underline")}
          disabled={disabled}
          title="Gạch chân"
        >
          <Underline className="size-4" />
        </Button>

        <span className="mx-1 h-6 w-px bg-border/60" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("justifyLeft")}
          disabled={disabled}
          title="Căn trái"
        >
          <AlignLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("justifyCenter")}
          disabled={disabled}
          title="Căn giữa"
        >
          <AlignCenter className="size-4" />
        </Button>

        <span className="mx-1 h-6 w-px bg-border/60" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleLink}
          disabled={disabled}
          title="Chèn link"
        >
          <Link2 className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Chèn ảnh"
        >
          <ImagePlus className="size-4" />
        </Button>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl border border-border/40 bg-background/95 shadow-sm">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emitChange}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "h-full min-h-[320px] max-h-[56vh] w-full overflow-y-auto px-4 py-4 text-sm leading-7 outline-none beautiful-scrollbar",
            "[&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-tight",
            "[&_h2]:mb-2.5 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight",
            "[&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold",
            "[&_h4]:mb-1.5 [&_h4]:text-lg [&_h4]:font-semibold",
            "[&_p]:mb-3 [&_p]:min-h-[1.75rem]",
            "[&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
            "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:cursor-zoom-in",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic",
            disabled && "cursor-not-allowed opacity-70",
          )}
        />

        {isEmpty && !isFocused && (
          <div className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>
    </div>
    );
  },
);

RichPostEditor.displayName = "RichPostEditor";

export default RichPostEditor;
