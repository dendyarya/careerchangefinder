import { consentBootstrap, TRACKING } from "@/lib/tracking";

/** Google tags for the public site. Renders nothing unless the production build has the IDs. */
export function Tracking() {
  const { adsenseClient, gaId } = TRACKING;
  if (!adsenseClient && !gaId) return null;
  return <script dangerouslySetInnerHTML={{ __html: consentBootstrap(gaId, adsenseClient) }} />;
}
