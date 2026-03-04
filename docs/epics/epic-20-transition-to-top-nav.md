# Epic: Transition from Sidebar Navigation to Top Navigation Layout

## Overview

The current application layout uses a persistent left sidebar navigation. This pattern is typically appropriate for large applications with many global navigation sections. However, Canopy Forms is currently a focused application with only a small number of global navigation destinations.

This epic proposes transitioning the application to a **Top Navigation Layout** (horizontal navigation bar) that better reflects the current scope and structure of the product.

The goal is not to finalize every UI detail immediately, but to establish the correct architectural pattern for navigation going forward.

## Motivation

The current sidebar creates several issues:

* It implies a larger application structure than currently exists
* It consumes horizontal space that could be used by the editor and dashboards
* The number of navigation items does not justify a persistent sidebar
* Users naturally expect the logo to function as a "home" navigation element

Moving to a top navigation layout aligns the UI with common patterns used by focused SaaS tools.

## Design Direction

Adopt a **Top Navigation App Layout** where global navigation is presented in a horizontal bar at the top of the application.

This layout should:

* Replace the left sidebar with a top navigation bar
* Allow the logo to function as the primary "home" link
* Provide space for global navigation items
* Provide a location for primary actions (such as creating a new form)
* Provide access to account-related actions via a user menu

The exact visual arrangement is intentionally flexible and can evolve during implementation.

## Expected Navigation Structure

At a high level, the top navigation bar should support the following elements:

Left side

* Product logo

  * Clicking the logo should return the user to the forms dashboard

Center / main navigation

* Forms
* Help

Right side

* Primary action (Create Form)
* User menu (account management and sign out)

Exact placement and spacing can be refined during implementation.

## Relationship to the Rest of the App

This navigation bar represents **global navigation**.

Local or contextual navigation should be handled within individual pages when appropriate. For example, the form editor may have its own internal navigation or tabs (such as Build, Appearance, Submissions, Settings).

This epic only concerns the **global application layout**, not page-specific navigation patterns.

## Implementation Goals

The implementation should:

* Remove the existing sidebar navigation
* Introduce a reusable top navigation component
* Ensure all existing navigation destinations remain accessible
* Maintain consistent layout behavior across all pages

The solution should remain flexible enough to accommodate additional navigation items in the future without requiring another layout overhaul.

## Non-Goals

This epic does not aim to:

* Finalize the exact visual design of the navigation bar
* Define the final structure of the user account dashboard
* Introduce new navigation destinations
* Redesign page-level layouts beyond what is necessary to remove the sidebar

## References

Examples of applications using similar top navigation patterns include:

* Plausible Analytics
* Resend
* Buttondown
* Vercel

These tools favor horizontal navigation for smaller, focused SaaS products instead of sidebar-heavy dashboard layouts.

## Outcome

After completion, the application should feel more like a focused tool rather than a large multi-section dashboard. The interface should emphasize the primary object of the system (forms) while keeping global navigation lightweight and unobtrusive.
