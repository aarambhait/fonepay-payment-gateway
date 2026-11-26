import { createHmac } from "node:crypto";

export interface DynamicQrConfig {
  /** Dev or live base URL, ending in `/merchantDetailsForThirdParty`. */
  baseUrl: string;
  merchantCode: string;
  username: string;
  password: string;
  /** Secret key from your merchant profile page. Keep it on the server. */
  secretKey: string;
}

export interface QrRequest {
  /** Send amounts as strings, exactly as they are signed: "14" is not "14.00". */
  amount: string;
  /** Your unique payment reference number (1-20 characters). */
  prn: string;
  remarks1: string;
  remarks2: string;
  taxAmount?: string;
  taxRefund?: string;
}

export interface QrResponse {
  success: boolean;
  qrMessage: string;
  thirdpartyQrWebSocketUrl: string;
}

export type SocketEvent =
  | { kind: "verified" }
  | { kind: "payment"; paymentSuccess: boolean; prn: string; amount: string; message: string };

const hmacSha512Hex = (secretKey: string, message: string): string =>
  createHmac("sha512", secretKey).update(message, "utf8").digest("hex");

/** Message: AMOUNT,PRN,MERCHANT-CODE,REMARKS1,REMARKS2[,TAXAMOUNT,TAXREFUND] */
export function signQrRequest(secretKey: string, merchantCode: string, request: QrRequest): string {
  const { amount, prn, remarks1, remarks2, taxAmount, taxRefund } = request;
  const hasTax = taxAmount !== undefined || taxRefund !== undefined;
  if (hasTax && (taxAmount === undefined || taxRefund === undefined)) {
    throw new Error("taxAmount and taxRefund must be sent together");
  }
  const parts = [amount, prn, merchantCode, remarks1, remarks2];
  if (hasTax) parts.push(taxAmount as string, taxRefund as string);
  return hmacSha512Hex(secretKey, parts.join(","));
}

/** Message: PRN,MERCHANT-CODE */
export const signStatusRequest = (secretKey: string, merchantCode: string, prn: string): string =>
  hmacSha512Hex(secretKey, `${prn},${merchantCode}`);

async function postJson<T>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as T & { success?: boolean; message?: string };
  if (!response.ok || json.success === false || "errorCode" in json) {
    throw new Error(`Fonepay error: ${json.message ?? response.statusText}`);
  }
  return json;
}

export function generateQr(config: DynamicQrConfig, request: QrRequest): Promise<QrResponse> {
  const { baseUrl, merchantCode, username, password, secretKey } = config;
  return postJson<QrResponse>(`${baseUrl}/thirdPartyDynamicQrDownload`, {
    ...request,
    merchantCode,
    dataValidation: signQrRequest(secretKey, merchantCode, request),
    username,
    password,
  });
}

export function getQrStatus(config: DynamicQrConfig, prn: string) {
  const { baseUrl, merchantCode, username, password, secretKey } = config;
  return postJson<{ paymentStatus: "success" | "failed" | "pending"; fonepayTraceId: number }>(
    `${baseUrl}/thirdPartyDynamicQrGetStatus`,
    { prn, merchantCode, dataValidation: signStatusRequest(secretKey, merchantCode, prn), username, password },
  );
}

/** WebSocket frames wrap a second JSON document inside the `transactionStatus` string. */
export function parseSocketMessage(raw: string): SocketEvent {
  const envelope = JSON.parse(raw) as { transactionStatus: string };
  const status = JSON.parse(envelope.transactionStatus) as Record<string, unknown>;
  if (status.qrVerified === true || status.QRVerified === true) return { kind: "verified" };
  return {
    kind: "payment",
    paymentSuccess: status.paymentSuccess === true,
    prn: String(status.productNumber ?? ""),
    amount: String(status.amount ?? ""),
    message: String(status.message ?? ""),
  };
}
