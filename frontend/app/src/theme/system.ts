// SPDX-License-Identifier: AGPL-3.0-or-later
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
// Quenda theme for Chakra UI. Mirrors docs/architecture/design-guidelines.md and
// the CSS custom properties in styles.css. Each workspace keeps an identical copy.
const FONT = "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif";
const FOCUS = "#c25e00";
const config = defineConfig({
  globalCss: {
    body: { bg: "bg", color: "fg", fontFamily: "body" },
  },
  theme: {
    breakpoints: {
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    tokens: {
      fonts: { heading: { value: FONT }, body: { value: FONT } },
      fontWeights: {
        medium: { value: "500" },
        semibold: { value: "650" },
        bold: { value: "700" },
      },
      colors: {
        // Municipal brand colour; 600 is the solid. The shell overrides the CSS variables with
        // the municipality's validated primary colour; the hex values are Quenda's default green.
        court: {
          50: { value: "#f0f6f2" },
          100: { value: "var(--court-tint, #e6efe9)" },
          200: { value: "var(--court-200, #c9ddd0)" },
          300: { value: "var(--court-300, #9fc2ad)" },
          400: { value: "#5f957a" },
          500: { value: "#2f7356" },
          600: { value: "var(--court, #1f5b43)" },
          700: { value: "var(--court-dark, #174634)" },
          800: { value: "#123828" },
          900: { value: "#0d291e" },
          950: { value: "#081a13" },
        },
        // Neutrals with the same green undertone as ink and line.
        gray: {
          50: { value: "#f7f8f6" },
          100: { value: "#f2f4f1" },
          200: { value: "#e4e8e3" },
          300: { value: "#d8ddd6" },
          400: { value: "#a9b2ab" },
          500: { value: "#76837b" },
          600: { value: "#4a5a51" },
          700: { value: "#36443c" },
          800: { value: "#24332b" },
          900: { value: "#14261d" },
          950: { value: "#0b1711" },
        },
      },
      radii: {
        control: { value: "6px" },
        card: { value: "10px" },
      },
      easings: { quenda: { value: "cubic-bezier(.2,.7,.3,1)" } },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "#ffffff" },
          subtle: { value: "#f2f4f1" },
          muted: { value: "#eceeeb" },
          emphasized: { value: "#e4e8e3" },
          panel: { value: "#ffffff" },
          error: { value: "#fae6e3" },
          warning: { value: "#fbefd9" },
          success: { value: "#e6efe9" },
        },
        fg: {
          DEFAULT: { value: "#14261d" },
          muted: { value: "#4a5a51" },
          subtle: { value: "#4a5a51" },
          error: { value: "#a3322a" },
          warning: { value: "#8a5300" },
          success: { value: "#1f5b43" },
        },
        border: {
          DEFAULT: { value: "#d8ddd6" },
          muted: { value: "#e4e8e3" },
          subtle: { value: "#e4e8e3" },
          emphasized: { value: "#a9b2ab" },
          error: { value: "#a3322a" },
        },
        court: {
          contrast: { value: "#ffffff" },
          fg: { value: "{colors.court.600}" },
          subtle: { value: "{colors.court.100}" },
          muted: { value: "{colors.court.200}" },
          emphasized: { value: "{colors.court.300}" },
          solid: { value: "{colors.court.600}" },
          focusRing: { value: FOCUS },
          border: { value: "{colors.court.600}" },
        },
        // Legacy alias: colorPalette="green" renders as court.
        green: {
          contrast: { value: "#ffffff" },
          fg: { value: "{colors.court.600}" },
          subtle: { value: "{colors.court.100}" },
          muted: { value: "{colors.court.200}" },
          emphasized: { value: "{colors.court.300}" },
          solid: { value: "{colors.court.600}" },
          focusRing: { value: FOCUS },
          border: { value: "{colors.court.600}" },
        },
        gray: {
          contrast: { value: "#ffffff" },
          fg: { value: "{colors.gray.900}" },
          subtle: { value: "{colors.gray.100}" },
          muted: { value: "{colors.gray.200}" },
          emphasized: { value: "{colors.gray.300}" },
          solid: { value: "{colors.gray.900}" },
          focusRing: { value: FOCUS },
          border: { value: "{colors.gray.300}" },
        },
        red: {
          contrast: { value: "#ffffff" },
          fg: { value: "#a3322a" },
          subtle: { value: "#fae6e3" },
          muted: { value: "#f4d2cd" },
          emphasized: { value: "#ecbab3" },
          solid: { value: "#a3322a" },
          focusRing: { value: FOCUS },
          border: { value: "#a3322a" },
        },
      },
      radii: {
        l1: { value: "4px" },
        l2: { value: "6px" },
        l3: { value: "10px" },
      },
      shadows: {
        xs: { value: "0 0 0 1px {colors.border}" },
        sm: { value: "0 0 0 1px {colors.border}" },
        md: { value: "0 12px 32px -12px rgb(20 38 29 / 28%)" },
        lg: { value: "0 12px 32px -12px rgb(20 38 29 / 28%)" },
        xl: { value: "0 12px 32px -12px rgb(20 38 29 / 28%)" },
        "2xl": { value: "0 12px 32px -12px rgb(20 38 29 / 28%)" },
      },
    },
    recipes: {
      button: {
        base: {
          fontWeight: "650",
          borderRadius: "control",
          transitionDuration: "150ms",
          transitionTimingFunction: "quenda",
          focusVisibleRing: "outside",
          focusRingColor: FOCUS,
          focusRingWidth: "3px",
          focusRingOffset: "3px",
        },
        variants: {
          size: {
            sm: { h: "10", minW: "10", textStyle: "sm", px: "3.5", gap: "2" },
            md: { h: "11", minW: "11", textStyle: "md", px: "5", gap: "2" },
            lg: { h: "12", minW: "12", textStyle: "md", px: "6", gap: "2" },
          },
          variant: {
            outline: {
              borderColor: "border",
              color: "colorPalette.fg",
              _hover: { bg: "bg.subtle" },
            },
            ghost: { color: "colorPalette.fg", _hover: { bg: "bg.subtle" } },
          },
        },
        defaultVariants: { size: "md" },
      },
      input: {
        base: {
          borderRadius: "control",
          focusVisibleRing: "outside",
          focusRingColor: FOCUS,
          focusRingWidth: "3px",
          _focusVisible: { borderColor: "court.600" },
        },
        variants: {
          size: {
            md: { textStyle: "md", px: "3.5", "--input-height": "sizes.11" },
          },
        },
        defaultVariants: { size: "md" },
      },
      textarea: {
        base: {
          borderRadius: "control",
          focusVisibleRing: "outside",
          focusRingColor: FOCUS,
          focusRingWidth: "3px",
          _focusVisible: { borderColor: "court.600" },
        },
        variants: { size: { md: { textStyle: "md", px: "3.5", py: "2.5" } } },
        defaultVariants: { size: "md" },
      },
      spinner: { base: { color: "court.600" } },
    },
    slotRecipes: {
      nativeSelect: {
        slots: ["root", "field", "indicator"],
        base: {
          field: {
            borderRadius: "control",
            focusVisibleRing: "outside",
            focusRingColor: FOCUS,
            focusRingWidth: "3px",
            _focusVisible: { borderColor: "court.600" },
          },
          indicator: { color: "fg.muted" },
        },
        variants: {
          size: {
            md: {
              root: { "--select-field-height": "sizes.11" },
              field: { textStyle: "md", ps: "3.5", pe: "9" },
            },
          },
        },
        defaultVariants: { size: "md" },
      },
      field: {
        slots: [
          "root",
          "errorText",
          "helperText",
          "input",
          "label",
          "select",
          "textarea",
          "requiredIndicator",
        ],
        base: {
          label: { textStyle: "sm", fontWeight: "650", color: "fg" },
          helperText: { textStyle: "sm", color: "fg.muted" },
          errorText: { textStyle: "sm", color: "fg.error", fontWeight: "500" },
          requiredIndicator: { color: "fg.error" },
        },
      },
      dialog: {
        slots: [
          "trigger",
          "backdrop",
          "positioner",
          "content",
          "title",
          "description",
          "closeTrigger",
          "header",
          "body",
          "footer",
        ],
        base: {
          backdrop: { bg: "rgb(20 38 29 / 45%)" },
          positioner: { px: { base: "4", sm: "6" } },
          content: {
            borderRadius: "card",
            boxShadow: "lg",
            mx: "0",
          },
          header: { px: { base: "5", md: "7" }, pt: { base: "5", md: "7" } },
          body: { px: { base: "5", md: "7" } },
          footer: {
            px: { base: "5", md: "7" },
            pb: { base: "5", md: "7" },
            flexDirection: { base: "column-reverse", sm: "row" },
            alignItems: { base: "stretch", sm: "center" },
            gap: "3",
          },
          title: {
            fontSize: "1.5rem",
            lineHeight: "1.25",
            fontWeight: "700",
            letterSpacing: "-0.01em",
          },
          description: { color: "fg.muted" },
          closeTrigger: { top: "3", insetEnd: "3" },
        },
      },
    },
  },
});
export const system = createSystem(defaultConfig, config);
