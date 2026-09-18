import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="SakuKampus"
      width={120}
      height={40}
      style={{ height: 'auto' }}
      priority
    />
  );
}
