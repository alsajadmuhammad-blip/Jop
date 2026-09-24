---
name: Role navigation
description: Navigation structure for candidate, HR, and admin dashboards.
---

The application-level `MainSidebar` is the single source of navigation for every authenticated role. It contains role-specific destinations without creating a separate sidebar or tab system inside each page; mobile opens this same sidebar as a drawer.

**Why:** Repeated header links, dashboard tabs, and mobile controls created conflicting logout placement and crowded HR copy on small screens.

**How to apply:** Add new role destinations to `MainSidebar` and lift section state to the app shell. Keep the single logout action in the main sidebar and leave the public header limited to public actions plus the account/menu control.