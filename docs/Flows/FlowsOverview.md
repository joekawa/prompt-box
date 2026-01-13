# User Journey & Process Overview

## Introduction
This document outlines the core workflows within **Prompt Box**. It translates the technical diagrams into business-friendly narratives, explaining how users interact with the system to achieve their goals.

---

## 1. Accessing the Platform
**Goal:** Securely log in or register a new organization.

*   **For New Organizations:**
    *   Visitors land on the **Sales/Welcome Page**.
    *   They can **Request a Trial**, which leads them to the **Registration Page**.
    *   Upon successful registration, they are taken to their new **Home Page**.
*   **For Existing Users:**
    *   Users click "Login" and enter their credentials (Email/Password).
    *   Successful login directs them immediately to their **Home Page**.
    *   *Note:* If login fails, they remain on the login screen to retry.

## 2. Managing Your Organization
**Goal:** Growing the team and structuring your organization.

*   **Adding a User:**
    *   From the **Home Page**, an Administrator selects the option to **Add User**.
    *   They fill out the new user's details (Email, Name, Role).
    *   **Success:** The system confirms the addition.
*   **Managing Teams:**
    *   Admins can create new **Teams** (e.g., "Marketing", "DevOps") and nest them if needed.
    *   Users can be assigned to one or multiple teams with specific roles.

## 3. Creating Knowledge (Prompts)
**Goal:** Adding a new AI prompt to the library with proper classification.

*   **The Process:**
    *   **Drafting:** Users enter the prompt text, description, and select the AI model.
    *   **Categorization:** Users select an existing Category (e.g., "Email", "Code") or create a new one.
    *   **Sharing Settings:** Users decide who can see the prompt:
        *   **Private:** Only visible to the creator.
        *   **Shared:** Visible to specific Teams.
    *   **Completion:** The prompt is saved and immediately accessible to authorized users.

## 4. Finding Knowledge (Search)
**Goal:** Quickly locating the right prompt for a task.

The system offers two main paths to find content:
1.  **Direct Navigation (Browsing):**
    *   Browse by **Organization** (Global) or **Team** (Specific).
2.  **Search:**
    *   Use the **Global Search** feature to find prompts by keyword, tag, or content.

## 5. Roles & Permissions (RBAC)
**Goal:** Ensuring users only access what they need.

*   **Admins:** Have full control. Can manage users, teams, billing, and view all prompts.
*   **Members:** Can create and edit their own prompts, and view prompts shared with their Teams.
*   **Viewers:** Read-only access. Can execute prompts but cannot modify them or system settings.
