import Image from 'next/image';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ className = '', style }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="SakuKampus"
      width={28}
      height={28}
      className={className}
      style={{ height: 'auto', width: 'auto', display: 'block', objectFit: 'contain', ...style }}
      priority
    />
  );
}
