import jwt from "jsonwebtoken";

export interface ExchangeQRPayload {
  exchangeId: string;
  customerId: string;
  type: "exchange";
}

const QR_EXPIRES_IN = "72h";

/**
 * Generates an exchange QR code token.
 * @param payload - The payload containing exchangeId and customerId.
 * @param secret - The EXCHANGE_QR_SECRET used to sign the token.
 * @returns The signed JWT token string.
 */
export function generateExchangeQRToken(payload: Omit<ExchangeQRPayload, "type">, secret: string): string {
  if (!secret) {
    throw new Error("EXCHANGE_QR_SECRET is required to generate QR token.");
  }

  const tokenPayload: ExchangeQRPayload = {
    ...payload,
    type: "exchange",
  };

  return jwt.sign(tokenPayload, secret, {
    algorithm: "HS256",
    expiresIn: QR_EXPIRES_IN,
  });
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

  return decoded;
}
