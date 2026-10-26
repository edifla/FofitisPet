"use client";

import { useTransition } from "react";
import { moveProductImage } from "../../actions";

export function MoveImageButtons({
  imageId,
  isFirst,
  isLast,
}: {
  imageId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const move = (direction: -1 | 1) =>
    startTransition(async () => {
      await moveProductImage(imageId, direction);
    });

  return (
    <span className="flex gap-2">
      <button
        type="button"
        disabled={pending || isFirst}
        onClick={() => move(-1)}
        aria-label="Mover para a esquerda"
        className="rounded border border-zinc-300 px-2 text-sm disabled:opacity-40 dark:border-zinc-700"
      >
        ←
      </button>
      <button
        type="button"
        disabled={pending || isLast}
        onClick={() => move(1)}
        aria-label="Mover para a direita"
        className="rounded border border-zinc-300 px-2 text-sm disabled:opacity-40 dark:border-zinc-700"
      >
        →
      </button>
    </span>
  );
}
