/**
 * RapidUI typography — semantic sizes in `app/globals.css` @theme.
 * Each level is one step smaller than the prior Tailwind-default usage.
 *
 * | Class            | Size | Typical use                         |
 * |------------------|------|-------------------------------------|
 * | text-display     | 30px | Hero headline (sm+)                 |
 * | text-display-sm  | 24px | Hero headline (mobile)              |
 * | text-title       | 20px | Page h1                             |
 * | text-heading     | 18px | Section h2                          |
 * | text-subhead     | 16px | Brand bar, subsection titles        |
 * | text-body        | 14px | Default copy, card titles           |
 * | text-ui          | 12px | Nav, buttons, forms, tables         |
 * | text-caption     | 11px | Labels, badges, mono metadata       |
 * | text-micro       | 10px | Hints, fine print                   |
 */
export const typography = {
  display: "text-display-sm sm:text-display",
  title: "text-title",
  heading: "text-heading",
  subhead: "text-subhead",
  body: "text-body",
  ui: "text-ui",
  caption: "text-caption",
  micro: "text-micro",
} as const;
