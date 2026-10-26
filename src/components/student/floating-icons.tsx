import {
  Code2,
  Cpu,
  Lightbulb,
  Monitor,
  MousePointer2,
  Wifi,
  Keyboard,
  Binary,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tile = {
  icon: LucideIcon;
  color: string;
  pos: string;
  size: "sm" | "md" | "lg";
  rotate: number;
  delay: number;
  duration: number;
  mobile?: boolean;
};

// Positions sit in the empty bands of each layout; only `mobile` tiles stay
// visible on narrow screens, the rest appear from lg up.
const SPLIT_TILES: Tile[] = [
  { icon: Code2, color: "bg-primary", pos: "left-[50%] top-[5%]", size: "lg", rotate: -10, delay: 0, duration: 6 },
  { icon: Lightbulb, color: "bg-amber-400", pos: "right-[4%] top-[3%]", size: "md", rotate: 12, delay: 1.2, duration: 7, mobile: true },
  { icon: Cpu, color: "bg-teal-500", pos: "left-[55%] top-[36%]", size: "sm", rotate: 8, delay: 0.6, duration: 6.5 },
  { icon: MousePointer2, color: "bg-rose-500", pos: "left-[56%] bottom-[24%]", size: "sm", rotate: -14, delay: 2, duration: 5.5 },
  { icon: Wifi, color: "bg-violet-500", pos: "left-[22%] top-[4%]", size: "sm", rotate: 6, delay: 1.6, duration: 7.5 },
  { icon: Monitor, color: "bg-sky-500", pos: "right-[16%] bottom-[3%]", size: "sm", rotate: -6, delay: 0.3, duration: 6.8 },
  { icon: Keyboard, color: "bg-emerald-500", pos: "left-[10%] bottom-[4%]", size: "sm", rotate: 10, delay: 2.4, duration: 7.2 },
  { icon: Binary, color: "bg-orange-500", pos: "left-[42%] bottom-[5%]", size: "sm", rotate: -8, delay: 1, duration: 6.2 },
];

const CENTER_TILES: Tile[] = [
  { icon: Code2, color: "bg-primary", pos: "left-[4%] top-[12%]", size: "lg", rotate: -10, delay: 0, duration: 6, mobile: true },
  { icon: Lightbulb, color: "bg-amber-400", pos: "right-[6%] top-[8%]", size: "md", rotate: 12, delay: 1.2, duration: 7, mobile: true },
  { icon: Cpu, color: "bg-teal-500", pos: "left-[10%] bottom-[14%]", size: "md", rotate: 8, delay: 0.6, duration: 6.5 },
  { icon: MousePointer2, color: "bg-rose-500", pos: "right-[12%] bottom-[18%]", size: "sm", rotate: -14, delay: 2, duration: 5.5 },
  { icon: Wifi, color: "bg-violet-500", pos: "left-[46%] top-[4%]", size: "sm", rotate: 6, delay: 1.6, duration: 7.5 },
  { icon: Monitor, color: "bg-sky-500", pos: "right-[30%] bottom-[6%]", size: "sm", rotate: -6, delay: 0.3, duration: 6.8 },
  { icon: Keyboard, color: "bg-emerald-500", pos: "left-[28%] bottom-[4%]", size: "sm", rotate: 10, delay: 2.4, duration: 7.2 },
  { icon: Binary, color: "bg-orange-500", pos: "right-[2%] top-[46%]", size: "sm", rotate: -8, delay: 1, duration: 6.2 },
];

const SIZES = {
  sm: "size-10 rounded-xl [&_svg]:size-5",
  md: "size-12 rounded-2xl [&_svg]:size-6",
  lg: "size-14 rounded-2xl [&_svg]:size-7",
};

export function FloatingIcons({
  className,
  dim = false,
  layout = "center",
}: {
  className?: string;
  dim?: boolean;
  layout?: "center" | "split";
}) {
  const tiles = layout === "split" ? SPLIT_TILES : CENTER_TILES;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10", className)}>
      {tiles.map((t, i) => {
        const Icon = t.icon;
        return (
          <div
            key={i}
            className={cn(
              "anim-float absolute flex items-center justify-center text-white shadow-lg",
              t.color,
              t.pos,
              SIZES[t.size],
              dim ? "opacity-60" : "opacity-90",
              !t.mobile && "hidden lg:flex"
            )}
            style={
              {
                "--r": `${t.rotate}deg`,
                "--d": `${t.delay}s`,
                "--dur": `${t.duration}s`,
              } as React.CSSProperties
            }
          >
            <Icon strokeWidth={2.25} />
          </div>
        );
      })}
    </div>
  );
}
