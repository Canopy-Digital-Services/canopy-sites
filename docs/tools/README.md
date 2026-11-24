# Tool docs

What an agent trained on older majors gets wrong about the tools this repo runs, and how the repo uses each. Read the matching file before writing code against the tool.

- [`prisma-7.md`](./prisma-7.md): queries, the schema, migrations, Prisma's error messages
- [`nextjs-16.md`](./nextjs-16.md): routes, route handlers, server components and actions, `next.config.ts`, upgrading `next`
- [`react-19.md`](./react-19.md): components, hooks, forms
- [`tailwindcss-v4.md`](./tailwindcss-v4.md): classes, tokens, `globals.css`
- [`docker.md`](./docker.md): the dev stack, installing dependencies, the Dockerfiles

A tool doc holds only what changes the code an agent writes: a breaking change as the rule plus the right pattern, or a fact about how this repo uses the tool. What a model already knows, what one grep finds, and what another doc states stay out (`docs/DOC_MAINTENANCE.md`).
