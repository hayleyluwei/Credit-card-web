import Image from "next/image";

type CardImageProps = {
  alt?: string | null;
  className?: string;
  imageUrl?: string | null;
  name: string;
};

export function CardImage({ alt, className = "", imageUrl, name }: CardImageProps) {
  return (
    <div
      className={`relative flex aspect-[1.58/1] min-h-[88px] w-full items-center justify-center overflow-hidden rounded-md border border-line bg-brand-50 text-brand-700 ${className}`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={alt ?? name} fill sizes="220px" className="object-contain p-3" unoptimized />
      ) : (
        <span className="px-3 text-center text-lg font-bold">{name.charAt(0)}</span>
      )}
    </div>
  );
}
