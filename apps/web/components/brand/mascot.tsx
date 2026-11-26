"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Jiskřík - the original Ohnivo mascot. A small ember sprite made of violet
 * and cyan flame. Drawn in SVG so it stays crisp and needs no external asset.
 */
export function Mascot({
  className,
  floating = true,
  withSparkles = true,
}: {
  className?: string;
  floating?: boolean;
  withSparkles?: boolean;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const t = useTranslations("common");
  const bodyId = `mascot-body-${uid}`;
  const coreId = `mascot-core-${uid}`;
  const glowId = `mascot-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 240 240"
      className={cn("h-40 w-40", className)}
      role="img"
      aria-label={t("mascotAlt")}
    >
      <defs>
        <radialGradient id={bodyId} cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#8B6BFF" />
          <stop offset="52%" stopColor="#7450F5" />
          <stop offset="100%" stopColor="#3A238F" />
        </radialGradient>
        <radialGradient id={coreId} cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#BDF1FF" />
          <stop offset="55%" stopColor="#54C7FF" />
          <stop offset="100%" stopColor="#22A8F0" stopOpacity="0.65" />
        </radialGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="120" cy="215" rx="52" ry="10" fill="#000" opacity="0.35" />

      <g className={floating ? "animate-float motion-reduce:animate-none" : undefined}>
        <path
          d="M120 30 C 139 66, 177 88, 177 145 C 177 189, 152 210, 120 210 C 88 210, 63 189, 63 145 C 63 88, 101 66, 120 30 Z"
          fill={`url(#${bodyId})`}
          filter={`url(#${glowId})`}
          opacity="0.55"
        />
        <path
          d="M120 30 C 139 66, 177 88, 177 145 C 177 189, 152 210, 120 210 C 88 210, 63 189, 63 145 C 63 88, 101 66, 120 30 Z"
          fill={`url(#${bodyId})`}
        />
        <path
          d="M120 92 C 132 114, 153 124, 153 154 C 153 180, 138 195, 120 195 C 102 195, 87 180, 87 154 C 87 124, 108 114, 120 92 Z"
          fill={`url(#${coreId})`}
          opacity="0.9"
        />

        <ellipse cx="103" cy="137" rx="13" ry="15" fill="#fff" />
        <ellipse cx="137" cy="137" rx="13" ry="15" fill="#fff" />
        <circle cx="105" cy="140" r="6" fill="#171226" />
        <circle cx="139" cy="140" r="6" fill="#171226" />
        <circle cx="107" cy="137" r="2.2" fill="#fff" />
        <circle cx="141" cy="137" r="2.2" fill="#fff" />

        <path
          d="M108 160 Q 120 171 132 160"
          stroke="#171226"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="88" cy="155" r="7" fill="#FF8FB1" opacity="0.3" />
        <circle cx="152" cy="155" r="7" fill="#FF8FB1" opacity="0.3" />

        <path
          d="M68 158 C 53 152, 46 140, 49 128"
          stroke={`url(#${bodyId})`}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M172 158 C 187 152, 194 140, 191 128"
          stroke={`url(#${bodyId})`}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {withSparkles ? (
        <g fill="#C9BBFF">
          <path d="M42 66 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4Z" opacity="0.9" />
          <path d="M198 92 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" opacity="0.7" />
          <path d="M190 184 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" opacity="0.55" />
          <circle cx="58" cy="108" r="3" opacity="0.6" />
          <circle cx="176" cy="60" r="2.5" opacity="0.5" />
        </g>
      ) : null}
    </svg>
  );
}
