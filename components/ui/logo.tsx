import Image from 'next/image';

interface LogoProps {
  className?: string;
}

/** Brand mark. Sizing is owned by the caller via className. */
export default function Logo({ className = 'h-7 w-7' }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={28}
      height={28}
      aria-hidden
      priority
      className={`shrink-0 rounded-[7px] object-contain ${className}`}
    />
  );
}
