import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark: a bare lavender flame with a light-weight wordmark. No tile, no
 * gradient, no glow - the same mark the landing pages and the app shell use.
 */
export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link href={href} className={cn("focus-ring group inline-flex min-h-[44px] items-center gap-2 rounded-control", className)}>
      <span className="relative grid h-6 w-6 place-items-center">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path
            d="M12 2.5c1.7 3.6 5.5 5.6 5.5 10a5.5 5.5 0 1 1-11 0c0-2.3 1.1-3.9 2.4-5.4.5 1.6 1.3 2.4 2.2 2.9.4-2.7.5-4.9.9-7.5Z"
            fill="#A98FFF"
          />
          <path
            d="M12 11.5c1 1.5 2.6 2.4 2.6 4.2a2.6 2.6 0 1 1-5.2 0c0-1.3.8-2.1 1.6-3 .2.9.6 1.3 1 1.6 0-1 0-1.8 0-2.8Z"
            fill="#050506"
            opacity="1"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-[19px] font-medium tracking-tight text-chalk">
          ohnivo
          <span className="text-spark-300">.</span>
        </span>
      ) : null}
    </Link>
  );
}
