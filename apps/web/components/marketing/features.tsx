import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ChevronDown, Hash, Volume2 } from "lucide-react";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { Section, SectionHeader } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";

/** Product panel sitting in a slightly lighter bezel (clears.ai feature rows). */
function Bezel({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return (
    <div className="rounded-card bg-void-900 p-3 sm:p-4">
      <div className="panel shadow-panel">
        <div className="flex min-h-[40px] items-center justify-between gap-3 border-b border-white/5 px-5">
          <p className="text-[13px] font-medium text-white">{title}</p>
          <p className="text-[12px] text-chalk-500">{meta}</p>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FeatureRow({
  tag,
  title,
  body,
  children,
}: {
  tag: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="pad grid items-center gap-x-16 gap-y-8 border-t border-wire py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:py-20">
      <div>
        <p className="tag">{tag}</p>
        <h3 className="display mt-4 text-[26px] leading-tight">{title}</h3>
        <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-chalk-400">{body}</p>
      </div>
      {children}
    </div>
  );
}

/* --- isometric line illustrations (decorative) --- */

function rhombus(cx: number, cy: number, w: number, h: number): string {
  return `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
}

function Illustration({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 240 150"
      fill="none"
      aria-hidden="true"
      className="h-36 w-full max-w-[280px]"
      strokeWidth="1"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Three slabs being stacked: the build runs layer by layer. */
function StackArt() {
  return (
    <Illustration>
      <path d="M120 18v20M50 75v36M190 75v36" className="stroke-wire-strong" />
      <polygon points={rhombus(120, 111, 70, 30)} className="stroke-wire-strong" />
      <polygon points={rhombus(120, 86, 70, 30)} className="fill-void stroke-wire-bright" />
      <polygon
        points={rhombus(120, 58, 70, 30)}
        className="fill-spark-300/[0.08] stroke-spark-300"
      />
    </Illustration>
  );
}

function cube(cx: number, cy: number, size: number, accent: boolean) {
  const w = size;
  const h = size / 2;
  return (
    <g
      key={`${cx}-${cy}`}
      className={accent ? "fill-spark-300/[0.08] stroke-spark-300" : "fill-void stroke-wire-bright"}
    >
      <polygon points={rhombus(cx, cy, w, h)} />
      <polygon points={`${cx - w},${cy} ${cx},${cy + h} ${cx},${cy + h + size} ${cx - w},${cy + size}`} />
      <polygon points={`${cx + w},${cy} ${cx},${cy + h} ${cx},${cy + h + size} ${cx + w},${cy + size}`} />
    </g>
  );
}

/** Five cubes on a grid: the five free modules, one switched on. */
function ModulesArt() {
  return (
    <Illustration>
      <polygon points={rhombus(120, 92, 104, 46)} className="stroke-wire" />
      {cube(120, 42, 20, false)}
      {cube(74, 64, 20, false)}
      {cube(166, 64, 20, false)}
      {cube(120, 86, 20, true)}
      {cube(120, 64, 20, false)}
    </Illustration>
  );
}

/** A stack of discs: credits, with the top one spent. */
function CreditsArt() {
  const discs = [112, 98, 84, 70];
  return (
    <Illustration>
      {discs.map((cy, index) => {
        const top = index === discs.length - 1;
        return (
          <g key={cy} className={top ? "stroke-spark-300" : "stroke-wire-bright"}>
            <path d={`M64 ${cy}v10c0 11 25 20 56 20s56-9 56-20v-10`} className="fill-void" />
            <ellipse
              cx="120"
              cy={cy}
              rx="56"
              ry="20"
              className={top ? "fill-spark-300/[0.08]" : "fill-void"}
            />
          </g>
        );
      })}
      <path d="M120 16v26" className="stroke-wire-strong" />
    </Illustration>
  );
}

export async function Features() {
  const t = await getTranslations("marketing.features");
  const tp = await getTranslations("marketing.pricingPage");

  const tree = [
    { name: t("treeCat1"), voice: false, channels: [t("treeCh1"), t("treeCh2")] },
    { name: t("treeCat2"), voice: false, channels: [t("treeCh3"), t("treeCh4")] },
    { name: t("treeCat3"), voice: true, channels: [t("treeCh5"), t("treeCh6")] },
  ];
  const allowed = [t("permA1"), t("permA2"), t("permA3"), t("permA4"), t("permA5")];
  const blocked = [t("permB1"), t("permB2"), t("permB3")];
  const additions = [t("refineAdd1"), t("refineAdd2"), t("refineAdd3")];
  const costs = [
    { label: t("costGenerate"), value: t("costGenerateValue"), unit: "" },
    { label: t("costRefine"), value: String(CREDIT_COSTS.refine), unit: t("creditsUnit") },
    { label: t("costApply"), value: t("costApplyValue"), unit: "" },
  ];

  return (
    <Section>
      <SectionHeader index="02" label={t("eyebrow")} title={t("title")} lead={t("subtitle")} />

      <FeatureRow tag={t("blueprintTag")} title={t("blueprintTitle")} body={t("blueprintBody")}>
        <Bezel title={t("treeTitle")} meta={t("treeMeta")}>
          <ul className="space-y-4">
            {tree.map((category, categoryIndex) => (
              <li key={category.name}>
                <p className="flex items-center gap-1.5 text-[12px] text-chalk-400">
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  {category.name}
                </p>
                <ul className="ml-[5px] mt-1.5 border-l border-wire-strong pl-3">
                  {category.channels.map((channel, channelIndex) => {
                    const active = categoryIndex === 1 && channelIndex === 0;
                    const Icon = category.voice ? Volume2 : Hash;
                    return (
                      <li
                        key={channel}
                        className={cn(
                          "inner-row flex h-9 items-center gap-2 px-3 text-[13px]",
                          active ? "bg-spark-300/10 text-spark-200" : "text-chalk-300",
                        )}
                      >
                        <Icon
                          className={cn("h-3.5 w-3.5", active ? "text-spark-300" : "text-chalk-500")}
                          aria-hidden="true"
                        />
                        {channel}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </Bezel>
      </FeatureRow>

      <FeatureRow
        tag={t("permissionsTag")}
        title={t("permissionsTitle")}
        body={t("permissionsBody")}
      >
        <Bezel title={t("permTitle")} meta={t("permMeta")}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mono-label text-spark-200">{t("permAllowed")}</p>
              <ul className="mt-3 space-y-1.5">
                {allowed.map((permission) => (
                  <li
                    key={permission}
                    className="inner-row flex h-9 items-center gap-2.5 px-3 text-[12px] text-chalk-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-pill shrink-0 bg-spark-300" aria-hidden="true" />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mono-label">{t("permBlocked")}</p>
              <ul className="mt-3 space-y-1.5">
                {blocked.map((permission) => (
                  <li
                    key={permission}
                    className="flex h-9 items-center gap-2.5 rounded-inner border border-wire bg-white/[0.02] px-3 text-[12px] text-chalk-400 line-through decoration-chalk-500"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-pill shrink-0 border border-chalk-500"
                      aria-hidden="true"
                    />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Bezel>
      </FeatureRow>

      <FeatureRow tag={t("previewTag")} title={t("previewTitle")} body={t("previewBody")}>
        <Bezel title={t("refineTitle")} meta={tp("credits", { count: CREDIT_COSTS.refine })}>
          <p className="inner-row flex h-11 items-center gap-3 px-4 font-code text-[13px] text-chalk-2">
            <span className="text-spark-300" aria-hidden="true">
              &gt;
            </span>
            {t("refinePrompt")}
            <span
              aria-hidden="true"
              className="h-4 w-[2px] bg-spark-300 motion-safe:animate-pulse-soft"
            />
          </p>
          <ul className="mt-4 space-y-1.5 font-code text-[13px]">
            {additions.map((line) => (
              <li
                key={line}
                className="flex h-9 items-center gap-3 bg-spark-300/[0.07] px-3 text-spark-200"
              >
                <span className="w-2 text-spark-300" aria-hidden="true">
                  +
                </span>
                {line}
              </li>
            ))}
            <li className="flex h-9 items-center gap-3 px-3 text-chalk-500">
              <span className="w-2" aria-hidden="true">
                =
              </span>
              {t("refineKeep")}
            </li>
          </ul>
        </Bezel>
      </FeatureRow>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="surface p-6 sm:p-8">
          <div className="flex justify-center">
            <StackArt />
          </div>
          <h3 className="mt-6 text-[18px] font-medium leading-snug text-white">
            {t("applyTitle")}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-chalk-400">{t("applyBody")}</p>
        </article>

        <article className="surface p-6 sm:p-8">
          <div className="flex justify-center">
            <ModulesArt />
          </div>
          <h3 className="mt-6 text-[18px] font-medium leading-snug text-white">
            {t("modulesTitle")}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-chalk-400">{t("modulesBody")}</p>
        </article>

        <article className="surface p-6 sm:p-8">
          <div className="flex justify-center">
            <CreditsArt />
          </div>
          <h3 className="mt-6 text-[18px] font-medium leading-snug text-white">
            {t("creditsTitle")}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-chalk-400">{t("creditsBody")}</p>
          <dl className="mt-5 grid grid-cols-3 gap-2">
            {costs.map((cost) => (
              <div key={cost.label} className="inner-row p-3 text-center">
                <dt className="text-[12px] text-chalk-500">{cost.label}</dt>
                <dd className="mt-2 flex items-baseline justify-center gap-1 text-[15px] font-medium tabular-nums text-white">
                  {cost.value}
                  {cost.unit ? (
                    <span className="text-[11px] font-normal text-chalk-500">{cost.unit}</span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </Section>
  );
}
