import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// jsdom has no layout engine, so these load the real stylesheets and check
// the cascaded styles that keep page content clear of error banners.

const read = (file: string) => readFileSync(file, "utf8");

const cssModules = readdirSync("src", { recursive: true, encoding: "utf8" })
  .filter((f) => f.endsWith(".module.css"))
  .map((f) => join("src", f));

// jsdom drops rules it can't parse, and `:global()` is CSS Modules syntax.
const unwrapGlobal = (css: string) => css.replace(/:global\(([^)]+)\)/g, "$1");

function loadStylesheet(file: string) {
  const style = document.createElement("style");
  style.textContent = unwrapGlobal(read(file));
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
  it("separates the shared error banner from the content below", () => {
    loadStylesheet("src/styles/global.css");
    const banner = render('<div class="notice-error" data-probe></div>');
    expect(getComputedStyle(banner).marginBottom).not.toMatch(/^(0px)?$/);
  });

  it("leaves no page module with its own boxed error banner", () => {
    const probe = '<div class="error" data-probe></div>';
    const unstyled = getComputedStyle(render(probe)).background;
    for (const file of cssModules) {
      loadStylesheet(file);
      expect(getComputedStyle(render(probe)).background, file).toBe(unstyled);
      document.head.innerHTML = "";
    }
  });

  it("leaves banners inside a card to the card's own gap", () => {
    for (const file of [
      "src/pages/toefl/speaking/ListenRepeatPage.module.css",
      "src/pages/toefl/speaking/TakeInterviewPage.module.css",
    ]) {
      loadStylesheet("src/styles/global.css");
      loadStylesheet(file);
      const banner = render(
        '<div class="card"><div class="notice-error" data-probe></div></div>',
      );
      expect(getComputedStyle(banner).marginBottom, file).toBe("0px");
      document.head.innerHTML = "";
    }
  });
});
