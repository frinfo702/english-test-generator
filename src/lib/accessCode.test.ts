import { describe, expect, it } from "vitest";
import {
  ACCESS_CODE_HEADER,
  hasPremium,
  issueAccessCode,
  verifyAccessCode,
} from "./accessCode";
import { azureCredentials } from "./azureCredentials";

const SECRET = "s".repeat(32);
const OTHER = "o".repeat(32);

const request = (headers: Record<string, string>) =>
  new Request("https://example.test/api/x", { method: "POST", headers });

describe("early access codes", () => {
  it("accepts a code it issued, typed in any case, and nothing else", async () => {
    const code = await issueAccessCode("alice", SECRET);
    expect(code).toMatch(/^EA-ALICE-[0-9A-F]{16}$/);
    expect(await verifyAccessCode(code.toLowerCase(), SECRET)).toBe("ALICE");
    expect(await verifyAccessCode(code, OTHER)).toBeNull();
    expect(await verifyAccessCode(code.replace("ALICE", "BOB"), SECRET)).toBe(
      null,
    );
    expect(await verifyAccessCode(code.slice(0, -1), SECRET)).toBeNull();
    expect(await verifyAccessCode(code, undefined)).toBeNull();
  });

  it("refuses revoked IDs and short secrets", async () => {
    const code = await issueAccessCode("bob", SECRET);
    expect(await verifyAccessCode(code, SECRET, "alice, bob")).toBeNull();
    await expect(issueAccessCode("bob", "short")).rejects.toThrow();
    expect(await verifyAccessCode(code, "short")).toBeNull();
  });

  it("lets the server's Azure key out only with a valid code", async () => {
    const env = {
      ACCESS_CODE_SECRET: SECRET,
      AZURE_SPEECH_KEY: "ours",
      AZURE_SPEECH_REGION: "eastus",
    };
    const code = await issueAccessCode("carol", SECRET);
    expect(await hasPremium(request({}), env)).toBe(false);
    expect(await azureCredentials(request({}), env)).toBeNull();
    expect(
      await azureCredentials(request({ [ACCESS_CODE_HEADER]: code }), env),
    ).toEqual({ key: "ours", region: "eastus" });
    expect(
      await azureCredentials(
        request({ "X-Azure-Key": "mine", "X-Azure-Region": "westus2" }),
        env,
      ),
    ).toEqual({ key: "mine", region: "westus2" });
    // A region is interpolated into a hostname; anything else is ignored.
    expect(
      await azureCredentials(
        request({ "X-Azure-Key": "mine", "X-Azure-Region": "evil.com/x" }),
        env,
      ),
    ).toBeNull();
  });
});
