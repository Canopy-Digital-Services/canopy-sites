# Tailwind CSS v4

`tailwindcss` and `@tailwindcss/postcss` 4.1.18 (root `package-lock.json`, 2026-11-23). The package ships no docs; its default theme values are in `/app/node_modules/tailwindcss/theme.css` in the dev container. To see what classes generate in this version with this repo's tokens, compile them in the container:

```bash
docker exec -w /app/apps/portal canopy-portal node --input-type=module -e 'import { compile } from "@tailwindcss/node"; import { readFileSync } from "node:fs"; const c = await compile(readFileSync("src/app/globals.css", "utf8"), { base: `${process.cwd()}/src/app`, onDependency() {} }); console.log(c.build(process.argv.slice(1)))' rounded rounded-md
```

A class missing from the output's `@layer utilities` does not exist.

## Setup in this repo

Configuration is CSS, all of it in `src/app/globals.css` (`@import "tailwindcss"`, the tokens, `@custom-variant dark`, `@layer base`), with `postcss.config.mjs` loading `@tailwindcss/postcss`. There is no `tailwind.config.js`, no `content` array (sources are detected), no `@tailwind` directives, and no `autoprefixer`. A token that refers to another variable goes in `@theme inline`, as the semantic colors and fonts there do. How to use the tokens is in `docs/UX_PATTERNS.md`.

## Breaking changes from v3

- **A v3 size name now gives one step larger.** v3's `shadow-sm` is v4's `shadow-xs`, and v3's bare `shadow` is v4's `shadow-sm`. The same shift applies to `drop-shadow`, `blur`, `backdrop-blur`, and `rounded`.
- **Never use bare `rounded` here.** It is a fixed `0.25rem` that ignores the theme, while every sized class from `rounded-sm` up resolves to the 2px `--radius` (UX_PATTERNS, Radius).
- **`outline-none` sets `outline-style: none`.** v3's behavior, which keeps an outline in forced-colors mode, is `outline-hidden`.
- **`ring` is 1px in `currentColor`.** v3's 3px ring is `ring-3`.
- **The opacity utilities are gone** (`bg-opacity-50` generates nothing). Use the slash: `bg-black/50`.
- **Gradients are `bg-linear-to-r`**, `bg-radial`, and `bg-conic`. `bg-gradient-to-r` is a legacy alias.
- **Border color defaults to `currentColor`.** The `@layer base` in `globals.css` applies `border-border` to every element, so a bare `border` gets the token.
- **A CSS variable in an arbitrary value takes parentheses:** `bg-(--brand)`. `bg-[--brand]` compiles to `background-color: --brand`, which is invalid.
- **The important modifier goes last:** `flex!`, not `!flex`.
- **Stacked variants apply left to right:** v3's `first:*:pt-0` is `*:first:pt-0`.
- **`hover:` applies only where the device can hover** (`@media (hover: hover)`), so it does nothing on touch.
- **A custom utility that should take variants is `@utility name { ... }`**, not a class in `@layer utilities`.
- **`theme()` gives way to the variables:** `var(--color-red-500)`.
- **`space-*` and `divide-*` select `:not(:last-child)`.** Prefer `gap` in a flex or grid layout.
- **`rotate-*`, `scale-*`, and `translate-*` are their own CSS properties.** `transform-none` no longer resets them (use `scale-none` and the like), and a transition names them: `transition-[opacity,scale]`, not `transition-[opacity,transform]`.
- **Buttons have `cursor: default`.**
- **Container queries are built in**, with no plugin: `@container` on the parent, `@md:text-lg` on the child.
