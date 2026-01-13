```mermaid

---
title: Prompt Box Add User
---

flowchart LR
    A[Home Page] --> B@{shape: diamond, label: "Add User?"}
    B -->| Yes | C[Add User Page]
    B -->| No | D[Home Page]
    C -->| Add User Successful | E[Home Page]
    C -->| Add User Failed | F[Add User Page]

```