import Stepper from './Stepper.jsx';

// One tickable appliance. Ticking it reveals "how many of each" and "how long is it on",
// both answerable by tapping, with sensible defaults already chosen.
export default function ApplianceRow({ appliance, selection, hourOptions, onToggle, onQty, onHours }) {
  const selected = Boolean(selection);
  const total = selected ? Object.values(selection.qty).reduce((s, n) => s + n, 0) : 0;
  const checkId = `ap-${appliance.id}`;

  return (
    <li className={`ap${selected ? ' ap-on' : ''}`}>
      <label className="ap-head" htmlFor={checkId}>
        <input id={checkId} type="checkbox" checked={selected} onChange={onToggle} />
        <span className="ap-check" aria-hidden="true" />
        <span className="ap-title">
          <strong>{appliance.name}</strong>
          <small>{appliance.hint}</small>
        </span>
        {selected && <span className="ap-count">{total} chosen</span>}
      </label>

      {selected && (
        <div className="ap-body">
          <p className="ap-label">
            {appliance.variants.length > 1 ? 'Which kind, and how many?' : 'How many?'}
          </p>
          <ul className="variants">
            {appliance.variants.map((variant) => {
              const qty = selection.qty[variant.id] ?? 0;
              return (
                <li key={variant.id} className={qty > 0 ? 'on' : ''}>
                  <span>{variant.label}</span>
                  <Stepper
                    value={qty}
                    max={appliance.maxQty}
                    label={`${appliance.name}: ${variant.label}`}
                    onChange={(n) => onQty(variant.id, n)}
                  />
                </li>
              );
            })}
          </ul>

          {appliance.hoursMode === 'chips' ? (
            <fieldset className="hours">
              <legend className="ap-label">How long is it on each day?</legend>
              <div className="chips">
                {hourOptions.map((opt) => (
                  <label key={opt.key} className="chip">
                    <input
                      type="radio"
                      name={`hours-${appliance.id}`}
                      checked={selection.hoursKey === opt.key}
                      onChange={() => onHours(opt.key)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="ap-fixed">It runs all day and night, so there&apos;s nothing to pick here.</p>
          )}
        </div>
      )}
    </li>
  );
}
