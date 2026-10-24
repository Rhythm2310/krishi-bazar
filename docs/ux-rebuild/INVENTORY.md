# UX Rebuild Inventory

## Routes & Pages
- `App.tsx`: Main application shell with navigation and tab routing. `[status: done]`
- Tab: GPA Calculator (`GpaCalculator.tsx`). `[status: done]`
- Tab: CGPA Planner (`CgpaPlanner.tsx`). `[status: done]`
- Tab: Fee Breakdown (`FeeBreakdown.tsx`). `[status: done]`
- Tab: Data & Settings (`DataPage.tsx`). `[status: done]`

## Components & Layouts
- Global Layout: Header (title, nav, banner), Main content area, Footer (disclaimer, sources, policies). `[status: done]`
- `ErrorBoundary.tsx`: Error fallback wrapper. `[status: todo]`
- Cards: `.card` styles used across tabs. `[status: done]`
- Tables: Basic HTML tables used for inputs and data display. `[status: done]`

## User Flows & States
- GPA Calculation Flow (Happy path, validation errors). `[status: done]`
- CGPA Planning Flow (Current stats + target inputs -> required term GPA). `[status: done]`
- Fee Breakdown Flow (Program selection, credit input -> fee calculation). `[status: done]`
- Overrides Flow (Data & Settings: modifying default fee values -> saving -> banner appearance). `[status: done]`
- Empty States: Initial load states. `[status: done]`
- Error States: Input validation errors (e.g., in parseInputs). `[status: done]`

## Copy
- Headings: "UIU Calculator", "GPA", "CGPA Planner", "Fees", "Data & Settings", etc. `[status: done]`
- Form Labels, Table Headers (e.g., "Credits", "Grade", "Current CGPA", "Target CGPA", "Program"). `[status: done]`
- Banner text: "Custom fees active". `[status: done]`
- Footer text: Disclaimers, source pages, policy summary. `[status: done]`
- Error messages. `[status: done]`

## Forms & Controls
- Navigation buttons (`nav button`). `[status: done]`
- Input fields (text/number inputs for credits, grades, etc.). `[status: done]`
- Select dropdowns (e.g., program selection). `[status: done]`
- Action buttons ("Calculate", "Add Row", "Remove", "Save", "Reset"). `[status: done]`

## Global Concerns
- Theming & Colors (`var(--bg)`, `var(--primary)`, etc.). `[status: done]`
- Typography (system-ui, sans-serif). `[status: done]`
- Spacing & Layout (margins, paddings, gap). `[status: done]`
- Responsiveness (`max-width: 800px`, some mobile media queries in `App.css`). `[status: done]`
- Accessibility (basic HTML semantics, needs audit). `[status: todo]`
