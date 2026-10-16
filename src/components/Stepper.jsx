// A − / number / + control. Tapping is the main way to use it, but the number can also be
// edited directly, which matters for things like "60 office lights".
export default function Stepper({ value, max, label, onChange }) {
  const set = (n) => onChange(Math.min(max, Math.max(0, Number.isFinite(n) ? n : 0)));

  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= 0} aria-label={`One fewer ${label}`}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        aria-label={`Number of ${label}`}
        onFocus={(e) => e.target.select()}
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, ''), 10))}
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={`One more ${label}`}>
        +
      </button>
    </div>
  );
}
