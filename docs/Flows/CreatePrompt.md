```mermaid

---
title: Prompt Box Create Prompt (Detailed)
---

flowchart TD
    A[Home Page] --> B[Create Prompt Page]
    B --> C[Enter Prompt Content]
    C --> D[Select AI Model]
    D --> E{Categorize?}
    E -->|Existing Category| F[Select Category]
    E -->|New Category| G[Create New Category]
    F --> H[Sharing Settings]
    G --> H
    H --> I{Share with Team?}
    I -->|Yes| J[Select Target Team(s)]
    I -->|No| K[Mark as Private]
    J --> L[Save Prompt]
    K --> L
    L --> M[Success Page]
```