const LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/henrythedev90",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/henrysaulnunez/",
  },
  {
    label: "Portfolio",
    href: "https://www.henry-nunez.com",
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} Henry Nuñez
        </p>
        <nav
          aria-label="Henry Nuñez on the web"
          className="flex flex-wrap gap-4"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
