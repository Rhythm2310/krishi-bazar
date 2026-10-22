# 0002. Money is integer paisa; quantities are per-unit decimals; totals are server-side

Status: accepted | Date: 2026-10-22

## Context
Both legacy versions computed money with binary floating point (`float(f["price"])`,
`qty * (price + rate)`), which cannot represent decimal taka exactly and drifts under rounding.
Alternatives considered: decimal libraries (added dependency, serialization friction across the
wire), storing taka floats (rejected — the defect being fixed), storing taka with 2 decimal
places as NUMERIC (viable, but arithmetic still needs careful rounding at every step).

## Decision
Every money value — unit prices, surcharge rates, order totals — is stored and computed as an
integer number of paisa (১ টাকা = ১০০ পয়সা). Order quantities are decimals in the Listing's unit
(kg and maund: 2 decimal places; piece: integer). Order totals are computed only by one pure
server-side pricing function; the client displays a live estimate using the same pure function
bundled into the browser, never its own arithmetic. Display converts paisa to taka with Bengali
or ASCII numerals per Locale.

## Consequences
Money arithmetic is exact and property-testable (totals never drift more than one paisa from the
sum of parts; stock is conserved). Rounding happens in exactly one audited place. The cost: every
form input, API field and display must convert taka↔paisa explicitly — forgetting a conversion
is a type-level error, which is the point. Do not introduce floats into any money path.
