```mermaid

---
title: Prompt Box Team Management
---

flowchart TD
    A[Admin Dashboard] --> B{Action?}
    B -->|Create Team| C[New Team Form]
    B -->|Manage Team| D[Select Existing Team]

    C --> C1[Enter Team Name]
    C1 --> C2[Select Parent Team (Optional)]
    C2 --> C3[Save Team]

    D --> E{Modify?}
    E -->|Add Member| F[Select User]
    F --> F1[Assign Role]
    F1 --> F2[Save Membership]

    E -->|Remove Member| G[Confirm Removal]
    E -->|Edit Details| H[Update Name/Description]

```
