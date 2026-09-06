"use client";

import { useEffect, useState } from "react";

interface Props {
  /** URL de la foto capturada, para mostrarla congelada */
  photoUrl: string;
  modelLabel: string;
  /** duración esperada del escaneo, para que la barra avance a un ritmo creíble */
  expectedMs: number;
}

/**
 * Pantalla de espera: la foto queda fija, una línea de luz la recorre de
 * arriba a abajo y una barra avanza con el tiempo esperado. Los mensajes
 * cambian por etapa para que los segundos se sientan ocupados, no muertos.
 */
export function ScanProgress({ photoUrl, modelLabel, expectedMs }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - t0), 100);
    return () => window.clearInterval(id);
  }, []);

  // la barra llega al 88 % en el tiempo esperado y después avanza despacio: nunca se clava ni llega a 100 antes de tiempo
  const ratio = elapsed / expectedMs;
  const progress = ratio < 1 ? 88 * (1 - Math.pow(1 - ratio, 2)) : 88 + 10 * (1 - Math.exp(-(ratio - 1) * 1.5));
  const secs = Math.floor(elapsed / 1000);

  let stage: string;
  if (elapsed < 1500) stage = "Enviando la foto…";
  else if (ratio < 0.75) stage = `Leyendo las letras con ${modelLabel}…`;
  else if (ratio < 1.4) stage = "Buscando el lugar en la Torá…";
  else stage = "Está tardando más de lo habitual, seguimos…";

  return (
    <div className="absolute inset-0 bg-ink">
      <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div aria-hidden className="pointer-events-none absolute inset-x-[12%] inset-y-[8%] overflow-hidden rounded-lg border-2 border-accent">
        <div className="scanline absolute inset-x-0 h-24" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/90 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex items-baseline justify-between">
          <div className="text-base font-medium" aria-live="polite">
            {stage}
          </div>
          <div className="text-sm tabular-nums text-muted">{secs} s</div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted">La foto no se guarda. Se manda una sola vez para leerla.</div>
      </div>
    </div>
  );
}
