import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { parseBlocks } from "../../lib/prose";
import { Prose } from "./Prose";

afterEach(cleanup);

it("splits an AI reply into headings, paragraphs and lists", () => {
  expect(
    parseBlocks(
      "Thanks.\n\n## Evaluation\n\n**Task:** none\nof it.\n\n1. Cover all points.\n2. Be specific.\n- a\n- b",
    ),
  ).toEqual([
    { kind: "p", text: "Thanks." },
    { kind: "heading", text: "Evaluation" },
    { kind: "p", text: "**Task:** none of it." },
    { kind: "ol", items: ["Cover all points.", "Be specific."] },
    { kind: "ul", items: ["a", "b"] },
  ]);
});

it("renders bold and italic without the asterisks", () => {
  const { container } = render(
    <Prose text="**Task completion:** a *quiet* `code` start" />,
  );
  expect(screen.getByText("Task completion:").tagName).toBe("STRONG");
  expect(screen.getByText("quiet").tagName).toBe("EM");
  expect(container.textContent).not.toContain("*");
});
