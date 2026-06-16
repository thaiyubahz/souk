/**
 * WhatsApp Link feature — TypeScript types mirroring the backend
 * response shapes from `app/routes/whatsapp.py`.
 */

export interface MintTokenResponse {
  token: string;
  deep_link: string;
  expires_at: string; // ISO 8601
}

export interface LinkStatus {
  linked: boolean;
  phone: string | null;
  linked_at: string | null; // ISO 8601 if linked
  /** Whether the WhatsApp channel itself is currently usable (enabled and not
   * in maintenance). The status read no longer 503s when the channel is off,
   * so a linked user still sees their link; this flag lets the UI show a
   * "temporarily unavailable" note. Absent on older backends → treat as true. */
  available?: boolean;
}

export interface UnlinkResponse {
  unlinked: boolean;
}

/** Frontend-only enum tracking the UI's progression through the flow. */
export type LinkingStep =
  | 'idle'         // initial state — show CTA
  | 'minting'      // POST /whatsapp/linking/token in flight
  | 'launched'     // deep link opened; polling for status
  | 'linked'       // status came back linked
  | 'unlinking'    // DELETE /whatsapp/link in flight
  | 'error';       // any step errored

export interface LinkingFlowState {
  step: LinkingStep;
  token?: string;
  deepLink?: string;
  expiresAt?: string;
  status?: LinkStatus;
  errorMessage?: string;
}
