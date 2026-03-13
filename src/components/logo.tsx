import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  color?: "white" | "black";
  className?: string;
  size?: string;
  imageClassName?: string;
  href?: string;
}

export default function Logo({
  color = "white",
  className,
  size = "text-3xl",
  imageClassName = "h-12 w-auto",
  href,
}: LogoProps) {
  const mainTextClass = color === "black" ? "text-black" : "text-white";
  const spanTextClass = color === "black" ? "text-neutral-800" : "text-white";

  const content = (
    <>
      <Image
        src="/mascot-yellow-head.svg"
        width={52}
        height={56}
        alt="logo"
        className={imageClassName}
        style={{ width: "auto" }}
      />
      <p className={`${mainTextClass} ${size} font-bold`}>
        Equi<span className={`${spanTextClass} font-light`}>Team</span>
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`flex flex-row items-center gap-8 ${className || ""}`}>
        {content}
      </Link>
    );
  }

  return (
    <header className={`flex flex-row items-center gap-8 ${className || ""}`}>{content}</header>
  );
}
