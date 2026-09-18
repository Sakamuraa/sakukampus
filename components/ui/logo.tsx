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
      width={44}
      height={24}
      className={className}
      style={{ height: 'auto', display: 'block', ...style }}
      priority
    />
  );
}
