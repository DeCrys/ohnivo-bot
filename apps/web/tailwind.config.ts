import type { Config } from "tailwindcss";

/**
 * All visual values resolve to the CSS variables in app/globals.css.
 * Component classes keep their old names where possible, so a single token
 * change here updates every surface across landing, dashboard and builder.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Uniform page canvas.
        bg: "var(--bg)",

        // Generic application shell (legacy dashboard tokens).
        ink: {
          950: "var(--bg)",
          900: "var(--card)",
          850: "var(--card-2)",
          800: "var(--card-3)",
          700: "#24252a",
          600: "#2e2f35",
        },
        line: "var(--card-border)",

        // Violet accent scale - used for the primary action and highlights.
        spark: {
          50: "#f4f1ff",
          100: "#e9e2ff",
          200: "#cbbaff",
          300: "var(--accent-soft)",
          400: "#8b5cf6",
          500: "var(--accent)",
          600: "#6d3fd4",
          700: "#5630aa",
          800: "#3f2481",
          900: "#2a1858",
        },
        ember: {
          400: "#54c7ff",
          500: "#22a8f0",
        },

        // Marketing surfaces (formerly "void"/"chalk"/"wire" blueprint).
        void: {
          DEFAULT: "var(--bg)",
          900: "var(--card)",
          800: "var(--card-2)",
          700: "var(--card-3)",
          600: "#24252a",
        },
        chalk: {
          DEFAULT: "var(--text)",
          2: "var(--text-secondary)",
          300: "var(--text-secondary)",
          400: "var(--text-muted)",
          500: "var(--text-subtle)",
          muted: "var(--text-muted)",
          dim: "var(--text-subtle)",
        },
        wire: {
          DEFAULT: "var(--card-border)",
          strong: "var(--card-border-hover)",
          bright: "rgba(255,255,255,0.16)",
        },
      },
      borderRadius: {
        // Soft geometry everywhere: no 0px or 2px frames left.
        tick: "var(--radius-control)",
        panel: "var(--radius-inner)",
        card: "var(--radius-card)",
        inner: "var(--radius-inner)",
        control: "var(--radius-control)",
        pill: "var(--radius-pill)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Monospace is reserved for real code and IDs only.
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        label: "0",
        display: "-0.02em",
        mono: "0",
      },
      boxShadow: {
        glow: "0 20px 60px -30px rgba(var(--accent-rgb), 0.35)",
        card: "var(--shadow-soft)",
        hatch: "0 10px 30px -14px rgba(var(--accent-rgb), 0.35)",
        panel: "var(--shadow-soft)",
        soft: "var(--highlight), var(--shadow-soft)",
      },
      backgroundImage: {
        // A single very quiet glow; the page itself stays uniform #08090a.
        "spark-radial":
          "radial-gradient(60% 40% at 50% 0%, rgba(var(--accent-rgb), 0.05), transparent 100%)",
        // Old hatch backgrounds are gone; keys remain for compatibility.
        hatch: "none",
        "hatch-ink": "none",
        "hatch-spark": "none",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        rise: {
          from: { transform: "translateY(115%)" },
          to: { transform: "translateY(0)" },
        },
        dashFlow: {
          to: { strokeDashoffset: "-24" },
        },
        twinkle: {
          "0%, 100%": { opacity: "var(--dot-opacity, 0.6)" },
          "50%": { opacity: "0.08" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        rise: "rise 0.9s cubic-bezier(0.2, 0, 0, 1) both",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.2, 0, 0, 1) both",
        "dash-flow": "dashFlow 1.6s linear infinite",
        twinkle: "twinkle 4.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
