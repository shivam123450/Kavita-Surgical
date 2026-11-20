import { useEffect, useState, type ImgHTMLAttributes } from "react";
import {
  createManagedImageUrl,
  getManagedImagePathFromUrl,
  SIGNED_IMAGE_URL_TTL_SECONDS,
} from "./imageStorage";

interface ManagedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  storagePath?: string;
  fallbackUrl?: string;
}

function getSafeFallbackUrl(value: string | undefined): string {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim(), window.location.origin);
    return url.protocol === "https:" || url.origin === window.location.origin
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

export function ManagedImage({
  storagePath,
  fallbackUrl,
  alt = "",
  className = "",
  ...imageProps
}: ManagedImageProps) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const safeFallbackUrl = getSafeFallbackUrl(fallbackUrl);
  const legacyStoragePath = getManagedImagePathFromUrl(fallbackUrl);
  const resolvedStoragePath = storagePath || legacyStoragePath;

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | undefined;

    const setFallbackImage = () => {
      setUrl(safeFallbackUrl);
      setFailed(!safeFallbackUrl);
      setUsingFallback(Boolean(safeFallbackUrl));
    };

    const refreshUrl = async () => {
      if (!resolvedStoragePath) {
        setFallbackImage();
        return;
      }
      try {
        const signedUrl = await createManagedImageUrl(resolvedStoragePath);
        if (cancelled) return;
        setUrl(signedUrl);
        setFailed(false);
        setUsingFallback(false);
        refreshTimer = window.setTimeout(
          refreshUrl,
          (SIGNED_IMAGE_URL_TTL_SECONDS - 60) * 1000,
        );
      } catch {
        if (!cancelled) setFallbackImage();
      }
    };

    setUrl("");
    setFailed(false);
    setUsingFallback(false);
    void refreshUrl();
    return () => {
      cancelled = true;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [resolvedStoragePath, safeFallbackUrl]);

  if (!url || failed) {
    return (
      <span
        className={`managed-image-placeholder ${className}`.trim()}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      />
    );
  }

  return (
    <img
      {...imageProps}
      className={className}
      src={url}
      alt={alt}
      onError={() => {
        if (!usingFallback && safeFallbackUrl) {
          setUrl(safeFallbackUrl);
          setUsingFallback(true);
          return;
        }
        setUrl("");
        setFailed(true);
      }}
    />
  );
}
