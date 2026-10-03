// Temporary token preview for task 0.2. Replaced by the real home in Phase 1.
const colors = [
  "bg",
  "surface",
  "surface-2",
  "rail",
  "border",
  "border-strong",
  "text",
  "text-2",
  "text-3",
  "text-muted",
  "text-faint",
  "accent",
  "chaos",
  "warn",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 px-4 py-16">
      <section className="space-y-4">
        <h1 className="text-h1 font-extrabold">Del caos a la arquitectura.</h1>
        <h2 className="text-h2 font-bold">Casos de estudio</h2>
        <h3 className="text-h3 font-medium">Trayectoria</h3>
        <p className="text-lg text-text-2">
          Bricolage Grotesque en 400, 500, 700 y 800 para display y cuerpo.
        </p>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-text-3">
          JetBrains Mono · etiquetas · estados · logs
        </p>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {colors.map((name) => (
          <li
            key={name}
            className="rounded-card border border-border bg-surface p-3"
          >
            <span
              className="mb-2 block h-10 rounded-control border border-border-strong"
              style={{ background: `var(--${name})` }}
            />
            <code className="font-mono text-xs text-text-3">--{name}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
