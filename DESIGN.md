# DESIGN.md — Impeccable Design System Specification

## 🎨 Visual System & Palette Tokens

### Surface & Background Tokens
- `--bg-canvas`: `#030712` (Deep Space Dark)
- `--bg-surface`: `#0f172a` (Slate Navy Card Surface)
- `--bg-surface-elevated`: `#1e293b` (Elevated Interactive Element)
- `--border-subtle`: `rgba(255, 255, 255, 0.08)`
- `--border-focus`: `rgba(99, 102, 241, 0.5)`

### Typography Tokens
- **Display Face**: `'Outfit', sans-serif` (Bold, geometric display headings)
- **UI Body Face**: `'Plus Jakarta Sans', sans-serif` (High legibility, optical character spacing)
- **Scale Step 1 (Title)**: `1.5rem / 1.3 leading`
- **Scale Step 2 (Heading)**: `1.125rem / 1.4 leading`
- **Scale Step 3 (Body)**: `0.875rem / 1.5 leading` (14px)
- **Scale Step 4 (Caption)**: `0.75rem / 1.4 leading` (12px)

### Radius Tokens
- **Containers & Cards**: `12px` to `16px` (Strictly non-blob, clean rounded rectangle)
- **Inputs & Buttons**: `8px` to `10px`
- **Status Pills & Badges**: `9999px` (Full Pill)

---

## 🛑 Impeccable Anti-Slop Rules (Strictly Enforced)

1. **NO Generic Cyberpunk Neon Glows**: Avoid harsh, glowing purple-to-cyan dark mode halos and garish box-shadow blurs.
2. **NO Side-Tab Card Borders**: Eliminate thick colored vertical stripes attached to rounded cards.
3. **NO Cardocalypse Nesting**: Never nest cards inside cards inside cards. Flatten hierarchy using subtle dividers and spacing rhythm.
4. **NO Monotonic Typography**: Pair distinctive display headings with clear UI body text.
5. **NO Font Size Clumping**: Ensure a minimum 1.25 ratio between typographic scale steps.
