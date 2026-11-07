// Elementi decorativi condivisi dello stile del sito.

// Rametto disegnato a linea, accanto ai titoli.
export function Sprig({ className = "", flip = false }) {
  return (
    <svg className={`sprig ${className}`} viewBox="0 0 120 60" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M4 50 C 30 44, 60 34, 116 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {[
        [22, 46, -30],
        [40, 40, -35],
        [58, 33, -40],
        [76, 26, -45],
        [94, 19, -50],
      ].map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <path d="M0 0 C 4 -10, 14 -12, 18 -8 C 12 -4, 6 0, 0 0 Z" fill="currentColor" opacity="0.85" />
          <path d="M0 0 C 4 10, 14 12, 18 8 C 12 4, 6 0, 0 0 Z" fill="currentColor" opacity="0.6" />
        </g>
      ))}
      <circle cx="116" cy="10" r="4" fill="#c0643b" />
    </svg>
  );
}

// Bordo ondulato tra le sezioni.
export function Wave({ color, flip = false }) {
  return (
    <svg className={`wave ${flip ? "is-flipped" : ""}`} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 30 C 160 60, 320 0, 480 30 S 800 60, 960 30 S 1280 0, 1440 30 V60 H0 Z" fill={color} />
    </svg>
  );
}

// Titolo di sezione con rametti ai lati.
export function SectionTitle({ script, title, light = false, sprigs = true }) {
  return (
    <div className={`section-title ${light ? "is-light" : ""}`}>
      {sprigs && <Sprig />}
      <div>
        {script && <p className="script">{script}</p>}
        <h2>{title}</h2>
      </div>
      {sprigs && <Sprig flip />}
    </div>
  );
}

// Apertura delle pagine interne: fondo crema, scritta a mano, titolo e onda.
export function PageHero({ script, title, lead, children, waveColor = "#f7f1e3", compact = false }) {
  return (
    <section className={`page-hero ${compact ? "is-compact" : ""}`}>
      <div className="page-hero-inner">
        {script && <p className="script">{script}</p>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
      <Sprig className="page-hero-sprig" />
      <Wave color={waveColor} />
    </section>
  );
}
