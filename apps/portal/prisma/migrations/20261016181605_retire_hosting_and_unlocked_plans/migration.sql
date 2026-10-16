-- The plan catalog becomes one plan per entitlement level: Free (one
-- published form), Unlimited (code PAID, unlimited forms), and Sites (Canopy
-- Sites plus unlimited forms). HOSTING was a placeholder never assigned;
-- UNLOCKED duplicated PAID once it stopped meaning Sites. Who pays, or is
-- comped, is account billing state (status, billingRef), not a plan.

UPDATE "plans" SET "displayName" = 'Unlimited' WHERE "code" = 'PAID';

-- Both have unlimited forms or more and no Sites, so moving their accounts to
-- PAID shrinks no one's limits and changes no one's product.
UPDATE "accounts" SET "planCode" = 'PAID' WHERE "planCode" IN ('HOSTING', 'UNLOCKED');

DELETE FROM "plans" WHERE "code" IN ('HOSTING', 'UNLOCKED');

UPDATE "roles"
SET "description" = 'Full operator-console access; a plan with a form limit moves to Unlimited.'
WHERE "code" = 'GLOBAL_ADMIN';
