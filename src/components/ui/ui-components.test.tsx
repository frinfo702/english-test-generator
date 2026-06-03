import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { FeedbackPanel } from "./FeedbackPanel";
import { FloatingElapsedTimer } from "./FloatingElapsedTimer";
import { GradingRequestPanel } from "./GradingRequestPanel";
import { LoadingSpinner } from "./LoadingSpinner";
import { ProgressBar } from "./ProgressBar";
import { SpeedControl } from "./SpeedControl";
import { Timer } from "./Timer";

describe("ui components", () => {
  it("renders Button props through to the DOM", () => {
    render(
      <Button variant="danger" size="lg" className="extra" disabled>
        Delete
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeTruthy();
    expect(button).toHaveProperty("disabled", true);
    expect(button.className).toContain("extra");
  });

  it("renders Timer text and stateful classes", () => {
    const { rerender } = render(
      <Timer display="00:42" isWarning={false} isExpired={false} />,
    );
    const timer = screen.getByText("00:42");
    const baseClassName = timer.className;

    rerender(<Timer display="00:00" isWarning isExpired />);

    expect(screen.getByText("00:00").className).not.toBe(baseClassName);
  });

  it("renders ProgressBar label, count, and fill width", () => {
    const { container, rerender } = render(
      <ProgressBar current={5} total={10} label="Accuracy" />,
    );

    expect(screen.getByText("Accuracy")).toBeTruthy();
    expect(screen.getByText("5/10")).toBeTruthy();
    expect(container.querySelector("div[style]")?.getAttribute("style")).toContain(
      "width: 50%",
    );

    rerender(<ProgressBar current={3} total={0} />);
    expect(container.querySelector("div[style]")?.getAttribute("style")).toContain(
      "width: 0%",
    );
  });

  it("shows the default and custom spinner messages", () => {
    const { rerender } = render(<LoadingSpinner />);
    expect(screen.getByText("Generating question...")).toBeTruthy();

    rerender(<LoadingSpinner message="Loading question list..." />);
    expect(screen.getByText("Loading question list...")).toBeTruthy();
  });

  it("renders FeedbackPanel states", () => {
    const { rerender } = render(
      <FeedbackPanel correct explanation="Nice work" />,
    );
    expect(screen.getByText("Correct")).toBeTruthy();
    expect(screen.getByText("Nice work")).toBeTruthy();

    rerender(
      <FeedbackPanel
        correct={false}
        explanation="Review this point"
        correctAnswer="B"
      />,
    );
    expect(screen.getByText("Incorrect")).toBeTruthy();
    expect(screen.getByText("Correct answer:")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
  });

  it("renders and updates GradingRequestPanel branches", () => {
    const onCopy = vi.fn();
    const { container, rerender } = render(
      <GradingRequestPanel
        saving={false}
        error={null}
        message={null}
        copied={false}
        onCopy={onCopy}
      />,
    );

    expect(container.textContent).toBe("");

    rerender(
      <GradingRequestPanel
        saving
        error="Copy failed"
        message="Grade me"
        copied={false}
        onCopy={onCopy}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy Text" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Saving your response locally...")).toBeTruthy();
    expect(screen.getByText("Copy failed")).toBeTruthy();
    expect(screen.getByText("Grade me")).toBeTruthy();

    rerender(
      <GradingRequestPanel
        saving={false}
        error={null}
        message="Grade me"
        copied
        onCopy={onCopy}
      />,
    );
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("lets the user change playback speed from presets and slider", () => {
    const onChange = vi.fn();
    render(
      <SpeedControl playbackRate={1} onChange={onChange} showSlider min={0.8} max={1.4} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fast" }));
    expect(onChange).toHaveBeenCalledWith(1.2);

    fireEvent.change(screen.getByRole("slider"), {
      target: { value: "1.4" },
    });
    expect(onChange).toHaveBeenCalledWith(1.4);
  });

  it("renders FloatingElapsedTimer as a live timer", () => {
    render(<FloatingElapsedTimer display="03:21" running={false} />);

    expect(screen.getByRole("timer").textContent).toContain("TIME");
    expect(screen.getByRole("timer").textContent).toContain("03:21");
  });
});
