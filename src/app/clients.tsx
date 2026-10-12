// Names only: logos are trademarks, so tiles use text wordmarks that can later take a `logo` image.
const clients: {
  name: string;
  kind: string;
  current?: boolean;
  badge?: string;
  note?: string;
  href?: string;
}[] = [
  { name: 'Blizzard Entertainment', kind: 'Gaming · current', current: true },
  { name: 'Huge', kind: 'Digital agency' },
  { name: 'Carrier', kind: 'Enterprise' },
  { name: 'DrivenBands', kind: 'Mobile app' },
  { name: 'BSN Sports', kind: 'Sports e-commerce' },
  {
    name: 'NBCU Olympics',
    kind: 'Media',
    badge: '2025 Webby honoree',
    note: 'OLI, the Paris 2024 viewing guide. Two Webby nominations.',
    href: 'https://winners.webbyawards.com/2025/ai-immersive-games/ai-apps-experiences-general/media-entertainment/343421/nbcus-oli-the-ai-olympic-viewing-guide',
  },
  { name: "Sotheby's SIR.com", kind: 'Luxury real estate' },
  { name: 'Brooks Running', kind: 'Retail e-commerce' },
  {
    name: 'Tyba',
    kind: 'Regional FinTech',
    badge: 'MVP launch',
    note: 'Key QA role in the launch',
  },
  { name: 'Viajes Credomatic', kind: 'Travel' },
  { name: 'Google Partner Marketing Hub', kind: 'Marketing platform' },
];

function ClientList({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      className="clients-list"
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : 'Companies and products'}
    >
      {clients.map((c) => (
        <li
          key={c.name}
          className={`client${c.current ? ' is-current' : ''}${c.badge ? ' has-badge' : ''}`}
        >
          <b>{c.name}</b>
          <small>{c.kind}</small>
          {c.badge && <em className="client-badge">★ {c.badge}</em>}
          {c.note && <span className="client-note">{c.note}</span>}
          {c.href && (
            <a
              className="client-link"
              href={c.href}
              target="_blank"
              rel="noreferrer"
              tabIndex={hidden ? -1 : undefined}
            >
              Webby Awards page ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Clients() {
  return (
    <section className="clients" aria-labelledby="clients-title">
      <p className="clients-label" id="clients-title">
        <span>{'//'}</span> PRODUCTS AND PLATFORMS I&apos;VE TESTED
      </p>
      <div className="clients-viewport">
        <div className="clients-track">
          <ClientList />
          <ClientList hidden />
        </div>
      </div>
    </section>
  );
}
