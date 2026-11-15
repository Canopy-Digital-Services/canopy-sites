# Tool & Technology Documentation

Notes on the tools this repo uses whose current major versions break with older patterns: what changed, the current syntax, and how the repo uses each.

## ⚠️ Important: For AI Agents

**Before working with any tool or technology in this project, read the relevant documentation file below.** These tools have undergone major version updates with breaking changes, new features, and updated patterns that may not be in your training data.

### When to Read Documentation

- **Before writing code** that uses Prisma, Next.js, React, Tailwind CSS, or Docker
- **Before making configuration changes** to any of these tools
- **When encountering errors** related to these tools
- **When implementing new features** that rely on these technologies
- **Before suggesting code patterns** - verify current best practices

### When to Update Documentation

If you used a wrong or malformed command, API, or pattern because of outdated training data (e.g. wrong CLI syntax, deprecated API, incorrect flag), **update the relevant tool doc** in this directory. Add a note, correct an example, or document the current syntax so future agents don't repeat the mistake.

### Index

| Tool | Documentation | When to Read |
|------|--------------|--------------|
| **Prisma** | [`prisma-7.md`](./prisma-7.md) | Database queries, schema changes, migrations |
| **Next.js** | [`nextjs-16.md`](./nextjs-16.md) | Routes, API handlers, server components, proxy |
| **React** | [`react-19.md`](./react-19.md) | Components, hooks, forms, state management |
| **Tailwind CSS** | [`tailwindcss-v4.md`](./tailwindcss-v4.md) | Styling, theme configuration, custom utilities |
| **Docker** | [`docker.md`](./docker.md) | The dev stack, compose commands, image builds |

Drag-and-drop has no tool doc on purpose: `@dnd-kit/*` is imported by exactly one file, `src/components/ui/sortable-list.tsx`, and everything else uses that component. For reordering work, read the Lists section of [`../UX_PATTERNS.md`](../UX_PATTERNS.md). Only open `sortable-list.tsx` if you need to change drag behavior itself.

## Related Documentation

- [`../UX_PATTERNS.md`](../UX_PATTERNS.md) - **UI/UX conventions and component guidelines** (read before building UI)
- [`../epics/`](../epics/) - Epic completion reports
- [`../AGENT_CONTEXT.md`](../AGENT_CONTEXT.md) - Project architecture and development guidelines
- [`../../README.md`](../../README.md) - Project overview
