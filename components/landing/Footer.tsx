import Link from "next/link";
import { InstagramIcon, YoutubeIcon, TiktokIcon } from "@/components/ui/icons";

const LINKS = [
  { label: "Політика конфіденційності", href: "/privacy" },
  { label: "Умови використання", href: "/terms" },
  { label: "Контакти", href: "/contacts" },
];

const SOCIALS = [
  { icon: InstagramIcon, href: "https://instagram.com", label: "Instagram" },
  { icon: YoutubeIcon, href: "https://youtube.com", label: "YouTube" },
  { icon: TiktokIcon, href: "https://tiktok.com", label: "TikTok" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-rose-line/40 bg-cream-soft">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-serif text-xl tracking-wide text-accent-dark">
            NATALIEVA
          </span>
          <p className="mt-1 text-xs tracking-[0.15em] text-muted">
            GEL POLISH • NAIL EXTENSIONS
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/70">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent-dark">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {SOCIALS.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-line/50 text-accent-dark transition-colors hover:bg-accent-soft"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-rose-line/30 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Natalieva. Усі права захищені.
      </div>
    </footer>
  );
}
