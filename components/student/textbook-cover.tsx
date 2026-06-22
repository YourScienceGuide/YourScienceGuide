import Image from "next/image";

import { isUploadedCoverSrc } from "@/lib/admin/textbook-cover";

type TextbookCoverProps = {
  src: string;
  alt: string;
  className?: string;
};

export function TextbookCover({ src, alt, className }: TextbookCoverProps) {
  const sharedClassName =
    className ??
    "h-[220px] w-[160px] rounded-md border border-stone-200 object-cover shadow-md dark:border-stone-600";

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-sky-50 text-center text-xs text-slate-500 dark:bg-stone-800 dark:text-stone-400 ${sharedClassName}`}
        aria-hidden
      >
        No cover
      </div>
    );
  }

  if (isUploadedCoverSrc(src)) {
    return <img src={src} alt={alt} className={sharedClassName} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={160}
      height={220}
      className={sharedClassName}
      priority
    />
  );
}
