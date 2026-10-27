import Image from "next/image";
import { PawIcon } from "@/components/brand/logo";
import { cn } from "@/components/ui/cn";

// Foto do animal; sem foto, um cartão colorido com a inicial do nome em vez da caixa vazia. O tom
// varia por nome (sempre na família do azul), para a listagem não ficar toda igual.
const tones = [
  "from-adopt-100 via-adopt-50 to-adopt-200 text-adopt-800",
  "from-sky-100 via-sky-50 to-sky-200 text-sky-900",
  "from-indigo-100 via-indigo-50 to-indigo-200 text-indigo-900",
  "from-cyan-100 via-cyan-50 to-cyan-200 text-cyan-900",
];

const toneFor = (name: string) =>
  tones[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length];
export function AnimalPhoto({
  image,
  name,
  sizes,
  priority,
  compact = false,
  className,
}: {
  image?: { url: string; alt: string | null } | null;
  name: string;
  sizes: string;
  priority?: boolean;
  // Miniatura: só a inicial, sem a patinha nem o texto.
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt ?? name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={`${name}, foto em breve`}
          className={cn(
            "flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br dark:from-adopt-950 dark:via-zinc-900 dark:to-adopt-900 dark:text-adopt-200",
            toneFor(name),
          )}
        >
          <span className={cn("font-display font-extrabold", compact ? "text-3xl" : "text-6xl")}>
            {name.charAt(0)}
          </span>
          {!compact && (
            <>
              <PawIcon className="size-7 opacity-60" />
              <span className="text-xs">Foto em breve</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
