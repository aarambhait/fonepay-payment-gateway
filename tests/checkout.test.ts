import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import { test } from "node:test";
import { buildDeepLink, signBody, toBearer } from "../examples/typescript/fonepay-checkout.ts";

test("signBody produces a Base64 RSA-SHA256 signature the public key verifies", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privateKeyBase64 = privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
  const body = JSON.stringify({ username: "user", password: "pass" });

  const signature = signBody(body, privateKeyBase64);

  assert.ok(verify("RSA-SHA256", Buffer.from(body), publicKey, Buffer.from(signature, "base64")));
  assert.ok(!verify("RSA-SHA256", Buffer.from(`${body} `), publicKey, Buffer.from(signature, "base64")));
});

test("signBody tolerates line-wrapped Base64 keys", () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const base64 = privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
  const wrapped = base64.match(/.{1,64}/g)?.join("\n") ?? base64;
  assert.equal(signBody("{}", wrapped), signBody("{}", base64));
});

test("toBearer does not double-prefix", () => {
  assert.equal(toBearer("abc"), "Bearer abc");
  assert.equal(toBearer("Bearer abc"), "Bearer abc");
});

test("buildDeepLink URL-encodes the QR payload", () => {
  assert.equal(
    buildDeepLink("LXBLNPKA://payment", "0002 01&x=1"),
    "LXBLNPKA://payment/?qrPayload=0002%2001%26x%3D1",
  );
});
