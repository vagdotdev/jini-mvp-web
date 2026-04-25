/** JSON fields returned by /api/livekit/token when LiveKit env is missing */
export const LIVEKIT_NOT_CONFIGURED_CODE = "LIVEKIT_NOT_CONFIGURED" as const;

export type LiveKitTokenErrorBody = {
  error?: string;
  code?: typeof LIVEKIT_NOT_CONFIGURED_CODE;
  livekit_cloud_url?: string;
  docs_url?: string;
};

export const LIVEKIT_CLOUD_URL = "https://cloud.livekit.io/";
export const LIVEKIT_KEYS_DOCS_URL =
  "https://docs.livekit.io/home/cloud/keys-and-tokens/";
