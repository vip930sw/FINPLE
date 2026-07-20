# Step 114-2X-W execution closeout receipt

## Completion-only contract

The Step W closeout receipt is created only after all of the following are true:

- the Step T public state is completed;
- its exact twenty-state runtime trace and trace hash validate;
- adapter invocation, destination, and observation counts are exactly one;
- sanitized receipt, evidence, and execution-closure IDs and hashes reconstruct;
- disposal is completed and the Step T lease terminal state is `completed`;
- the Step W envelope claim is conclusively terminalized as `completed`.

No completed receipt is created for a blocked result, ambiguous acquisition or
terminalization, timeout without conclusive reconciliation, invalid receipt,
invalid evidence, invalid closure, disposal uncertainty, or invalid lease
terminalization.

## Bound fields

The domain-separated closeout ID/hash binds only approved sanitized material:

- merged main SHA;
- Step V approval and envelope ID/hash pairs;
- Step W claim ID/hash and terminalization hash;
- Step U evidence, runtime-material, and inventory ID/hash pairs;
- Step T operation-plan hash and Step S launch ID/hash;
- Step T sanitized receipt, evidence, and closure ID/hash pairs;
- complete Step T runtime-trace hash;
- destination, observation, and adapter invocation counts;
- disposal and both lease/claim terminal states;
- effective expiry and explicit execution clock;
- single-use, no-retry, no-second-invocation, no-mutation, and no-raw-material
  attestations.

The result is canonical, deterministic, recursively frozen, and sanitized. It
contains no endpoint, host, provider/account/database identity, observation raw
value, artifact byte, credential, token, certificate, exception, stack, path,
or command.
