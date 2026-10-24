# Visual System Design (Target World)
<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

## Overview
**Creative North Star: "Academic Calm & Consumer Precision."**
The UIU Calculator is a modern, ultra-clean utility app that turns the stressful task of calculating academic performance and fees into a calming, confident experience. It rejects the heavy, dense aesthetic of typical university portals in favor of a sleek, consumer-grade feel—similar to modern fintech or high-end productivity tools. The interface is highly dense but breathable, minimizing scrolling through compact layouts and utilizing breathtaking, purposeful micro-interactions to guide the user seamlessly through a single-page flow.

**Key Characteristics:**
- **Calm & Confident:** A slate/zinc neutral palette that reduces visual fatigue, accented by a vibrant, optimistic orange for primary actions.
- **Ultra-Compact, High Density:** Information is packed efficiently but separated by deliberate whitespace and subtle borders to eliminate the need for excessive scrolling.
- **Fluid & Responsive:** Built mobile-first. Transitions between states (tabs, results loading) are buttery smooth, giving a sense of instantaneous response.
- **Academic Clean:** Typography is highly legible, structured, and hierarchical. No visual noise.

## Colors
**The Strategic Accent Rule.** Never use the accent orange for backgrounds or large areas. It is strictly reserved for primary actions (calculate buttons, active states) and key data highlights. Everything else rests on a scale of cool, calming zinc.

- **Primary Action:** Vibrant Orange [to be resolved during implementation]
- **Surface & Backgrounds:** Cool Zinc / Slate scale [to be resolved during implementation]
- **Text & Borders:** High-contrast neutral steps [to be resolved during implementation]
- **Semantic (Success/Error/Warning):** [to be resolved during implementation]

## Typography
**The Data-First Rule.** Use a highly legible, modern sans-serif for UI elements, paired with a tabular-lining geometric font or monospaced font for all numbers, credits, and grades to ensure they align perfectly in tables and compact views.

- **Primary UI Font:** [to be resolved during implementation]
- **Data/Numeric Font:** [to be resolved during implementation]

## Layout
**The Compact Canvas Rule.** The layout must fit as much critical data into the initial viewport as possible without feeling cluttered. Use progressive disclosure for secondary information. The app is strictly a single page; tabs or segmented controls switch contexts instantly without page reloads.

- **Mobile First:** Optimized for 375px widths.
- **Density:** Tight padding on tabular data, generous padding around macro-sections.

## Elevation & Depth
**The Flat & Crisp Rule.** Avoid heavy drop shadows. Depth is created through subtle border treatments (1px solid var(--border-subtle)) and slightly tinted surface backgrounds. Popovers or floating elements use a very tight, crisp shadow.

- **Surface Depth:** [to be resolved during implementation]
- **Interactive Depth:** [to be resolved during implementation]

## Shapes
**The Friendly Utility Rule.** Use moderate rounding (e.g., 8px or 12px) for structural containers to feel approachable, but keep inner data cells sharp or minimally rounded to maintain a serious, precise data feel.

- **Card Radius:** [to be resolved during implementation]
- **Control Radius:** [to be resolved during implementation]

## Do's and Don'ts
- **DO** animate the transition between states (e.g., expanding the fee breakdown, switching tabs) with breathtaking, swift motion.
- **DO** use a calming, neutral backdrop to make the data the hero.
- **DON'T** use heavy, generic Bootstrap-style borders and shadows.
- **DON'T** force the user to scroll long distances; compress forms and tables intelligently.
- **DON'T** use multiple colors for data unless semantically necessary (e.g., red for low grades, green for high grades).

