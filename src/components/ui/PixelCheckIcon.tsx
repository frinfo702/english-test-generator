interface PixelCheckIconProps {
  size?: number;
}

/** Pixel-art check mark; inherits the surrounding text color. */
export function PixelCheckIcon({ size = 16 }: PixelCheckIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5.00977 13V17H1V13H5.00977Z" fill="currentColor" />
      <path d="M9.00977 17V21H5V17H9.00977Z" fill="currentColor" />
      <path d="M13.0098 21V25H9V21H13.0098Z" fill="currentColor" />
      <path d="M17.0098 17V21H13V17H17.0098Z" fill="currentColor" />
      <path d="M21.0098 13V17H17V13H21.0098Z" fill="currentColor" />
      <path d="M25.0098 9V13H21V9H25.0098Z" fill="currentColor" />
      <path d="M29.0098 5V9H25V5H29.0098Z" fill="currentColor" />
    </svg>
  );
}
