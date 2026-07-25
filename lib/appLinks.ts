const DEFAULT_APP_ID = "com.kutahyasatilik.app";
const TEAM_ID_PATTERN = /^[A-Z0-9]{10}$/i;
const APP_ID_PATTERN = /^[A-Z][A-Z0-9_-]*(?:\.[A-Z][A-Z0-9_-]*)+$/i;
const SHA256_FINGERPRINT_PATTERN = /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/i;

const appLinkComponents = [
  { "/": "/ilan/*" },
  { "/": "/bildirimler*" },
  { "/": "/emlak-ofisleri*" },
  { "/": "/emlak-ofisi/*" },
  { "/": "/danismanlar*" },
  { "/": "/danisman/*" },
  { "/": "/yerel-araclar*" },
] as const;

export function buildAppleAppSiteAssociation(
  teamIdValue: string | undefined,
  bundleIdValue: string | undefined,
) {
  const teamId = teamIdValue?.trim() || "";
  const bundleId = bundleIdValue?.trim() || DEFAULT_APP_ID;
  if (!TEAM_ID_PATTERN.test(teamId) || !APP_ID_PATTERN.test(bundleId)) return null;

  return {
    applinks: {
      apps: [] as string[],
      details: [{
        appID: `${teamId}.${bundleId}`,
        components: appLinkComponents,
      }],
    },
  };
}

export function buildAndroidAssetLinks(
  fingerprintsValue: string | undefined,
  packageNameValue: string | undefined,
) {
  const packageName = packageNameValue?.trim() || DEFAULT_APP_ID;
  const fingerprints = (fingerprintsValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (
    !APP_ID_PATTERN.test(packageName) ||
    fingerprints.length === 0 ||
    fingerprints.some((value) => !SHA256_FINGERPRINT_PATTERN.test(value))
  ) {
    return null;
  }

  return [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: [...new Set(
        fingerprints.map((value) => value.toUpperCase()),
      )],
    },
  }];
}
