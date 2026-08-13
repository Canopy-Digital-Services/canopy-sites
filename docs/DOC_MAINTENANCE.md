# Doc Maintenance

Rules for editing `docs/AGENT_CONTEXT.md`, `docs/UX_PATTERNS.md`, and `docs/VERIFICATION_CHECKLIST.md`.

These docs are read by coding agents, not people browsing. Their value is density and accuracy, not completeness or flow. Each rule below exists because the opposite happened and cost something real.

## Before you add anything

1. **Verify against the code first.** Open the file and confirm the class name, path, prop, or default. Never document from memory or from another doc.
2. **Search for the fact before writing it.** If it is already stated somewhere in these docs, add a cross-reference or extend the existing statement. Do not write a second version of it.
3. **Ask whether an agent could derive it with one grep.** Directory listings, script names, exported symbols, and prop tables are derivable and will rot. Skip them. Document the rule attached to a path, not the path.

## Writing

4. **State the rule, not a hedge.** "Changes outside these paths do not trigger a deploy", not "may not trigger". Ambiguity reads as optional.
5. **Rationale only when it prevents recurrence**, in one or two sentences. Keep the explanation of why brand hexes must not be hand-converted to oklch, because it happened twice. Cut "asterisks are a universally recognized convention", which persuades nobody who was going to comply anyway.
6. **Prefer a short canonical snippet plus a reference-implementation link** over a long code block. Long blocks get pattern-matched and reproduced verbatim, stale class names included.
7. **No numbers that rot.** No line counts of other docs, no "~1900 lines", no exhaustive file tables. If a count matters, point at the file that holds it.
8. **No em dashes.** Use colons, parentheses, semicolons, or a second sentence.
9. **Skip anything addressed to a reader's motivation.** No "your role", no "implement features safely". The system prompt covers behavior; these docs carry repo facts.

## Structure

10. **One index, no summaries.** Never add a table of contents, quick-reference table, or per-section recap. `UX_PATTERNS.md` had a Quick Reference that drifted from its own body and ended up asserting the wrong typeface, and a File References table that pointed at a deleted component. Markdown headings are already navigable.
11. **Where a doc has a dedicated rule set, new rules go there.** In `UX_PATTERNS.md` that is section 1, which is meant to be complete on its own so a partial read is still safe. Put the detail in the topic section and the prohibition in the rule set, not one in place of the other.
12. **Renaming or renumbering a section means grepping for references to it.** `CLAUDE.md`, `VERIFICATION_CHECKLIST.md`, and the other docs cite sections by number.

## When behavior changes

13. **Delete what the change superseded.** Do not leave the old section beside the new one. `UX_PATTERNS.md` carried a 31-line description of a view page that had been replaced by `FormWorkspace`, and any agent following it would have rebuilt a deleted UI.
14. **When you find two statements that disagree, fix the wrong one.** Do not add a third statement that happens to be right. Grep for every place the rule appears and correct them in the same commit.
15. **A doc update belongs in the commit that changed the behavior**, not in a later cleanup pass.

## Concurrency

16. **Another session may be editing the same file.** Before a large write, run `git status` and re-read the section you are changing. Prefer targeted edits over rewriting a whole file, and never rewrite a file wholesale on the strength of a copy you read earlier in the session.

## Related

`CLAUDE.md` lists which doc to update for which kind of change. `VERIFICATION_CHECKLIST.md` has the pre-commit doc-impact table.
