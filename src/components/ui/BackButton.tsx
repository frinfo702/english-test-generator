import { Button, type ButtonProps } from "./Button";

interface BackButtonProps extends Omit<ButtonProps, "children"> {
  label?: string;
}

export function BackButton({
  label = "Back to question list",
  ...props
}: BackButtonProps) {
  return (
    <Button aria-label={label} {...props}>
      ←
    </Button>
  );
}
