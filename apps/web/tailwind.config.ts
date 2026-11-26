import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dashboard (dark application shell) - unchanged.
        ink: {
          950: "#07070D",
          900: "#0B0B14",
          850: "#10101C",
          800: "#141423",
          700: "#1C1C2E",
          600: "#26263B",
        },
        line: "#2A2A40",
        spark: {
          50: "#F2EFFF",
          100: "#E4DDFF",
          200: "#C9BBFF",
          300: "#A98FFF",
          400: "#8B6BFF",
          500: "#7450F5",
          600: "#5E3ADB",
          700: "#4A2CB0",
          800: "#371F86",
          900: "#24145C",
        },
        ember: {
          400: "#54C7FF",
          500: "#22A8F0",
        },
        // Marketing (editorial paper surface).
        // Palette sampled from basar.studio (Minimal.gallery) and 12ft.studio/lab.
        paper: {
          DEFAULT: "#FBFBF2",
          deep: "#F4F1E6",
          sand: "#EAE7DB",
        },
        graphite: {
          DEFAULT: "#1B1B1C",
          500: "#595959",
          400: "#8A8A8A",
        },
        lilac: "#C6BDFF",
        acid: "#FFF96F",
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
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        label: "0.14em",
        display: "-0.03em",
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(116, 80, 245, 0.55)",
        card: "0 20px 60px -30px rgba(0, 0, 0, 0.9)",
      },
      backgroundImage: {
        "spark-radial":
          "radial-gradient(circle at 20% 10%, rgba(116,80,245,0.22), transparent 45%), radial-gradient(circle at 85% 20%, rgba(34,168,240,0.14), transparent 40%)",
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
      },
    },
  },
  plugins: [],
};

export default config;
