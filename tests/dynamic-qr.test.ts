import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSocketMessage, signQrRequest, signStatusRequest } from "../examples/typescript/fonepay-dynamic-qr.ts";

// Expected values were computed independently with Python's hmac module.
const secretKey = "test-secret-key";
const request = { amount: "14", prn: "PRN-1001", remarks1: "order 1001", remarks2: "web" };

test("signs a QR request over AMOUNT,PRN,MERCHANT-CODE,REMARKS1,REMARKS2", () => {
  assert.equal(
    signQrRequest(secretKey, "TESTMERCHANT", request),
    "ad31dd17cb62cbc9a0981ea7eb00d99752fc75a88096045be3f814842dadc84ab231e7eb6bee6f866a521ba46084db1b4b0d6011dae9d42d1400ba548acdc493",
  );
});

test("appends taxAmount and taxRefund when present", () => {
  const signature = signQrRequest(secretKey, "TESTMERCHANT", {
    ...request,
    amount: "1000",
    taxAmount: "120",
    taxRefund: "12",
  });
  assert.equal(
    signature,
    "25a165f3ecbe90760a569d74211d324ae5e1bd26b07b768f7480ab50108afaa5e14cffd1bb35636142c8de4e944875e4fc9a519bef23712a1bce99ecc722f061",
  );
});

test("rejects taxAmount without taxRefund", () => {
  assert.throws(() => signQrRequest(secretKey, "TESTMERCHANT", { ...request, taxAmount: "5" }), /together/);
});

test("signs a status request over PRN,MERCHANT-CODE", () => {
  assert.equal(
    signStatusRequest(secretKey, "TESTMERCHANT", "PRN-1001"),
    "5fa597f4fc5c2effaa335b3bbf298307e567bcc7aa00faf52d3229bd63c22e4851cd17b86addf85822bc7832b8aecfa8a4979812b5a83d52f3e3743e0a7c5bdd",
  );
});

test("parses the double-encoded WebSocket frames", () => {
  const verified = JSON.stringify({ transactionStatus: JSON.stringify({ success: true, message: "VERIFIED", qrVerified: true }) });
  assert.deepEqual(parseSocketMessage(verified), { kind: "verified" });

  const payment = JSON.stringify({
    transactionStatus: JSON.stringify({ productNumber: "PRN-1001", amount: "14", message: "Request Complete", paymentSuccess: true }),
  });
  assert.deepEqual(parseSocketMessage(payment), {
    kind: "payment", paymentSuccess: true, prn: "PRN-1001", amount: "14", message: "Request Complete",
  });
});
