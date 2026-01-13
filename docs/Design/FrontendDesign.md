# Prompt Box Frontend Design System

This document outlines the design decisions, styling guidelines, and architectural patterns used in the Prompt Box frontend application. The design philosophy focuses on a **minimalistic, enterprise-grade aesthetic** that prioritizes clarity, efficiency, and scalability.

## 1. Design Philosophy

*   **Enterprise-Focused**: Clean, professional look suitable for B2B environments.
*   **Minimalistic**: Reduced visual noise to focus on the core utility of prompt management.
*   **Content-First**: UI elements recede to let the prompts and organizational structure take center stage.
*   **Responsive**: Layouts adapt to different screen sizes (though primarily optimized for desktop workflows).

## 2. Color Palette

We use a restrained color palette based on Slate and Blue tones to convey reliability and professionalism.

| Variable | Hex Code | Usage |
| :--- | :--- | :--- |
| `--primary-color` | `#0f172a` | Headings, Primary Buttons, Active States (Dark Navy) |
| `--secondary-color` | `#64748b` | Subtitles, Icon Outlines, Secondary Text (Slate Gray) |
| `--accent-color` | `#2563eb` | Links, Active Navigation Items, Highlights (Royal Blue) |
| `--text-color` | `#1e293b` | Body Text (Dark Slate) |
| `--bg-color` | `#ffffff` | Page Backgrounds, Cards |
| `--light-gray` | `#f8fafc` | Dashboard Background, Hover States |

## 3. Typography

*   **Font Family**: Native System Fonts stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, etc.) for maximum performance and native feel on all OSs.
*   **Weights**:
    *   **Regular (400)**: Body text
    *   **Medium (500)**: Navigation labels, Form labels
    *   **Semi-Bold (600)**: Buttons, Subheadings
    *   **Bold (700)**: Page Titles (`h1`)

## 4. Layout & Navigation

### Dashboard Layout
The application uses a classic **sidebar + main content** layout pattern, commonly found in SaaS applications.

*   **Sidebar**: Fixed position on the left.
*   **Main Content**: Scrollable area on the right, taking up remaining width.

### Side Navigation (Sidebar)
The sidebar is the primary navigation mechanism.

*   **Collapsible**:
    *   **Expanded (240px)**: Shows icons and text labels. Default state or user-toggled.
    *   **Collapsed (64px)**: Shows only icons. Content tooltips appear on hover.
*   **Structure**:
    *   **Header**: Toggle button (Hamburger/Chevron) to expand/collapse.
    *   **Primary Menu**:
        *   **Home**: Dashboard overview.
        *   **Create Prompt**: Primary action (marked with `PlusCircle` icon).
        *   **My Folder**: Private prompts.
        *   **Public Folder**: Shared organization prompts.
        *   **Manage Teams**: Admin/Manager function.
        *   **Manage Users**: Admin function.
    *   **Footer**: Pinned to the bottom. Contains the **Profile** link.
*   **Active State**: Highlighted with `--accent-color` background (`#eff6ff`) and a right border strip.

## 5. Components

### Buttons
*   **Primary (`.btn-primary`)**: Solid background (`#0f172a`), white text. Used for main actions (e.g., "Login", "Create Prompt").
*   **Secondary (`.btn-secondary`)**: Transparent background, primary color border. Used for alternative actions.
*   **Text (`.btn-text`)**: No border/background. Used for navigation links or less prominent actions ("Back to Home").

### Forms
*   **Container**: Centered, white card with subtle shadow on a light gray background.
*   **Inputs**: Full-width, standard padding, light border (`#cbd5e1`) that turns blue (`--accent-color`) on focus.
*   **Validation**: Error messages appear in a red box (`#fef2f2`) above the form.

### Icons
*   **Library**: [Lucide React](https://lucide.dev/)
*   **Usage**: consistent stroke width, typically 20px or 24px size. Used in navigation and feature highlights.

## 6. CSS Architecture

*   **Global Styles**: defined in `App.css` under `:root` and `body`.
*   **Utility Classes**: helper classes like `.page-container`, `.animate-spin`.
*   **Component Styles**: Scoped via BEM-like naming convention (e.g., `.sidebar`, `.sidebar-header`, `.nav-item`).

## 7. Future Considerations
*   **Theme Support**: The CSS variable structure allows for easy implementation of Dark Mode in the future.
*   **Mobile Support**: The collapsible sidebar can be easily adapted to a slide-out drawer for mobile devices.
