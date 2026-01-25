# Tool & Technology Documentation

This directory contains up-to-date documentation for the tools and technologies used in the Can-O-Forms project.

## ⚠️ Important: For AI Agents

**Before working with any tool or technology in this project, read the relevant documentation file below.** These tools have undergone major version updates with breaking changes, new features, and updated patterns that may not be in your training data.

### When to Read Documentation

- **Before writing code** that uses Prisma, Next.js, NextAuth, React, or Tailwind CSS
- **Before making configuration changes** to any of these tools
- **When encountering errors** related to these tools
- **When implementing new features** that rely on these technologies
- **Before suggesting code patterns** - verify current best practices

### Quick Reference Guide

| Tool | Documentation | When to Read |
|------|--------------|--------------|
| **Prisma** | [`prisma-7.md`](./prisma-7.md) | Database queries, schema changes, migrations |
| **Next.js** | [`nextjs-16.md`](./nextjs-16.md) | Routes, API handlers, server components, proxy |
| **NextAuth** | [`nextauth-v5.md`](./nextauth-v5.md) | Authentication, sessions, auth helpers |
| **React** | [`react-19.md`](./react-19.md) | Components, hooks, forms, state management |
| **Tailwind CSS** | [`tailwindcss-v4.md`](./tailwindcss-v4.md) | Styling, theme configuration, custom utilities |

## Purpose

These documents provide the latest information on tools, frameworks, and libraries that may have features or patterns not covered in older training data. They include:

- **Breaking changes** from previous versions
- **New features** and capabilities
- **Current best practices** and patterns
- **Migration guides** for common scenarios
- **Project-specific notes** about how these tools are used in Can-O-Forms

## Available Documentation

### Core Framework & Runtime
- **[Prisma 7.3](./prisma-7.md)** - Database ORM with adapter pattern, new generator, ESM support
- **[Next.js 16](./nextjs-16.md)** - App Router, cache components, proxy.ts, async APIs
- **[React 19](./react-19.md)** - Actions, new hooks, React Compiler, form improvements

### Authentication & Styling
- **[NextAuth v5](./nextauth-v5.md)** - Auth.js rewrite, universal auth() function, App Router-first
- **[Tailwind CSS v4](./tailwindcss-v4.md)** - CSS-first configuration, @theme directive, performance improvements

## How to Use This Documentation

1. **Identify the tools** you'll be working with in your task
2. **Read the relevant documentation files** before writing code
3. **Follow the patterns and examples** shown in the docs
4. **Check project-specific notes** to see how tools are configured in this project
5. **Refer to troubleshooting sections** if you encounter issues

## Example Workflow

If you're asked to:
- "Add a new API route that requires authentication"
  → Read: Next.js 16 (API routes), NextAuth v5 (auth patterns)
  
- "Update the database schema and create a migration"
  → Read: Prisma 7.3 (schema changes, migrations)
  
- "Create a new form component with validation"
  → Read: React 19 (forms, useActionState), Tailwind CSS v4 (styling)
  
- "Fix styling issues with dark mode"
  → Read: Tailwind CSS v4 (theme configuration, custom variants)

## Related Documentation

- [`../epics/`](../epics/) - Epic completion reports
- [`../../AGENT_CONTEXT.md`](../../AGENT_CONTEXT.md) - Project architecture and development guidelines
- [`../../README.md`](../../README.md) - Project overview

---

**Remember:** These tools have changed significantly. Always check the documentation before assuming you know the current API or patterns.
