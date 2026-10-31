// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderStylesheet, renderWorkbook, type LessonSource } from "./workbook-render";
import { printPage, readPage } from "./workbook-page-fixtures";
import { PREDICT_THEN_REVEAL, PREDICT_THEN_REVEAL_COMPONENT } from "./predict-then-reveal";

const DECLARATION: string = [
    "component: predict-then-reveal",
    "data:",
    "  question: what does the drift check compare?",
    "  answer: the story's title and body, whitespace normalized",
].join("\n");

function lessonWith(declaration: string): LessonSource {
    return {
        file: "the-drift-check.md",
        source: [
            "---",
            "title: The drift check",
            "---",
            "",
            "Predict your answer before you see it.",
            "",
            "```widget",
            declaration,
            "```",
        ].join("\n"),
    };
}

function pageFor(declaration: string = DECLARATION) {
    const file = renderWorkbook({
        lessons: [lessonWith(declaration)],
        widgets: { [PREDICT_THEN_REVEAL_COMPONENT]: PREDICT_THEN_REVEAL },
    }).find((f) => f.name === "the-drift-check.html")!.contents;
    return readPage(file);
}

describe("predict-then-reveal is the first component in the shared library", () => {
    it("shows the question and hides the answer", () => {
        const page = pageFor();
        expect(page.visibleText).toContain("what does the drift check compare?");
        expect(page.visibleText).not.toContain("whitespace normalized");
        expect(page.text).toContain("whitespace normalized");
        expect(page.controls[0].showing).toBe(false);
    });

    it("reveals the answer through the control, and the control is the only path to it", () => {
        const page = pageFor();
        expect(page.controls).toHaveLength(1);
        expect(page.controls[0].content).toContain("whitespace normalized");
    });

    it("prints the question and the answer even when the learner never touched the control", () => {
        const file = renderWorkbook({
            lessons: [lessonWith(DECLARATION)],
            widgets: { [PREDICT_THEN_REVEAL_COMPONENT]: PREDICT_THEN_REVEAL },
        }).find((f) => f.name === "the-drift-check.html")!.contents;
        const printed = printPage(file, renderStylesheet());
        expect(printed.shows("what does the drift check compare?")).toBe(true);
        expect(printed.shows("whitespace normalized")).toBe(true);
    });

    it("renders the question and the answer as lesson markdown, so a fenced block becomes a code block", () => {
        const declaration: string = [
            "component: predict-then-reveal",
            "data:",
            '  question: "Suppose you run:\\n\\n```bash\\ncargo add --dev uuid\\n```\\n\\nWhat does `cargo build` do?\\n"',
            '  answer: "It fails.\\n\\nThe crate is under `[dev-dependencies]`.\\n"',
        ].join("\n");
        const file = renderWorkbook({
            lessons: [lessonWith(declaration)],
            widgets: { [PREDICT_THEN_REVEAL_COMPONENT]: PREDICT_THEN_REVEAL },
        }).find((f) => f.name === "the-drift-check.html")!.contents;
        expect(file).toContain("<pre><code>cargo add --dev uuid\n</code></pre>");
        expect(file).toContain("<p>What does <code>cargo build</code> do?</p>");
        expect(file).toContain("<p>It fails.</p>");
        expect(file).toContain("<p>The crate is under <code>[dev-dependencies]</code>.</p>");
        expect(file).not.toContain("```");
    });

    it("renders code that reads like markup inside a fenced block of the question or the answer", () => {
        const declaration: string = [
            "component: predict-then-reveal",
            "data:",
            '  question: "Given:\\n\\n```rust\\nfn f<T>(x: T) -> Vec<T>\\n```\\n\\nWhat compiles?\\n"',
            '  answer: "This does:\\n\\n```rust\\nlet v: Vec<u8> = f(1);\\n```\\n"',
        ].join("\n");
        const file = renderWorkbook({
            lessons: [lessonWith(declaration)],
            widgets: { [PREDICT_THEN_REVEAL_COMPONENT]: PREDICT_THEN_REVEAL },
        }).find((f) => f.name === "the-drift-check.html")!.contents;
        expect(file).toContain("<pre><code>fn f&lt;T&gt;(x: T) -&gt; Vec&lt;T&gt;\n</code></pre>");
        expect(file).toContain("<pre><code>let v: Vec&lt;u8&gt; = f(1);\n</code></pre>");
    });

    it("still refuses markup in the prose of the question or the answer, outside a fenced block", () => {
        for (const field of ["question", "answer"]) {
            const declaration: string = [
                "component: predict-then-reveal",
                "data:",
                `  ${field}: "Is <b>this</b> bold?\\n\\n\`\`\`text\\nplain\\n\`\`\`\\n"`,
                `  ${field === "question" ? "answer" : "question"}: plain`,
            ].join("\n");
            expect(() =>
                renderWorkbook({
                    lessons: [lessonWith(declaration)],
                    widgets: { [PREDICT_THEN_REVEAL_COMPONENT]: PREDICT_THEN_REVEAL },
                }),
            ).toThrow(/markup-in-lesson/);
        }
    });

    it("shows an answer written as a code span exactly, so asterisks in it are not emphasis", () => {
        const page = pageFor(
            ["component: predict-then-reveal", "data:", "  question: what is it?", '  answer: "`2*3*4 = 24`"'].join("\n"),
        );
        expect(page.text).toContain("2*3*4 = 24");
        expect(page.emphasised).toEqual([]);
    });

    it("escapes the question and the answer while rendering them", () => {
        const html: string = PREDICT_THEN_REVEAL.lead!({ question: "is 1 < 2 & 3 > 2?" });
        expect(html).toContain("is 1 &lt; 2 &amp; 3 &gt; 2?");
        expect(PREDICT_THEN_REVEAL.render({ answer: "`a<b>`" })).toContain("<code>a&lt;b&gt;</code>");
    });

    it("persists nothing about the learner: the same declaration renders the same page every time", () => {
        const first = pageFor();
        const second = pageFor();
        expect(first.text).toEqual(second.text);
    });
});
