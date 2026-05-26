const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const SAFE_URL_REGEX = /^(https?:|mailto:|tel:|\/)/i;
const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "I",
  "IMG",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

const ALLOWED_STYLE_PROPS = new Set([
  "font-style",
  "font-weight",
  "text-align",
  "text-decoration",
]);

const ALLOWED_TEXT_ALIGN_VALUES = new Set(["left", "center", "right", "justify"]);

const normalizeUrl = (value: string) =>
  value.startsWith("www.") ? `https://${value}` : value;

const sanitizeStyle = (styleValue: string | null) => {
  if (!styleValue) return "";

  const rules = styleValue
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [property, ...valueParts] = rule.split(":");
      const propertyName = property.trim().toLowerCase();
      const value = valueParts.join(":").trim();

      if (!ALLOWED_STYLE_PROPS.has(propertyName)) {
        return "";
      }

      if (!/^[\w\s#%().,-]+$/i.test(value)) {
        return "";
      }

      return `${propertyName}: ${value}`;
    })
    .filter(Boolean);

  return rules.join("; ");
};

const isSafeUrl = (value: string) => SAFE_URL_REGEX.test(value);

const sanitizeElement = (node: Element, document: Document): Node | null => {
  const tagName = node.tagName.toUpperCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    if (tagName === "SCRIPT" || tagName === "STYLE") {
      return null;
    }

    const fragment = document.createDocumentFragment();
    node.childNodes.forEach((child) => {
      const sanitizedChild = sanitizeNode(child, document);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    });
    return fragment;
  }

  const element = document.createElement(tagName.toLowerCase());

  if (tagName === "A") {
    const href = node.getAttribute("href");
    if (href && isSafeUrl(href.trim())) {
      element.setAttribute("href", normalizeUrl(href.trim()));
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noreferrer noopener");
    }
  }

  if (tagName === "IMG") {
    const src = node.getAttribute("src")?.trim();
    if (!src || !(src.startsWith("blob:") || src.startsWith("data:image/") || isSafeUrl(src))) {
      return null;
    }

    element.setAttribute("src", src);
    element.setAttribute("alt", node.getAttribute("alt") || "Ảnh bài viết");
    element.setAttribute("loading", "lazy");
    element.setAttribute("draggable", "false");
  }

  const styleRules = [sanitizeStyle(node.getAttribute("style"))].filter(Boolean);
  const align = node.getAttribute("align")?.trim().toLowerCase();

  if (
    align &&
    ALLOWED_TEXT_ALIGN_VALUES.has(align) &&
    !styleRules.some((rule) => /(?:^|;\s*)text-align\s*:/i.test(rule))
  ) {
    styleRules.push(`text-align: ${align}`);
  }

  if (styleRules.length > 0) {
    element.setAttribute("style", styleRules.join("; "));
  }

  node.childNodes.forEach((child) => {
    const sanitizedChild = sanitizeNode(child, document);
    if (sanitizedChild) {
      element.appendChild(sanitizedChild);
    }
  });

  return element;
};

const sanitizeNode = (node: ChildNode, document: Document): Node | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  return sanitizeElement(node as Element, document);
};

export const normalizeHtmlInput = (value: string) => {
  if (HTML_TAG_REGEX.test(value)) {
    return value;
  }

  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(/\n/g, "<br />");
};

export const sanitizeRichHtml = (html: string) => {
  if (typeof document === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = parsed.body.firstElementChild as HTMLElement | null;

  if (!root) {
    return "";
  }

  const safeContainer = document.createElement("div");
  root.childNodes.forEach((child) => {
    const sanitizedChild = sanitizeNode(child, document);
    if (sanitizedChild) {
      safeContainer.appendChild(sanitizedChild);
    }
  });

  return safeContainer.innerHTML;
};

export const linkifyRichHtml = (html: string) => {
  if (typeof document === "undefined") {
    return html;
  }

  const container = document.createElement("div");
  container.innerHTML = html;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
  );

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (!(current instanceof Text)) continue;
    const parentTag = current.parentElement?.tagName.toUpperCase();
    if (parentTag === "A") continue;
    textNodes.push(current);
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent ?? "";
    URL_REGEX.lastIndex = 0;
    if (!URL_REGEX.test(text)) {
      return;
    }

    URL_REGEX.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = URL_REGEX.exec(text))) {
      const start = match.index;
      const raw = match[0];
      const trailing = raw.match(/[.,!?;:)\]]+$/)?.[0] ?? "";
      const clean = trailing ? raw.slice(0, -trailing.length) : raw;

      if (start > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, start)),
        );
      }

      const anchor = document.createElement("a");
      anchor.href = normalizeUrl(clean);
      anchor.target = "_blank";
      anchor.rel = "noreferrer noopener";
      anchor.textContent = clean;
      fragment.appendChild(anchor);

      if (trailing) {
        fragment.appendChild(document.createTextNode(trailing));
      }

      lastIndex = start + raw.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  });

  return container.innerHTML;
};

export const formatRichPostHtml = (html: string) =>
  linkifyRichHtml(sanitizeRichHtml(normalizeHtmlInput(html)));

export const extractImageUrlsFromHtml = (html: string) => {
  if (typeof document === "undefined") {
    return [];
  }

  const parsed = new DOMParser().parseFromString(
    `<div>${html}</div>`,
    "text/html",
  );
  const root = parsed.body.firstElementChild as HTMLElement | null;
  if (!root) return [];

  return Array.from(root.querySelectorAll("img"))
    .map((img) => img.getAttribute("src")?.trim())
    .filter(
      (src): src is string =>
        !!src && (src.startsWith("http://") || src.startsWith("https://")),
    );
};

export const extractPlainTextFromHtml = (html: string) => {
  if (typeof document === "undefined") {
    return html;
  }

  const parsed = new DOMParser().parseFromString(
    `<div>${html}</div>`,
    "text/html",
  );
  const root = parsed.body.firstElementChild as HTMLElement | null;
  return root?.textContent ?? "";
};
