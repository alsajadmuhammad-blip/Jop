---
name: Database change process
description: The user's process for database schema and logic changes in this project.
---

When database changes are needed, provide the SQL script in the conversation and do not connect to the database or execute it. The user will run the script.

**Why:** the user asked.

**How to apply:** inspect the existing schema and migrations, then give a complete, ordered SQL script for the user to apply themselves.
