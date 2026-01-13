```mermaid

---
title: Prompt Box RBAC (Role-Based Access)
---

flowchart TD
    A[User Login] --> B{Check Organization Role}

    B -->|Admin| C[Admin Dashboard]
    B -->|Member| D[Member Dashboard]
    B -->|Viewer| E[Read-Only View]

    C --> C1[Manage Users]
    C --> C2[Manage Teams]
    C --> C3[Billing/Settings]
    C --> C4[Full Prompt Access]

    D --> D1[Create Prompts]
    D --> D2[View Team Prompts]
    D --> D3[Edit Own Prompts]

    E --> E1[View Public/Team Prompts]
    E --> E2[Execute Prompts]
    E -->|Try to Edit| X[Access Denied]

```
