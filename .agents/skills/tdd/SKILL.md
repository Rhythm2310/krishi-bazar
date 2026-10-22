---
name: tdd
description: Test-first loop for any task that writes or changes behaviour. Load it before writing code. Red before green, one slice at a time, tests only at the seams your task file lists.
---

# Test-driven development (swarm edition)

Adapted from mattpocock/skills `tdd` (MIT). See `../NOTICE.md`.

A test is worth keeping when it describes behaviour through a public interface and survives any refactor that keeps behaviour. Everything below serves that.

## Seams: where tests live
A **seam** is the public boundary where you observe behaviour without reaching inside. Your task file lists them under "Seams under test" (ids S1, S2... from `.jules/spec.md`). Test at those seams only.
- Need a test the listed seams cannot express? Use the public interface of the module you own, record it in your report under "Seam added", and carry on. Never test internals.
- Only internals are reachable? Treat that as a design finding. Write it in the report; keep the code, skip the internal test.

## The loop (one slice at a time)
1. **Red.** Write one test for one behaviour at one seam. Run it. Confirm it fails for the right reason (the behaviour is missing, not a typo). Keep that failing line for your report.
2. **Green.** Write only enough code to pass. Speculative features wait for their own test.
3. **Next slice.** The last cycle teaches you what the next test should be. One test, one implementation, repeat. Each test is a tracer bullet.
4. Refactoring belongs to your self-review (skill `code-review`), run once all slices are green.

Writing every test first and every implementation after (horizontal slicing) tests imagined behaviour and locks in structure before you understand it. Stay vertical.

## Refactor and migration tasks
Pin current behaviour first: write characterization tests at the seam that pass on the untouched code (green-first), commit them, then change the code. The tests prove equivalence.

## Good and bad tests
Good: reads like a specification, calls the public interface, one logical assertion, describes WHAT.
```
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```
Implementation-coupled (rewrite): mocks internal collaborators, asserts call counts or order, reads the database to verify what the interface could confirm, breaks on refactor with unchanged behaviour.
```
// verify through the interface
const user = await createUser({ name: "Alice" });
expect((await getUser(user.id)).name).toBe("Alice");
```
Tautological (rewrite): the expected value is computed the way the code computes it, so the test passes by construction. Expected values come from an independent source: a literal, a worked example, the spec.
```
expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
```

## Mocking
Mock at system boundaries: external APIs, time and randomness, the filesystem when needed, the database only when a test database is unavailable. Your own modules and collaborators stay real.
- Pass dependencies in (`processPayment(order, paymentClient)`); constructing a client inside the function makes it untestable.
- Prefer one function per external operation (`api.getUser`, `api.createOrder`) over one generic `fetch(endpoint, options)`. Each mock then returns one shape with no branching in test setup.

## Evidence for the report
List: seams used, first-red output per slice (one line each), final green run. The reviewer reads this to confirm tests came first.
