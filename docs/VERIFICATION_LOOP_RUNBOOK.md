# Production Verification Loop

Run the autonomous verifier before calling a branch production ready:

```bash
npm run verify:production
```

The loop runs every required step in order:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:unit`

## Interpreting Output

The branch is certified only when the script prints:

```text
PRODUCTION READY: full verification suite completed and passed.
```

Any other final line means the branch is not certified. Failed commands, aborted commands, or partial runs exit non-zero and print `NOT CERTIFIED` with the reason.

## Partial-Run Guard

The verifier tracks the required step list and the result for each completed step. It only certifies when every required step has a recorded `passed` result and the number of results matches the required step count. If lint passes but typecheck or unit tests never run, the final result is still `NOT CERTIFIED` because the suite was partial.
