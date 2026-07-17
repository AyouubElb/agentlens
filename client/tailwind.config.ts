import type { Config } from "tailwindcss";

/* Every value resolves to a var from styles/globals.css — never a literal. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        raised: "var(--color-raised)",
        hairline: "var(--color-hairline)",
        input: "var(--color-input)",
        skeleton: "var(--color-skeleton)",

        border: {
          input: "var(--color-border-input)",
          card: "var(--color-border-card)",
          muted: "var(--color-border-muted)",
          dashed: "var(--color-border-dashed)",
        },

        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
          faint: "var(--color-text-faint)",
        },

        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          pressed: "var(--color-accent-pressed)",
          tint: "var(--color-accent-tint)",
          border: "var(--color-accent-border)",
          ink: "var(--color-accent-ink)",
        },

        success: {
          DEFAULT: "var(--color-success)",
          tint: "var(--color-success-tint)",
          text: "var(--color-success-text)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          tint: "var(--color-warning-tint)",
          text: "var(--color-warning-text)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          hover: "var(--color-danger-hover)",
          tint: "var(--color-danger-tint)",
          "tint-hover": "var(--color-danger-tint-hover)",
          text: "var(--color-danger-text)",
          border: "var(--color-danger-border)",
        },

        score: {
          1: "var(--color-score-1)",
          2: "var(--color-score-2)",
          3: "var(--color-score-3)",
          4: "var(--color-score-4)",
          5: "var(--color-score-5)",
          ink: "var(--color-score-ink)",
        },
      },

      fontFamily: {
        sans: ["Archivo", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },

      fontSize: {
        page: ["42px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["32px", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
        card: ["17px", { lineHeight: "1.2" }],
        label: ["13px", { lineHeight: "1.3" }],
        body: ["15px", { lineHeight: "1.55" }],
        caption: ["12px", { lineHeight: "1.4" }],
        code: ["13px", { lineHeight: "1.6" }],
        eyebrow: ["11px", { lineHeight: "1.2", letterSpacing: "0.1em" }],
      },

      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        "ring-accent": "0 0 0 3px var(--color-accent-ring)",
        "ring-danger": "0 0 0 3px var(--color-danger-ring)",
      },

      maxWidth: {
        content: "1440px",
      },

      animation: {
        spin: "al-spin 0.8s linear infinite",
        shimmer: "al-shimmer 1.4s ease-in-out infinite",
        progress: "al-progress 5s linear forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
