# ITSR Farewell Party

## Current State
All actors are anonymous (II removed). Upload fails because _initializeAccessControlWithSecret is only called when identity is truthy, but identity is always null.

## Requested Changes (Diff)

### Add
- Nothing

### Modify
- useActor.ts: Initialize with caffeineAdminToken for anonymous actors too

### Remove
- Nothing

## Implementation Plan
1. Read caffeineAdminToken before the auth branch
2. Call _initializeAccessControlWithSecret on anonymous actor when token present
