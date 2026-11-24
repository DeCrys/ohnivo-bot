import Link from "next/link";
import { cn } from "@/lib/utils";

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
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-spark-400 to-ember-500 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M12 2.5c1.7 3.6 5.5 5.6 5.5 10a5.5 5.5 0 1 1-11 0c0-2.3 1.1-3.9 2.4-5.4.5 1.6 1.3 2.4 2.2 2.9.4-2.7.5-4.9.9-7.5Z"
            fill="white"
          />
          <path
            d="M12 11.5c1 1.5 2.6 2.4 2.6 4.2a2.6 2.6 0 1 1-5.2 0c0-1.3.8-2.1 1.6-3 .2.9.6 1.3 1 1.6 0-1 0-1.8 0-2.8Z"
            fill="#7450F5"
            opacity="0.55"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-lg font-semibold tracking-tight text-white">
          ohnivo<span className="text-spark-400">.</span>
        </span>
      ) : null}
    </Link>
  );
}
