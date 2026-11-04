---
"@crafter/awake": patch
---

Harden setup and `awake on`: install the sudoers rule without a user-writable temp file, use an absolute `rm` path on uninstall, and arm the auto-off timer before disabling sleep.
