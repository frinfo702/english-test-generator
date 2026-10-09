import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// jsdom has no layout engine, so these load the real stylesheets and check
// the cascaded styles that keep page content clear of the sticky header and
// of error banners.

const read = (file: string) => readFileSync(file, "utf8");

const pageModules = [
  ...readdirSync("src/pages", { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".module.css"))
    .map((f) => join("src/pages", f)),
  "src/components/question/QuestionSelectorPage.module.css",
];

function loadStylesheet(file: string) {
  const style = document.createElement("style");
  style.textContent = read(file);
  document.head.append(style);
}

function render(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body.querySelector("[data-probe]") as HTMLElement;
}

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("page layout", () => {
  it("offsets every viewport scroll by the sticky header", () => {
    loadStylesheet("src/styles/global.css");
    expect(
      getComputedStyle(document.documentElement).scrollPaddingTop,
    ).toContain("var(--header-height)");
  });

  it("defines the notice gap token", () => {
    loadStylesheet("src/styles/variables.css");
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--notice-gap")
        .trim(),
    ).toBe("var(--spacing-8)");
  });

  it("separates boxed page error banners from the content below", () => {
    const unstyled = getComputedStyle(
      render('<div class="error" data-probe></div>'),
    ).background;
    let boxed = 0;
    for (const file of pageModules) {
      loadStylesheet(file);
      const banner = render('<div class="error" data-probe></div>');
      const style = getComputedStyle(banner);
      // Plain error text (no box) is spaced by its container.
      if (style.background !== unstyled) {
        boxed++;
        expect(style.marginBottom, file).toBe("var(--notice-gap)");
      }
      document.head.innerHTML = "";
    }
    expect(boxed).toBeGreaterThan(10);
  });

  it("leaves banners inside a card to the card's own gap", () => {
    for (const file of [
      "src/pages/toefl/speaking/ListenRepeatPage.module.css",
      "src/pages/toefl/speaking/TakeInterviewPage.module.css",
    ]) {
      loadStylesheet(file);
      const banner = render(
        '<div class="card"><div class="error" data-probe></div></div>',
      );
      expect(getComputedStyle(banner).marginBottom, file).toBe("0px");
      document.head.innerHTML = "";
    }
  });
});
