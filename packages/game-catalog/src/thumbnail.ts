/** Remote card art remains a plain same-origin URL, independent of host styling. */
export function remoteThumbnailPath(id: string, version: string, url: string): string | null {
  const prefix = `/g/${id}/${version}/`;
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return path.split("/").every((part) => /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(part)) &&
    /\.(svg|png|webp)$/.test(path)
    ? path
    : null;
}
