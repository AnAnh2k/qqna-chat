import type { Message } from "@/types/chat";
import { extractPlainTextFromHtml } from "./richText";

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const MAX_PREVIEW_LENGTH = 140;

const hasImage = (message: Pick<Message, "imgUrl" | "imgUrls">) =>
  Boolean(message.imgUrl || message.imgUrls?.length);

const cleanPreviewText = (value: string) =>
  value
    .replace(URL_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();

const truncatePreview = (value: string) => {
  if (value.length <= MAX_PREVIEW_LENGTH) return value;
  return `${value.slice(0, MAX_PREVIEW_LENGTH - 1).trimEnd()}...`;
};

export const getReplyPreviewText = (message: Message | null | undefined) => {
  if (!message) return "[Tin nhắn]";

  if (message.isRecalled) {
    return "Tin nhắn đã bị thu hồi";
  }

  if (message.messageType === "post") {
    const title = cleanPreviewText(message.title ?? "");
    if (title) {
      return `Bài viết: ${truncatePreview(title)}`;
    }

    const plainText = cleanPreviewText(
      extractPlainTextFromHtml(message.content ?? ""),
    );
    if (plainText) {
      return truncatePreview(plainText);
    }

    return hasImage(message) ? "Bài viết có ảnh" : "Bài viết";
  }

  const plainText = cleanPreviewText(message.content ?? "");
  if (plainText) {
    return truncatePreview(plainText);
  }

  return hasImage(message) ? "[Hình ảnh]" : "[Tin nhắn]";
};
