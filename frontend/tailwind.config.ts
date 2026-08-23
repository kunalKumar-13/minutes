import type { Config } from "tailwindcss";

/**
 * The palette, type ramp, spacing and radii below were read off the live
 * Fireflies app's own CSS custom properties (see docs/design-notes.md), so
 * `bg-purple-600` here is literally the purple their Share button uses.
 */
const config: Config = {
  darkMode: "class",
  // lib/ matters here: the avatar and tag colour maps live in lib/utils.ts, and
  // classes that appear only there would otherwise never be generated.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          25: "#fcfcfd", 50: "#f9fafb", 100: "#f2f4f7", 200: "#eaecf0", 300: "#d0d5dd",
          400: "#98a2b3", 500: "#667085", 600: "#475467", 700: "#344054", 800: "#1d2939",
          900: "#101828",
        },
        purple: {
          25: "#fafaff", 50: "#f4f3ff", 100: "#ebe9fe", 200: "#d9d6fe", 300: "#bdb4fe",
          400: "#9b8afb", 500: "#7a5af8", 600: "#6938ef", 700: "#5925dc", 800: "#4a1fb8",
          900: "#3e1c96",
        },
        blue: {
          25: "#f5faff", 50: "#eff8ff", 100: "#d1e9ff", 200: "#b2ddff", 300: "#84caff",
          400: "#53b1fd", 500: "#2e90fa", 600: "#1570ef", 700: "#175cd3", 800: "#1849a9",
          900: "#194185",
        },
        indigo: {
          25: "#f5f8ff", 50: "#eef4ff", 100: "#e0eaff", 200: "#c7d7fe", 300: "#a4bcfd",
          400: "#8098f9", 500: "#6172f3", 600: "#444ce7", 700: "#3538cd", 800: "#2d31a6",
          900: "#2d3282",
        },
        red: {
          25: "#fffafa", 50: "#fef3f2", 100: "#fee4e2", 200: "#fecdc9", 300: "#fda29b",
          400: "#f97066", 500: "#f04438", 600: "#d92d20", 700: "#b32318", 800: "#912018",
          900: "#7a271a",
        },
        green: {
          25: "#f6fef9", 50: "#ecfdf3", 100: "#d1fadf", 200: "#a6f4c5", 300: "#6ce9a6",
          400: "#32d583", 500: "#12b76a", 600: "#039855", 700: "#027948", 800: "#05603a",
          900: "#054f31",
        },
        yellow: {
          25: "#fffcf5", 50: "#fffaeb", 100: "#feefc6", 200: "#fedf89", 300: "#fec84b",
          400: "#fdb022", 500: "#f79009", 600: "#dc6803", 700: "#b54708", 800: "#93370d",
          900: "#792e0d",
        },
        orange: {
          25: "#fefaf5", 50: "#fef6ee", 100: "#fdead7", 200: "#f9dbaf", 300: "#f7b27a",
          400: "#f38744", 500: "#ef6820", 600: "#e04f16", 700: "#b93815", 800: "#932f19",
          900: "#772917",
        },
        pink: {
          25: "#fef6fb", 50: "#fdf2fa", 100: "#fce7f6", 200: "#fcceee", 300: "#faa7e0",
          400: "#f670c7", 500: "#ee46bc", 600: "#dd2590", 700: "#c11574", 800: "#9e165f",
          900: "#851651",
        },
        cyan: {
          25: "#f5feff", 50: "#ecfdff", 100: "#cff9fe", 200: "#a5f0fc", 300: "#67e3f9",
          400: "#22ccee", 500: "#06aed4", 600: "#088ab2", 700: "#0e7090", 800: "#155b75",
          900: "#164c63",
        },
        teal: {
          25: "#f6fefc", 50: "#f0fdf9", 100: "#ccfbef", 200: "#99f6e0", 300: "#5fe9d0",
          400: "#2ed3b7", 500: "#15b79e", 600: "#0e9384", 700: "#107569", 800: "#125d56",
          900: "#134e48",
        },
        // Dark-mode surfaces, sampled from the app's own dark shell.
        ink: {
          900: "#0c0d0f", 800: "#131416", 700: "#1a1b1e", 600: "#202123",
          500: "#232426", 400: "#2b2c2f", 300: "#3a3b3e",
        },
      },
      fontFamily: {
        // Measured off the running app: Inter carries essentially all UI and
        // prose; DM Sans appears only on the meeting title and a little chrome.
        // The Roboto/Poppins stack is the CSS fallback chain, not what renders.
        app: ["var(--font-inter)", "Inter", "Roboto", "Poppins", "Open Sans", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        appDisplay: ["var(--font-dm-sans)", "DM Sans", "var(--font-inter)", "Inter", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      /*
       * Every size carries its measured line-height AND letter-spacing, so a
       * class like `text-base` cannot be used with the wrong tracking. The
       * pairs come from the running product: 12/16/-0.1, 14/20/-0.16,
       * 15/24.375/-0.11 and 15/27.75 for prose, 16/24/-0.18, 24/32/-0.2.
       */
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px", letterSpacing: "-0.06px" }],
        xs: ["12px", { lineHeight: "16px", letterSpacing: "-0.1px" }],
        sm: ["12px", { lineHeight: "16px", letterSpacing: "-0.1px" }],
        base: ["14px", { lineHeight: "20px", letterSpacing: "-0.16px" }],
        md: ["15px", { lineHeight: "24.375px", letterSpacing: "-0.11px" }],
        prose: ["15px", { lineHeight: "27.75px", letterSpacing: "-0.11px" }],
        lg: ["16px", { lineHeight: "24px", letterSpacing: "-0.18px" }],
        xl: ["18px", { lineHeight: "28px", letterSpacing: "-0.32px" }],
        "2xl": ["20px", { lineHeight: "28px", letterSpacing: "-0.2px" }],
        "3xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.2px" }],
        "4xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.32px" }],
        "5xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.8px" }],
        "6xl": ["48px", { lineHeight: "56px", letterSpacing: "-1.25px" }],
      },
      letterSpacing: {
        // Paired with the sizes above: 12px→-0.1, 14px→-0.16, 15px→-0.11,
        // 16px→-0.18, 24px→-0.2, 32px→-0.32.
        tightest: "-1.25px", tighter: "-0.8px", tight: "-0.32px",
        title: "-0.2px", snug: "-0.18px", ui: "-0.16px",
        prose: "-0.11px", micro: "-0.1px", normal: "-0.02px", wide: "0.4px",
      },
      // 4px is the app's workhorse radius by a wide margin; 8px is reserved
      // for larger surfaces and 12px+ for cards and modals.
      borderRadius: { xs: "2px", sm: "4px", DEFAULT: "4px", md: "6px", lg: "8px", xl: "12px", "2xl": "16px", "3xl": "24px" },
      spacing: {
        /*
         * The marketing page gutter, solved from their own ramp rather than
         * picked: measured left edges of 24 / 64 / 104 / 120px at viewports of
         * 768 / 1024 / 1280 / 1440 are a straight line, gutter = 0.15625vw − 96px,
         * flattening once the 1440px max-width takes over. Stepped breakpoint
         * padding cannot reproduce it — between 768 and 1440 it is always wrong
         * by up to 56px, which is what put every section 50px inside theirs.
         */
        rail: "clamp(24px, 15.625vw - 96px, 120px)",
      },
      boxShadow: {
        e1: "0px 2px 2px 0px rgba(16, 24, 40, 0.04)",
        e2: "0px 4px 8px -2px rgba(16, 24, 40, 0.08), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
        e3: "0px 12px 12px -4px rgba(16, 24, 40, 0.06), 0px 4px 6px -2px rgba(16, 24, 40, 0.04)",
        e4: "0px 16px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.02)",
        e5: "0px 20px 48px -12px rgba(16, 24, 40, 0.16)",
        focus: "0px 0px 0px 4px #ebe9fe",
      },
      /*
       * The gradient system, taken verbatim from the tokens the product
       * declares (--text-gradient, --interactive-gradient-default, the
       * light-/dark- variants) plus the ones measured off what it actually
       * paints. Gradients are the part of a brand that is hardest to
       * approximate by eye, so none of these are invented.
       */
      backgroundImage: {
        // Primary brand fill — logo mark, AI affordances, send buttons.
        "brand-gradient": "linear-gradient(89deg, #ee82ee 0%, #cf72fa 29.6%, #a165f9 65.95%, #7a5af8 100%)",
        // Same ramp as a radial, used where the fill meets a dark ground.
        "brand-radial": "radial-gradient(565.43% 103.41% at 100% 50%, #7a5af8 0%, #a165f9 34.05%, #cf72fa 70.4%, #eeaafd 100%)",
        "brand-radial-dark": "radial-gradient(circle at 50% 100%, #eeaafd 0%, #cf72fa 29.6%, #a165f9 65.95%, #7a5af8 100%)",
        // Gradient text on light grounds.
        "brand-text-light": "linear-gradient(45deg, #7a5af8, #fbe8ff)",
        // Gradient borders, painted into a padded wrapper.
        "brand-border": "linear-gradient(97deg, #7a5af8, #d444f1)",
        "brand-border-subtle": "linear-gradient(97deg, #bdb4fe, #eeaafd)",
        /*
         * The four-colour AI accent: blue → mint → violet → peach. This is the
         * signature mark on anything model-generated — a hairline under a
         * heading, or a soft glow behind a card.
         */
        "ai-accent": "linear-gradient(90deg, #577fff 0%, #89ffcb 36%, #9c62ff 65%, #ffd28f 100%)",
        "ai-accent-soft":
          "linear-gradient(90deg, rgba(87,127,255,0.6) 0%, rgba(137,255,203,0.6) 36%, rgba(156,98,255,0.6) 65%, rgba(255,210,143,0.6) 100%)",
        // Marketing call-to-action.
        "cta-purple": "linear-gradient(90deg, #6c31d9 0%, #5d37f5 48.41%, #4013f2 100%)",
        /*
         * The Home greeting wash. Sampled across the real header: soft blue on
         * the left through lavender to warm peach on the right, dissolving to
         * white about half way down.
         */
        "home-wash":
          "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 52%, rgba(255,255,255,0.96) 82%, #fff 100%), linear-gradient(100deg, #cedcf2 0%, #d0dcef 24%, #e8e0e7 45%, #f9e4df 72%, #fbe7db 100%)",
        "home-wash-dark":
          "linear-gradient(to bottom, rgba(12,13,15,0) 0%, rgba(12,13,15,0.6) 55%, #0c0d0f 100%), linear-gradient(100deg, rgba(97,114,243,0.16) 0%, rgba(122,90,248,0.14) 45%, rgba(239,104,32,0.12) 100%)",
        // Loading shimmer.
        "shimmer-light":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 60%, transparent 100%)",
        // Scrim that lifts content off a dark photo or panel.
        "scrim-dark": "linear-gradient(rgba(0,0,0,0) 0%, #0c0d0f 20%)",
        "fade-right": "linear-gradient(270deg, rgba(255,255,255,0), #fff)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.97)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        // The track holds two copies of the list, so translating by exactly
        // half its width lands copy two where copy one began — seamless.
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out",
        "slide-up": "slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 140ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s infinite",
        marquee: "marquee 38s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
