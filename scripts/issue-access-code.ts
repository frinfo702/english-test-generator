/**
 * Mints early access codes. Issuing needs ACCESS_CODE_SECRET, the same value
 * set on Pages with `wrangler pages secret put ACCESS_CODE_SECRET`, so holding
 * that secret is what makes someone an admin; there is no issuing endpoint.
 *
 *   ACCESS_CODE_SECRET=... npm run issue-access-code -- ALICE BOB
 *
 * Revoke one by adding its ID to REVOKED_ACCESS_CODES (comma separated);
 * rotate the secret to revoke them all.
 */
import { issueAccessCode } from "../src/lib/accessCode";

const secret = process.env.ACCESS_CODE_SECRET ?? "";
const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("Usage: npm run issue-access-code -- <ID> [ID...]");
  process.exit(1);
}
for (const id of ids) console.log(await issueAccessCode(id, secret));
