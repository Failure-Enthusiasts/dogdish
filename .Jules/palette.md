## 2024-06-03 - Accessible Modal
**Learning:** Adding 'role=alertdialog' and 'aria-modal=true' are critical first steps, but correctly managing 'aria-hidden' on backdrop vs content is easy to mess up.
**Action:** Always verify that 'aria-hidden' is not applied to the parent of the element you want exposed to screen readers.
