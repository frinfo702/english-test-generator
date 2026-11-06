/// <reference types="@cloudflare/workers-types" />

import { hasPremium, type AccessEnv } from "../../src/lib/accessCode";

/** Settings checks a pasted early access code here before saving it. */
export const onRequestPost: PagesFunction<AccessEnv> = async ({
  request,
  env,
}) =>
  (await hasPremium(request, env))
    ? Response.json({ ok: true })
    : Response.json({ error: "That code isn't valid." }, { status: 401 });
