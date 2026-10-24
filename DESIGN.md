# Visual System Design (Incumbent)

## Color Palette
- `--bg`: `#f8f9fa` (Light gray background)
- `--text`: `#212529` (Dark gray text)
- `--primary`: `#0d6efd` (Bootstrap-style blue)
- `--border`: `#dee2e6` (Light gray border)
- `--danger`: `#dc3545` (Red for errors/destructive actions)
- `--warning`: `#ffc107` (Yellow for warnings)
- `--warning-bg`: `#fff3cd` (Light yellow background for banners)

## Typography
- Font Family: `system-ui, -apple-system, sans-serif`
- Line Height: 1.5

## Layout & Spacing
- Container: Max-width 800px, centered, 20px padding.
- Cards: White background, 20px padding, 8px border radius, subtle shadow (`0 1px 3px rgba(0,0,0,0.1)`).
- Tables: 100% width, collapsed borders, 8px padding.
- Forms: Inputs/Selects have 6px padding, 4px border radius.
- Buttons: 8px 16px padding, 4px border radius.

## Critique/Analysis of Current System
- **Pros:** Functional, clean, uses native system fonts. High contrast for readability.
- **Cons:** Extremely generic (resembles default Bootstrap). Lacks personality or a cohesive design language. Borders and structural elements (like tables) feel rigid and dated. Interactive states (hover, focus) are minimal or non-existent on some elements.
