import { PixelArt } from "./PixelArt";
import { PIXEL_ICONS, type PixelIconName } from "./pixelIcons";

interface PixelIconProps {
  name: PixelIconName;
  className?: string;
}

export function PixelIcon({ name, className }: PixelIconProps) {
  const icon = PIXEL_ICONS[name];
  return (
    <PixelArt
      className={className}
      layers={[icon.rows]}
      palette={icon.palette}
      width={16}
      height={16}
    />
  );
}
