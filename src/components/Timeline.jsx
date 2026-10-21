const stamp = (iso) => (iso ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' }) : '');

// The steps of an order, with the current one highlighted.
export default function Timeline({ steps }) {
  return (
    <ol className="timeline">
      {steps.map((s) => (
        <li key={s.key} className={`${s.done ? 'done' : ''}${s.current ? ' current' : ''}`} aria-current={s.current ? 'step' : undefined}>
          <span className="dot" aria-hidden="true" />
          <span className="t-label">{s.label}</span>
          {s.at && <small>{stamp(s.at)}</small>}
        </li>
      ))}
    </ol>
  );
}
