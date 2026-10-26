// Logo provisório (KAN-15): patinha + "FofitisPet". As cores vêm dos tokens de app/globals.css.

export function PawIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} fill="currentColor">
      <ellipse cx="8" cy="12.5" rx="3.2" ry="4.2" transform="rotate(-18 8 12.5)" />
      <ellipse cx="13.5" cy="7" rx="3.2" ry="4.4" transform="rotate(-6 13.5 7)" />
      <ellipse cx="20.5" cy="7" rx="3.2" ry="4.4" transform="rotate(6 20.5 7)" />
      <ellipse cx="26" cy="12.5" rx="3.2" ry="4.2" transform="rotate(18 26 12.5)" />
      <path d="M17 14.5c-3.6 0-8 5.2-8 9.3 0 2.6 2 4.2 4.4 4.2 1.4 0 2.4-.6 3.6-.6s2.2.6 3.6.6c2.4 0 4.4-1.6 4.4-4.2 0-4.1-4.4-9.3-8-9.3Z" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight">
      <PawIcon className="size-6 text-brand-text" />
      <span>
        Fofitis<span className="text-brand-text">Pet</span>
      </span>
    </span>
  );
}
