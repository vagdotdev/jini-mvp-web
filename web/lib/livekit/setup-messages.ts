/** JSON fields returned by /api/livekit/token when LiveKit env is missing */
export const LIVEKIT_NOT_CONFIGURED_CODE = "LIVEKIT_NOT_CONFIGURED" as const;
/** Returned when LiveKit env is set but values look malformed (whitespace, wrong scheme, ...). */
export const LIVEKIT_BAD_CONFIG_CODE = "LIVEKIT_BAD_CONFIG" as const;

export type LiveKitTokenErrorBody = {
  error?: string;
  code?: typeof LIVEKIT_NOT_CONFIGURED_CODE | typeof LIVEKIT_BAD_CONFIG_CODE;
  livekit_cloud_url?: string;
  docs_url?: string;
  warnings?: string[];
};

export const LIVEKIT_CLOUD_URL = "https://cloud.livekit.io/";
export const LIVEKIT_KEYS_DOCS_URL =
  "https://docs.livekit.io/home/cloud/keys-and-tokens/";
