# ABHI JOBS — PERMANENT RESPONSIVE DESIGN & DEVELOPMENT RULES

This is a **GLOBAL DEVELOPMENT RULE** for the entire ABHI JOBS platform.

Every change, feature, component, page, section, button, navigation item, form, dashboard, card, icon, animation, popup, modal, table, filter, or layout modification **MUST be fully responsive across ALL supported device sizes**:

## 1. Supported Device Categories
- **Mobile** (320px, 360px, 375px, 390px, 414px, 430px)
- **Tablet** (600px, 768px, 820px, 834px, 1024px)
- **Laptop / Desktop** (1024px, 1280px, 1366px, 1440px, 1600px, 1920px)

## 2. Responsive-First Rules
- **No Overlapping Elements**: Never allow text, icons, badges, dropdowns, buttons, or navigation items to collide or sit on top of each other.
- **Badge Positioning**: Notification and counter badges must be positioned relative to their parent icon container (using inner wrappers), with appropriate offsets (e.g. `-top-1.5 -right-1.5`) and white ring borders, so they never cover icon bodies or cause layout shifts.
- **Brand Logo Responsiveness**: On extra-compact mobile screens (`< 640px`), show the emblem and the bold ABHI JOBS wordmark; display full taglines ("Discover. Apply. Grow.") responsively on tablet/desktop viewports (`sm:` and above) to preserve header breathing room.
- **Header Structure**: The header must maintain strict non-colliding order (`Logo` | `Nav / Links` | `Notifications` | `Profile` | `Menu`), with `shrink-0` on critical interactive controls and flexible containers with `min-w-0` to avoid horizontal overflow.
- **Fluid Sizing over Fixed Widths**: Avoid rigid pixel widths like `width: 500px`. Use `w-full max-w-[...]` and responsive constraints instead.
- **Forms & Inputs**: Full-width single column on mobile, comfortable touch targets (minimum 44px), with legible labels and contained select menus.
- **Cards & Grids**: Reflow from 1-column on mobile, to 2-columns on tablet, to 3- or 4-columns on desktop. Never let cards squeeze below readable thresholds.
- **Overlays & Modals**: Max width constrained to `max-w-[calc(100vw-2rem)]`, with internal scrolling for long content and accessible touch close buttons.
- **No Horizontal Viewport Overflow**: Every page and layout must be strictly contained within the viewport width with no unintended horizontal scrollbars.
