interface PixelArrowIconProps {
  size?: number;
  direction?: "left" | "right";
}

/** Pixel-art arrow; inherits the surrounding text color. */
export function PixelArrowIcon({
  size = 16,
  direction = "right",
}: PixelArrowIconProps) {
  return (
    <svg
      width={size}
      height={size}
      style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 16.9987L3 12.999L18.9983 12.999L18.9983 9.00576L22.9985 9.00576L22.9985 13.0055H18.9983V16.9909H22.9985V20.9907H18.9983V16.9987H3Z"
        fill="currentColor"
      />
      <path
        d="M14.9994 8.99925V4.99951L18.9996 4.99951V8.99925L14.9994 8.99925Z"
        fill="currentColor"
      />
      <path
        d="M14.9993 24.9995L14.9993 20.9998H18.9996L18.9996 24.9995H14.9993Z"
        fill="currentColor"
      />
      <path
        d="M22.9998 16.9987V12.999L27 12.999V16.9987H22.9998Z"
        fill="currentColor"
      />
    </svg>
  );
}
