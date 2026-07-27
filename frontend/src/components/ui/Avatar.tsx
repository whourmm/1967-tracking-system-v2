import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";

export function profileImageUrl(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.hostname === "drive.google.com" || url.hostname === "www.drive.google.com") {
      const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const id = pathMatch?.[1] ?? url.searchParams.get("id");
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w512`;
    }
  } catch {
    return raw;
  }

  return raw;
}

export function Avatar({
  name,
  initials,
  photoUrl,
  className,
  imageClassName,
}: {
  name: string;
  initials: string;
  photoUrl?: string | null;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => profileImageUrl(photoUrl), [photoUrl]);
  const showImage = src && !failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600 font-bold text-white",
        className,
      )}
      aria-label={`${name} profile photo`}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className={cn("h-full w-full object-cover", imageClassName)}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
