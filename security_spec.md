# AgroVision AI — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Owner Isolation (PII & Grower Records)**: A user profile `/users/{userId}` and its subcollections (`/scans/{scanId}`, `/plants/{plantId}`, `/learningProgress/{moduleId}`) may only be read or mutated by the authenticated owner (`request.auth.uid == userId`) or a verified admin (`request.auth.token.email == 'yousaaf.awan56@gmail.com' && request.auth.token.email_verified == true`).
2. **No Self-Escalated Roles**: Users cannot assign `role: 'admin'` to themselves on create or alter `role` on update.
3. **Immutable Ownership & Creation Timestamps**: `uid` and `createdAt`/`serverCreatedAt` are immutable after document creation and verified against `request.auth.uid` and `request.time`.
4. **Master Gate Sync**: Every subcollection document (`scans`, `plants`, `learningProgress`) requires the parent `/users/{userId}` document to exist via `exists(/databases/$(database)/documents/users/$(userId))`.
5. **Bounded Payloads**: All strings and arrays have strict `.size()` caps (thumbnails <= 220KB, arrays <= 10 items, IDs <= 128 chars matching `^[a-zA-Z0-9_\-]+$`) to prevent resource poisoning.
6. **Verified Write Access**: Standard authenticated mutations require verified identity (`request.auth.token.email_verified == true`) or bootstrapped admin verification.

## 2. Adversarial "Dirty Dozen" Attack Payloads
1. Unauthenticated read on `/users/victim_uid` -> `PERMISSION_DENIED`.
2. Signed-in non-owner read/list on `/users/victim_uid/scans` -> `PERMISSION_DENIED`.
3. Self-escalation create on `/users/attacker_uid` with `{ role: 'admin', xp: 999999 }` -> `PERMISSION_DENIED`.
4. Shadow update injecting ghost key `{ isPremium: true }` on `/users/attacker_uid` -> `PERMISSION_DENIED`.
5. Spoofed `uid` mismatch creating `/users/userA/plants/p1` with `{ uid: 'userB' }` -> `PERMISSION_DENIED`.
6. Unverified email spoof (`email: 'yousaaf.awan56@gmail.com', email_verified: false`) reading another user -> `PERMISSION_DENIED`.
7. Client timestamp tampering (`createdAt` != `request.time`) on `/users/{uid}` create -> `PERMISSION_DENIED`.
8. Overwriting immutable `createdAt` or `uid` on plant update -> `PERMISSION_DENIED`.
9. Oversized payload poisoning (`summary` 50KB or `thumbnailUrl` > 220KB) on `LeafScan` -> `PERMISSION_DENIED`.
10. Invalid document ID (`../etc/passwd` or 500-char ID) failing `isValidId()` -> `PERMISSION_DENIED`.
11. Unbounded array injection (`linkedScanIds` with 50 items) failing array cap -> `PERMISSION_DENIED`.
12. Orphaned subcollection write when `/users/{uid}` parent does not exist -> `PERMISSION_DENIED`.
