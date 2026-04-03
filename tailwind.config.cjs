/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@vault/ui/tailwind')],
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['media', 'class'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui base tokens — resolved via @layer base bridge in styles.css ──
        // Vault tokens are hex/rgba — NOT raw HSL channels — so var(--X) is used directly.
        // Do NOT use hsl(var(--X) / <alpha-value>): that format requires HSL channel values
        // (e.g. "220 14% 96%") which vault tokens do not provide.
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        // ── shadcn Sidebar component tokens (raw HSL channel values — hsl() is valid here) ──
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        shadcn: 'var(--radius-shadcn)',
        // Override vault UI preset radius values for shadcn component compatibility.
        // shadcn components use rounded-md/lg/xl internally; the vault preset maps these
        // to vault 28px token values. These overrides restore standard shadcn radii.
        sm: 'calc(var(--radius-shadcn) - 4px)', // ~4px
        md: 'calc(var(--radius-shadcn) - 2px)', // ~6px
        lg: 'var(--radius-shadcn)', // 8px  (e.g. Card)
        xl: 'calc(var(--radius-shadcn) + 4px)', // ~12px
      },
    },
  },
};
