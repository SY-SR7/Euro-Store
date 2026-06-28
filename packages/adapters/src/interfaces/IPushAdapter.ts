/**
 * @eurostore/adapters — IPushAdapter
 *
 * Interface for push notification delivery services.
 * Business logic NEVER calls Expo/FCM SDKs directly — always through this interface.
 *
 * Current implementation: ExpoFCMPushAdapter
 * Future: OneSignalAdapter
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  /** Custom data passed to the app — values must be strings for cross-platform compatibility */
  data?: Record<string, string>;
  /** URL of an image to display with the notification */
  imageUrl?: string;
  /** Deep link or URL to open when the notification is tapped */
  actionUrl?: string;
  sound?: 'default' | 'none';
  /** iOS badge count to set on the app icon */
  badge?: number;
}

export interface PushTarget {
  /**
   * Expo push token (format: ExponentPushToken[xxxxxxxx]) or raw FCM registration token.
   * Never log or persist these tokens in plain-text audit logs.
   */
  token: string;
  platform: 'ios' | 'android';
}

export interface PushResult {
  /** Tokens that received the notification successfully */
  successful: string[];
  /** Tokens that failed, with per-token error messages */
  failed: { token: string; error: string }[];
}

/**
 * Interface for push notification delivery.
 *
 * Implementations:
 * - `ExpoFCMPushAdapter` — primary (Expo Notifications + Firebase Cloud Messaging)
 * - `OneSignalAdapter` — future
 *
 * Security note: push tokens are device identifiers — treat them as PII.
 * Do not log them in audit trails or error messages.
 */
export interface IPushAdapter {
  /**
   * Send a push notification to a single device.
   */
  sendToDevice(
    target: PushTarget,
    payload: PushNotificationPayload,
  ): Promise<PushResult>;

  /**
   * Send a push notification to multiple devices (batch send).
   * Implementations should chunk requests per provider limits.
   */
  sendToMultiple(
    targets: PushTarget[],
    payload: PushNotificationPayload,
  ): Promise<PushResult>;

  /**
   * Send a push notification to a FCM topic (e.g., "all-customers", "promo-subscribers").
   * Topics are managed server-side — customers do not control topic subscriptions directly.
   */
  sendToTopic(topic: string, payload: PushNotificationPayload): Promise<PushResult>;
}

/** Thrown when a push notification provider returns a non-retryable error */
export class PushDeliveryError extends Error {
  constructor(
    message: string,
    public readonly failedTokens: string[] = [],
    public readonly providerCode?: string,
  ) {
    super(message);
    this.name = 'PushDeliveryError';
  }
}
