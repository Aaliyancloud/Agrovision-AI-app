# AgroVision AI — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Owner Isolation (PII & Grower Records)**: A user profile `/users/{userId}` (including `email` and `phoneNumber`) and its subcollections (`/scans/{scanId}`, `/plants/{plantId}`, `/learningProgress/{moduleId}`) may only be read or mutated by the authenticated owner (`request.auth.uid == userId`) or a verified admin (`request.auth.token.email == 'yousaaf.awan56@gmail.com' && request.auth.token.email_verified == true`).
2. **No Self-Escalated Roles**: Users cannot assign `role: 'admin'` to themselves on create or alter `role` on update.
3. **Immutable Ownership & Creation Timestamps**: `uid`, `reporterUid`, and `createdAt`/`serverCreatedAt` are immutable after document creation and verified against `request.auth.uid` and `request.time`.
4. **Master Gate Sync**: Every subcollection document (`scans`, `plants`, `learningProgress`) requires the parent `/users/{userId}` document to exist via `exists(/databases/$(database)/documents/users/$(userId))`.
5. **Scan Report Queue Isolation**: `/scanReports/{reportId}` creation is bound to `request.auth.uid == reporterUid` with initial `status == 'open'`; only verified admins can list all reports, update triage `status`/`adminNote`, or delete reports; signed-in owners can read or list only their own reports.
6. **Bounded Payloads**: All strings and arrays have strict `.size()` caps (thumbnails <= 220KB, phone <= 32 chars, notes <= 1200 chars, arrays <= 12 items, IDs <= 128 chars matching `^[a-zA-Z0-9_\-]+$`) to prevent resource poisoning.
7. **Verified Admin Access**: Admin checks require verified identity (`request.auth.token.email_verified == true`).

## 2. Adversarial "Dirty Dozen" Attack Payloads
1. Unauthenticated read on `/users/victim_uid` -> `PERMISSION_DENIED`.
2. Signed-in non-owner read/list on `/users/victim_uid/scans` -> `PERMISSION_DENIED`.
3. Self-escalation create on `/users/attacker_uid` with `{ role: 'admin', xp: 999999 }` -> `PERMISSION_DENIED`.
4. Shadow update injecting ghost key `{ isPremium: true }` on `/users/attacker_uid` -> `PERMISSION_DENIED`.
5. Spoofed `uid` mismatch creating `/users/userA/plants/p1` with `{ uid: 'userB' }` -> `PERMISSION_DENIED`.
6. Unverified email spoof (`email: 'yousaaf.awan56@gmail.com', email_verified: false`) reading `/users` or `/scanReports` -> `PERMISSION_DENIED`.
7. Client timestamp tampering (`createdAt` != `request.time`) on `/users/{uid}` or `/scanReports/{id}` create -> `PERMISSION_DENIED`.
8. Overwriting immutable `createdAt`, `uid`, or `reporterUid` on update -> `PERMISSION_DENIED`.
9. Oversized payload poisoning (`summary` 50KB or `thumbnailUrl` > 220KB or `phoneNumber` > 32) -> `PERMISSION_DENIED`.
10. Invalid document ID (`../etc/passwd` or 500-char ID) failing `isValidId()` -> `PERMISSION_DENIED`.
11. Unbounded array injection (`linkedScanIds` with 50 items) failing array cap -> `PERMISSION_DENIED`.
12. Non-admin creating a `ScanReport` with pre-resolved status (`status: 'resolved'`) or mutating another user's report -> `PERMISSION_DENIED`.
