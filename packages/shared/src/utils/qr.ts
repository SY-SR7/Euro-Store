import jwt, { type SignOptions } from "jsonwebtoken";

export interface ExchangeQRPayload {
  exchangeId: string;
  exchange_request_id?: string;
  customerId: string;
  type: "exchange";
}

export interface LoyaltyQRPayload {
  customerId: string;
  type: "loyalty";
  version: 2;
}

const QR_EXPIRES_IN: SignOptions["expiresIn"] = "72h";

/**
 * Generates an exchange QR code token.
 * @param payload - The payload containing exchangeId and customerId.
 * @param secret - The EXCHANGE_QR_SECRET used to sign the token.
 * @param options - Optional expiry override from system settings.
 * @returns The signed JWT token string.
 */
export function generateExchangeQRToken(
  payload: Omit<ExchangeQRPayload, "type" | "exchange_request_id">,
  secret: string,
  options: { expiresAt?: string; expiresIn?: SignOptions["expiresIn"] } = {},
): string {
  if (!secret) {
    throw new Error("EXCHANGE_QR_SECRET is required to generate QR token.");
  }

  const tokenPayload: ExchangeQRPayload & { exp?: number } = {
    ...payload,
    exchange_request_id: payload.exchangeId,
    type: "exchange",
  };

  if (options.expiresAt) {
    const exp = Math.floor(new Date(options.expiresAt).getTime() / 1000);
    if (!Number.isFinite(exp)) {
      throw new Error("Invalid exchange QR expiry date.");
    }
    tokenPayload.exp = exp;
  }

  const signOptions: SignOptions = { algorithm: "HS256" };
  if (!options.expiresAt) signOptions.expiresIn = options.expiresIn ?? QR_EXPIRES_IN;

  return jwt.sign(tokenPayload, secret, signOptions);
}

/**
 * Verifies and decodes an exchange QR code token.
 * @param token - The JWT token string.
 * @param secret - The EXCHANGE_QR_SECRET used to verify the token.
 * @returns The decoded ExchangeQRPayload if valid.
 * @throws Error if token is invalid or expired.
 */
export function verifyExchangeQRToken(token: string, secret: string): ExchangeQRPayload {
  if (!secret) {
    throw new Error("EXCHANGE_QR_SECRET is required to verify QR token.");
  }

  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
  }) as ExchangeQRPayload;

  if (decoded.type !== "exchange") {
    throw new Error("Invalid QR token type.");
  }
  if (!decoded.exchangeId && decoded.exchange_request_id) {
    decoded.exchangeId = decoded.exchange_request_id;
  }

  return decoded;
}

export function generateLoyaltyQRToken(customerId: string, secret: string): string {
  if (!secret) throw new Error("LOYALTY_QR_SECRET is required to generate QR token.");
  return jwt.sign(
    { customerId, type: "loyalty", version: 2 } satisfies LoyaltyQRPayload,
    secret,
    { algorithm: "HS256" },
  );
}

export function verifyLoyaltyQRToken(token: string, secret: string): LoyaltyQRPayload {
  if (!secret) throw new Error("LOYALTY_QR_SECRET is required to verify QR token.");
  const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as LoyaltyQRPayload;
  if (decoded.type !== "loyalty" || decoded.version !== 2 || !decoded.customerId) {
    throw new Error("Invalid loyalty QR token.");
  }
  return decoded;
}
