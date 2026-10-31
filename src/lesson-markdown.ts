/**
 * The markdown subset a lesson is written in (epic #405). It lives on its own because both the
 * renderer and the widget components need it — a component renders its prose fields through it —
 * and neither should have to import the other to get it.
 */

import { escapeText } from "./html-escape.js";

/** True when the line closes a fence opened with `fence` — a run at least as long, and nothing else. */
export function closesFence(line: string, fence: string): boolean {
    const run: RegExpMatchArray | null = line.match(/^(`{3,})\s*$/);
    return run !== null && run[1].length >= fence.length;
}

/** Inline prose: emphasis, code spans and links, over already-escaped text. */
function renderInline(text: string): string {
    let out: string = escapeText(text);
    out = out.replace(/`([^`]+)`/g, (_m, code: string) => `<code>${code}</code>`);
    out = out.replace(/\*\*([^*]+)\*\*/g, (_m, s: string) => `<strong>${s}</strong>`);
    out = out.replace(/(^|[^*])\*([^*]+)\*/g, (_m, lead: string, s: string) => `${lead}<em>${s}</em>`);
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) =>
        `<a href="${href}">${label}</a>`);
    return out;
}

/**
 * The markdown subset a lesson is written in. It is deliberately small: every construct here has
 * one rendering, so two lessons authored months apart cannot come out shaped differently.
 *
 * `blockHook` lets a later stage claim a fenced block — the widget seam uses it — without this
 * function learning what a widget is.
 */
export function renderMarkdown(
    body: string,
    blockHook?: (info: string, content: string) => string | null,
): string {
    const lines: string[] = body.split("\n");
    const out: string[] = [];
    let paragraph: string[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;

    const flushParagraph = (): void => {
        if (paragraph.length === 0) return;
        out.push(`<p>${renderInline(paragraph.join(" ").trim())}</p>`);
        paragraph = [];
    };
    const flushList = (): void => {
        if (list === null) return;
        const tag: string = list.ordered ? "ol" : "ul";
        out.push(`<${tag}>`, ...list.items.map((i) => `<li>${renderInline(i)}</li>`), `</${tag}>`);
        list = null;
    };
    const flush = (): void => {
        flushParagraph();
        flushList();
    };

    for (let i = 0; i < lines.length; i++) {
        const line: string = lines[i];
        // A fence is closed by a run at least as long as the one that opened it, so a block can
        // quote text that itself contains a fence — a lesson showing a test is one such block.
        const fence: RegExpMatchArray | null = line.match(/^(`{3,})(.*)$/);
        if (fence !== null) {
            flush();
            const info: string = fence[2].trim();
            const content: string[] = [];
            i++;
            while (i < lines.length && !closesFence(lines[i], fence[1])) content.push(lines[i++]);
            const text: string = content.join("\n");
            const claimed: string | null = blockHook === undefined ? null : blockHook(info, text);
            out.push(claimed ?? `<pre><code>${escapeText(text)}\n</code></pre>`);
            continue;
        }
        const heading: RegExpMatchArray | null = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading !== null) {
            flush();
            const level: number = heading[1].length;
            out.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
            continue;
        }
        if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
            flush();
            out.push("<hr>");
            continue;
        }
        const quote: RegExpMatchArray | null = line.match(/^>\s?(.*)$/);
        if (quote !== null) {
            flush();
            out.push(`<blockquote>${renderInline(quote[1].trim())}</blockquote>`);
            continue;
        }
        const bullet: RegExpMatchArray | null = line.match(/^[-*]\s+(.*)$/);
        const numbered: RegExpMatchArray | null = line.match(/^\d+\.\s+(.*)$/);
        if (bullet !== null || numbered !== null) {
            flushParagraph();
            const ordered: boolean = numbered !== null;
            if (list !== null && list.ordered !== ordered) flushList();
            if (list === null) list = { ordered, items: [] };
            list.items.push((bullet ?? numbered)![1].trim());
            continue;
        }
        if (line.trim() === "") {
            flush();
            continue;
        }
        flushList();
        paragraph.push(line.trim());
    }
    flush();
    return out.join("\n");
}
