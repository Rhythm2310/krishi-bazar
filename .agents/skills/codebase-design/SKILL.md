---
name: codebase-design
description: Shared vocabulary and rules for deep modules (much behaviour behind a small interface, placed at a clean seam). Load it for foundation, design-heavy, refactor and review tasks.
---

# Codebase design (swarm edition)

Adapted from mattpocock/skills `codebase-design` (MIT). See `../NOTICE.md`.

Use these words exactly. Consistent language is the point; do not substitute "component", "service", "API" or "boundary".

- **Module**: anything with an interface and an implementation, at any scale (function, class, package, slice).
- **Interface**: everything a caller must know: type signature, invariants, ordering, error modes, configuration, performance.
- **Seam**: the place where a module's interface lives and behaviour can change without editing in place.
- **Adapter**: a concrete thing satisfying an interface at a seam.
- **Depth**: behaviour a caller can exercise per unit of interface learned. **Deep** = lots of behaviour behind a small interface. **Shallow** = interface nearly as complex as the implementation.
- **Leverage**: what callers gain from depth. **Locality**: what maintainers gain; change, bugs and verification concentrate in one place.

## Principles
- Depth is a property of the interface, not the implementation. A deep module may be built from small internal parts that are not part of its interface.
- **Deletion test**: imagine deleting the module. Complexity vanishes: it was a pass-through. Complexity reappears across N callers: it earns its keep.
- The interface is the test surface. If you need to test past it, the module is the wrong shape.
- One adapter is a hypothetical seam; two adapters is a real one. Add a seam only where something actually varies.

## Designing for testability
1. Accept dependencies; do not create them inside.
2. Return results; avoid hidden side effects.
3. Keep the surface small: fewer methods and parameters mean fewer tests and simpler setup.

## In this swarm
- The directory you own is a module. Its frozen contract in `contracts/**` is its interface. Keep both small and keep the behaviour behind them.
- Frozen contracts make disjoint ownership possible: that is why interfaces are decided before the wave starts, and why you never edit them.
- When designing inside your paths, prefer deepening an existing module over adding a new shallow one.
