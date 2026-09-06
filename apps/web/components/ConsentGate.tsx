"use client";

export function ConsentGate({ onAccept }: { onAccept: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">NavTorá</h1>
        <p className="mt-2 text-muted">Ubicarse en el sefer sin saber el texto de memoria.</p>

        <h2 className="mt-10 text-lg font-medium">Antes de empezar</h2>
        <ul className="mt-4 space-y-4 text-[15px] leading-relaxed">
          <li className="flex gap-3">
            <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
            <span>
              Cuando apretás <b>Leer</b>, la foto de la columna se manda al servidor y a un servicio de lectura de texto para transcribirla. Nada se manda hasta que vos lo pedís.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
            <span>
              <b>No se guarda ninguna imagen.</b> Ni en el teléfono, ni en el servidor, ni en el servicio de lectura. Sólo se registran tiempos y cantidad de líneas para mejorar el sistema.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
            <span>
              Sacá la menor cantidad de fotos posible y sólo del texto. La app te va a decir con claridad cuándo no está segura, en vez de adivinar.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
            <span>Es una herramienta de ayuda. La palabra final sobre el sefer la tienen el sofer y el rav.</span>
          </li>
        </ul>
      </div>
      <button
        type="button"
        onClick={onAccept}
        className="mt-10 h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]"
      >
        Entendido, empezar
      </button>
    </main>
  );
}
