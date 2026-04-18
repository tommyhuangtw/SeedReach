/**
 * Download an Instagram profile image and return as a base64 data URI.
 * Instagram CDN URLs expire after a few hours, so we need to persist them.
 * Profile pics are small (~10-30KB), so base64 storage is fine.
 */
export async function downloadAvatarAsDataUri(
  url: string
): Promise<string | null> {
  if (!url) return null;

  try {
    const res = await fetch(url, {
      headers: {
        // Mimic a browser request to avoid blocks
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Download avatars for multiple profiles in parallel (with concurrency limit).
 */
export async function downloadAvatars(
  profiles: { username: string; profilePicUrl: string }[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const concurrency = 5;

  for (let i = 0; i < profiles.length; i += concurrency) {
    const batch = profiles.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (p) => {
        const dataUri = await downloadAvatarAsDataUri(p.profilePicUrl);
        return { username: p.username, dataUri };
      })
    );
    for (const r of results) {
      if (r.dataUri) {
        result.set(r.username, r.dataUri);
      }
    }
  }

  return result;
}
