/** Group-owned data must not cause requests to an arbitrary image host. */
export const getTrustedGroupImageUri = (
  value: string | null | undefined,
  storageUrl: string
): string | null => {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    const storage = new URL(storageUrl);
    if (
      url.protocol !== 'https:' ||
      url.origin !== storage.origin ||
      url.username ||
      url.password ||
      url.hash
    )
      return null;
    const match =
      /^\/storage\/v1\/(?:object|render\/image)\/(?:public|sign)\/group-images\/(.+)$/.exec(
        url.pathname
      );
    if (!match) return null;
    const segments = match[1].split('/');
    if (
      segments.some(segment => {
        const decoded = decodeURIComponent(segment);
        return (
          !decoded ||
          decoded === '.' ||
          decoded === '..' ||
          decoded.includes('%') ||
          /[\/\\]/.test(decoded)
        );
      })
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
};
