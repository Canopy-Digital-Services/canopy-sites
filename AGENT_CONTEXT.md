# Agent Context - Can-O-Forms

**📌 ADD THIS DOCUMENT TO THE START OF EACH AI CODING SESSION**

## Project Status
✅ **FULLY FUNCTIONAL** - This is a complete, working v2 application in production
- Deployed at: `https://canoforms.canopyds.com`
- v2 migration is **COMPLETE** (ignore git deleted files from old structure)
- All core features are implemented and working

## Critical: What NOT to Do
❌ **DO NOT** create stub components to fix build errors
❌ **DO NOT** replace existing components with simplified versions
❌ **DO NOT** assume incomplete features need to be built from scratch
✅ **DO** check `.cursor-server/data/User/History/` for existing implementations
✅ **DO** ask the user before major refactors or component creation
✅ **DO** prefer minimal, targeted fixes over architectural changes

## Architecture Overview

### Route Structure
```
OLD (v1): /sites/[siteId]/forms/[formId]/...  ← REMOVED, ignore in git status
NEW (v2): /forms/[formId]/...                 ← CURRENT STRUCTURE
```

### Component Organization
```
src/
├── actions/
│   └── forms.ts                    ← Centralized form actions (no siteId param needed)
├── components/
│   ├── form-fields-manager.tsx     ← CRITICAL: 200-line field CRUD component
│   └── forms/                      ← Form editor components (all complete)
│       ├── form-editor.tsx         ← Main editor with auto-save, panels
│       ├── integrate-panel.tsx     ← Embed code generator
│       ├── fields-section.tsx      ← Field list wrapper
│       ├── behavior-section.tsx    ← Success/redirect settings
│       ├── appearance-section.tsx  ← Theme customization
│       ├── site-selector.tsx       ← Move forms between sites
│       └── preview-panel.tsx       ← Live form preview
└── lib/
    └── data-access/
        └── forms.ts                ← Form data access helpers
```

### Key Architecture Decisions
1. **Server Components by Default**: Most pages are server components that fetch data and pass to client components
2. **Actions Pattern**: All mutations go through centralized actions in `src/actions/forms.ts`
3. **No siteId in URLs**: Forms are accessed directly via `/forms/[formId]`, ownership verified through Form → Site → User chain
4. **Component Props Flow**: Server pages pass runtime config (like `apiUrl`) down to client components

## Known Configuration Issues

### The `NEXT_PUBLIC_APP_URL` Problem (SOLVED)
**Issue**: Client components can't read `process.env.NEXT_PUBLIC_APP_URL` at runtime (it's baked in at build time)

**Solution**: 
- Server components read env vars at runtime
- Pass `apiUrl` as prop to client components
- Files involved: `page.tsx` → `form-editor.tsx` → `integrate-panel.tsx`

**DO NOT** revert this pattern back to client-side env var reading!

## Deployment Setup

### Docker Build Process
1. `Dockerfile` passes `NEXT_PUBLIC_APP_URL` as build arg
2. `docker-compose.yml` sets build args and runtime env vars
3. Build process:
   ```bash
   npm run embed:build   # Build vanilla JS embed script
   npx prisma generate   # Generate Prisma client
   npm run build         # Build Next.js app (standalone mode)
   ```

### Environment Variables
- `NEXT_PUBLIC_APP_URL`: Public URL (build-time for fallback, runtime via props)
- `NEXTAUTH_URL`: Auth URL (runtime)
- `DATABASE_URL`: PostgreSQL connection (runtime)
- `NEXTAUTH_SECRET`: Auth secret (runtime)
- `SMTP_*`: Email settings (runtime)

## Common Tasks

### Adding a New Form Field Type
1. Update `prisma/schema.prisma` enum `FieldType`
2. Update `embed/src/form.ts` to handle new type
3. Rebuild embed: `npm run embed:build`
4. Update `src/components/field-editor-modal.tsx` to allow creation

### Fixing Embed Code Issues
1. Check `embed/src/` source files
2. Run `npm run embed:build` to compile to `public/embed.js`
3. Rebuild Docker if needed for deployment

### Testing Locally
```bash
npm run dev          # Start dev server (http://localhost:3006)
npm run embed:build  # Rebuild embed script
```

## File History & Recovery
If you accidentally modify/delete components, check:
```bash
# Cursor history (components often saved here)
/home/truehoax/.cursor-server/data/User/History/

# Git history
git show HEAD:path/to/file.tsx
git restore path/to/file.tsx
```

## Troubleshooting Decision Tree

### Build Error in Missing Component?
1. ❌ DON'T create a stub component
2. ✅ DO check cursor history: `find ~/.cursor-server/data/User/History -name "*.tsx" -exec grep -l "ComponentName" {} \;`
3. ✅ DO ask user if component exists elsewhere
4. ✅ DO check if import path is wrong (e.g., old `/sites/` path vs new `/forms/` path)

### Client Component Needs Runtime Config?
1. ❌ DON'T read `process.env` in client components
2. ✅ DO pass as prop from parent server component
3. Example pattern:
   ```tsx
   // page.tsx (server component)
   const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006";
   return <ClientComponent apiUrl={apiUrl} />;
   ```

### User Reports Missing Functionality?
1. ❌ DON'T assume it needs to be built
2. ✅ DO check if you accidentally stubbed/deleted it
3. ✅ DO check git/cursor history
4. ✅ DO ask user to clarify what's missing

## Quick Reference: Critical Components

These components are COMPLETE and SHOULD NOT be replaced with stubs:

| Component | Lines | Purpose | Location |
|-----------|-------|---------|----------|
| `FormFieldsManager` | ~200 | Full field CRUD with drag-drop | `src/components/` |
| `FormEditor` | ~150 | Main editor UI with panels | `src/components/forms/` |
| `IntegratePanel` | ~175 | Embed code generator | `src/components/forms/` |
| `FieldList` | ~100 | Draggable field list | `src/components/` |
| `FieldEditorModal` | ~200 | Field creation/edit modal | `src/components/` |

## When to Ask vs. Proceed

### ASK THE USER IF:
- You think you need to create a new component > 50 lines
- You're about to delete/stub an existing component
- Build errors reference missing components
- You're unsure if feature exists or needs building
- Major architectural changes seem needed

### PROCEED IF:
- Making targeted bug fix (< 10 lines changed)
- Updating environment config
- Fixing import paths
- Adding comments/documentation
- Updating dependencies
