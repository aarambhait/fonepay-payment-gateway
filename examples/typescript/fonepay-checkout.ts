import { createPrivateKey, createSign } from "node:crypto";

export interface CheckoutConfig {
  /** e.g. https://<uat-host>/merchantThirdparty/api/merchant/third-party/v2 */
  baseUrl: string;
  username: string;
  password: string;
  /** Your PKCS8 private key, Base64 without PEM header lines. */
  privateKey: string;
}

export interface IntentQrRequest {
  amount: number;
  billId: string;
  terminalId: string;
  /** Unique per transaction, alphanumeric only. */
  referenceLabel: string;
}

export interface Bank {
  bankName: string;
  bankCode: string;
  bankIcon: string;
  packageName: string;
  intentScheme: string;
}

export interface IntentQrResponse {
  qrMessage: string;
  prn: string;
  websocketId?: string;
}

/** Base64(RSA-SHA256(body)). Sign the exact string you send on the wire. */
export function signBody(body: string, privateKeyBase64: string): string {
  const key = createPrivateKey({
    key: Buffer.from(privateKeyBase64.replace(/\s/g, ""), "base64"),
    format: "der",
    type: "pkcs8",
  });
  return createSign("RSA-SHA256").update(body, "utf8").sign(key, "base64");
}

export const toBearer = (token: string): string =>
  token.startsWith("Bearer ") ? token : `Bearer ${token}`;

/** Deep link that opens the customer's banking app with the QR payload. */
export const buildDeepLink = (intentScheme: string, qrMessage: string): string =>
  `${intentScheme}/?qrPayload=${encodeURIComponent(qrMessage)}`;

async function send<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const json = (await response.json()) as T & { message?: unknown };
  if (!response.ok) throw new Error(`Fonepay ${response.status}: ${JSON.stringify(json.message)}`);
  return json;
}

function postSigned<T>(config: CheckoutConfig, url: string, headers: Record<string, string>, body: object) {
  const payload = JSON.stringify(body);
  return send<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", signature: signBody(payload, config.privateKey), ...headers },
    body: payload,
  });
}

export async function login(config: CheckoutConfig): Promise<string> {
  const { baseUrl, username, password } = config;
  const basic = Buffer.from(`${username}:${password}`).toString("base64");
  const { accessToken } = await postSigned<{ accessToken: string }>(
    config,
    `${baseUrl}/login`,
    { Authorization: `Basic ${basic}` },
    { username, password },
  );
  return toBearer(accessToken);
}

export async function listBanks(config: CheckoutConfig, token: string): Promise<Bank[]> {
  const { bankDetails } = await send<{ bankDetails: Bank[] }>(`${config.baseUrl}/banks/list`, {
    headers: { Authorization: token, paymentMode: "INTENT" },
  });
  return bankDetails;
}

export function generateIntentQr(config: CheckoutConfig, token: string, request: IntentQrRequest) {
  return postSigned<IntentQrResponse>(config, `${config.baseUrl}/generate-intent-qr`, { Authorization: token }, {
    ...request,
    paymentMode: "QR",
    qrType: "INTENT_QR",
  });
}

export function getPaymentStatus(config: CheckoutConfig, token: string, terminalId: string, referenceLabel: string) {
  return postSigned<{ paymentStatus: "success" | "failed" | "pending"; requestedAmount: string }>(
    config,
    `${config.baseUrl}/thirdPartyDynamicQrGetStatus`,
    { Authorization: token },
    { terminalId, referenceLabel },
  );
}
