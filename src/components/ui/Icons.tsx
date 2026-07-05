import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function icon(size: number, d: string, props?: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

export function ArrowLeftIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(s, "M19 12H5m0 0 7-7m-7 7 7 7", props);
}

export function ArrowRightIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(s, "M5 12h14m0 0-7-7m7 7-7 7", props);
}

export function CheckIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(s, "M5 13l4 4L19 7", props);
}

export function ChevronRightIcon(props?: IconProps) {
  const s = props?.size ?? 16;
  return icon(s, "m9 18 6-6-6-6", props);
}

export function ClockIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(s, "M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", props);
}

export function BarChartIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(s, "M3 3v18h18m-3-4V9m-5 8v-3m-5 5v-6", props);
}

export function TargetIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    props,
  );
}

export function ZapIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(s, "M13 2 3 14h9l-1 8 10-12h-9l1-8Z", props);
}

export function BookOpenIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(
    s,
    "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zm20 0h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
    props,
  );
}

export function HeadphonesIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(
    s,
    "M3 14v3a4 4 0 0 0 4 4h1v-7H4a1 1 0 0 0-1 1Zm18 0v3a4 4 0 0 1-4 4h-1v-7h3a1 1 0 0 1 1 1Z",
    props,
  );
}

export function MicIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(
    s,
    "M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3Zm-2 13h4m-2 0v4m-7-4a7 7 0 0 0 14 0",
    props,
  );
}

export function PenIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(
    s,
    "M12 20h9m-4.222-15.328a2.1 2.1 0 1 1 2.97 2.97L7.5 20H4v-3.5L16.778 4.672Z",
    props,
  );
}

export function SparklesIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0Z",
    props,
  );
}

export function RefreshCwIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M21 2v6h-6M3 22v-6h6M3.05 17.09A10 10 0 0 1 17.09 3.05M20.95 6.91A10 10 0 0 1 6.91 20.95",
    props,
  );
}

export function TrashIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14",
    props,
  );
}

export function HomeIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(
    s,
    "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    props,
  );
}

export function PlayIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(s, "M6 4v16l14-8L6 4Z", props);
}

export function PauseIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(s, "M6 4h4v16H6V4Zm8 0h4v16h-4V4Z", props);
}

export function VolumeIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M11 5 6 9H2v6h4l5 4V5Zm8.6 3.4a6 6 0 0 1 0 7.2M15 10a3 3 0 0 1 0 4",
    props,
  );
}

export function ShieldIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    props,
  );
}

export function SearchIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z",
    props,
  );
}

export function XIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(s, "M18 6 6 18M6 6l12 12", props);
}

export function MoreHorizontalIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    props,
  );
}

export function LayoutDashboardIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z",
    props,
  );
}

export function GraduationCapIcon(props?: IconProps) {
  const s = props?.size ?? 20;
  return icon(
    s,
    "M22 10.5 12 16 2 10.5 12 5l10 5.5ZM5.5 12.5v3a6.5 6.5 0 1 0 13 0v-3",
    props,
  );
}

export function ExternalLinkIcon(props?: IconProps) {
  const s = props?.size ?? 16;
  return icon(
    s,
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3",
    props,
  );
}

export function FlameIcon(props?: IconProps) {
  const s = props?.size ?? 18;
  return icon(
    s,
    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z",
    props,
  );
}
