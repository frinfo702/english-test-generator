import { Button, type ButtonProps } from "./Button";
import { PixelArrowIcon } from "./PixelArrowIcon";

interface BackButtonProps extends Omit<ButtonProps, "children"> {
  label?: string;
}

export function BackButton({
  label = "Back to question list",
  ...props
}: BackButtonProps) {
  return (
    <Button aria-label={label} {...props}>
      <PixelArrowIcon direction="left" />
    </Button>
  );
}
