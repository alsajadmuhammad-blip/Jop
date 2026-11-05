---
name: Mobile file pickers
description: Reliable activation for custom upload controls on mobile browsers.
---

For custom file pickers in the candidate profile, make the actual file input cover the visible upload button with zero opacity instead of clipping it to 1px; mobile browsers may not activate a clipped label control reliably.

**Why:** The job-seeker CV picker was reported nonresponsive on a phone, and the source used a 1px clipped input.

**How to apply:** Keep the input interactive across the full button hit area and preserve a visible focus style. Verify file-picker activation on Android when possible.
