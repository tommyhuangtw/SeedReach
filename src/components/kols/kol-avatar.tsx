"use client";

import { useState } from "react";

interface KolAvatarProps {
  src: string | null | undefined;
  name: string;
  className?: string;
}

export default function KolAvatar({ src, name, className = "h-8 w-8" }: KolAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = (name || "??").slice(0, 2).toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`shrink-0 rounded-full object-cover ${className}`}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
    />
  );
}
