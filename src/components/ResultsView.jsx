import { kwh, monthsToText, naira, nairaCompact } from '../lib/format.js';

const OPTIONS = [
  { key: 'buy', title: 'Buy it outright', blurb: 'Pay once and own it. Usually the lowest cost over the years.' },
  { key: 'lease', title: 'Lease to own', blurb: 'A small deposit, then fixed monthly payments. It is yours at the end.' },
  { key: 'rent', title: 'Rent', blurb: 'Flexible. Servicing is included and you can stop any time.' },
  { key: 'eaas', title: 'Energy as a service', blurb: 'Own nothing. Pay one monthly fee for the power it supplies.' },
];

function versusToday(option) {
  const s = option.monthlySaving;
  if (s > 0) return { tone: 'good', text: `About ${naira(s)} a month cheaper than today` };
  if (s < 0) return { tone: 'warn', text: `About ${naira(-s)} a month more than today` };
  return { tone: 'flat', text: 'About the same as today' };
}

function OptionDetails({ k, o, solar }) {
  if (k === 'buy') {
    return (
      <>
        <p className="opt-price">{nairaCompact(o.upfront)}<span> once</span></p>
        <ul className="opt-facts">
          <li>Then about {naira(o.monthlyCostAfter)} a month for upkeep</li>
          {solar.paybackMonthsVsCurrent && <li>Pays for itself in about {monthsToText(solar.paybackMonthsVsCurrent)}</li>}
        </ul>
      </>
    );
  }
  if (k === 'lease') {
    return (
      <>
        <p className="opt-price">{nairaCompact(o.monthly)}<span> / month</span></p>
        <ul className="opt-facts">
          <li>{nairaCompact(o.upfront)} deposit, then {o.termMonths} monthly payments</li>
          <li>You own it at the end</li>
        </ul>
      </>
    );
  }
  if (k === 'rent') {
    return (
      <>
        <p className="opt-price">{nairaCompact(o.monthly)}<span> / month</span></p>
        <ul className="opt-facts">
          <li>First month paid in advance</li>
          <li>Maintenance included</li>
        </ul>
      </>
    );
  }
  return (
    <>
      <p className="opt-price">{nairaCompact(o.monthly)}<span> / month</span></p>
      <ul className="opt-facts">
        <li>No upfront payment</li>
        <li>Works out to about {naira(o.perKwh)} per kWh, for {o.termMonths} months</li>
      </ul>
    </>
  );
}

export default function ResultsView({ result, mode = 'guest', onChoose }) {
  const { usage, generator, grid, current, solar, options, flags, assumptions } = result;
  const top = usage.topConsumers[0];

  const barRows = [
    {
      key: 'gen',
      label: 'Generator only',
      sub: `About ${generator.litresPerMonth.toLocaleString('en-NG')} litres of ${generator.fuel} a month`,
      value: generator.monthlyCost,
      tone: 'gen',
    },
    ...grid.bands.map((b) => ({
      key: b.band,
      label: `Band ${b.band}`,
      sub: `${b.hoursLabel} of light a day, generator for the gaps`,
      value: b.totalMonthly,
      tone: 'grid',
      mine: b.band === grid.selectedBand,
    })),
  ];
  const maxValue = Math.max(...barRows.map((r) => r.value));

  return (
    <div className="results">
      {/* ---------- Usage ---------- */}
      <section className="r-card r-hero" aria-labelledby="r-usage">
        <p className="eyebrow">Your energy use</p>
        <h2 id="r-usage" className="r-big">
          About <em>{kwh(usage.kwhPerDay)} kWh</em> a day
        </h2>
        <p className="r-sub">
          That&apos;s roughly {usage.kwhPerMonth.toLocaleString('en-NG')} kWh a month
          {top ? <>, and {top.name.toLowerCase()} {top.name.endsWith('s') ? 'account' : 'accounts'} for {top.sharePct}% of it.</> : '.'}
        </p>
        <dl className="r-stats">
          <div><dt>Connected load</dt><dd>{usage.connectedKw} kW</dd></div>
          <div><dt>Used in daylight</dt><dd>{kwh(usage.daytimeKwhPerDay)} kWh</dd></div>
          <div><dt>Used at night</dt><dd>{kwh(usage.nightKwhPerDay)} kWh</dd></div>
          <div><dt>Inverter you&apos;d need</dt><dd>{usage.inverterKva} kVA</dd></div>
        </dl>
      </section>

      {flags.needsSiteAudit && (
        <aside className="r-notice" role="note">
          <strong>This is a large load ({usage.connectedKw} kW).</strong> The numbers below are a good starting point, but a
          system this size should be confirmed with a site survey before you commit. We&apos;ll help arrange that.
        </aside>
      )}

      {/* ---------- What it costs today ---------- */}
      <section className="r-card" aria-labelledby="r-cost">
        <p className="eyebrow">What your power costs</p>
        <h2 id="r-cost">Per month, to run what you ticked</h2>
        <p className="r-sub">
          {current.kind === 'grid-plus-generator'
            ? `On Band ${current.band} light, you'd pay about ${naira(current.monthlyCost)} a month: electricity when it's on, a generator when it isn't.`
            : `Running everything on a generator would cost about ${naira(generator.monthlyCost)} a month. Not sure which band you're on? Compare all five below.`}
        </p>

        <ul className="bars">
          {barRows.map((row) => (
            <li key={row.key} className={row.mine ? 'mine' : ''}>
              <div className="bars-label">
                <strong>{row.label}{row.mine && <span className="you-tag">You</span>}</strong>
                <small>{row.sub}</small>
              </div>
              <div className="bars-track" aria-hidden="true">
                <span className={`bars-fill bars-${row.tone}`} style={{ width: `${Math.max(3, (row.value / maxValue) * 100)}%` }} />
              </div>
              <div className="bars-value">{naira(row.value)}</div>
            </li>
          ))}
        </ul>
        <p className="r-fine">
          Generator at {naira(assumptions.fuelPricePerLitre)} per litre of {generator.fuel}, plus servicing: about{' '}
          {naira(generator.costPerKwh)} for every kWh. Band A costs more per unit but leaves far fewer hours for the
          generator. Daily generator cost for you: about {naira(generator.dailyCost)}.
        </p>
      </section>

      {/* ---------- Biggest users ---------- */}
      <section className="r-card" aria-labelledby="r-top">
        <p className="eyebrow">Where it goes</p>
        <h2 id="r-top">Your biggest energy users</h2>
        <ul className="top-list">
          {usage.topConsumers.map((c) => (
            <li key={c.applianceId}>
              <span className="top-name">{c.name}</span>
              <span className="top-bar" aria-hidden="true"><span style={{ width: `${Math.max(2, c.sharePct)}%` }} /></span>
              <span className="top-val">{c.sharePct}%<small>{kwh(c.kwhPerDay)} kWh/day</small></span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Solar ---------- */}
      <section className="r-card" aria-labelledby="r-solar">
        <p className="eyebrow">Going solar</p>
        <h2 id="r-solar">A system sized for what you use</h2>
        <div className="solar-grid">
          <div><span className="k">Solar panels</span><strong>{solar.kwp} kWp</strong><small>{solar.panels} panels of {solar.panelWatts}W</small></div>
          <div><span className="k">Battery</span><strong>{solar.batteryKwh ? `${solar.batteryKwh} kWh` : 'Not needed'}</strong><small>for evening and night use</small></div>
          <div><span className="k">Inverter</span><strong>{solar.inverterKva} kVA</strong><small>handles start-up surges</small></div>
          <div><span className="k">Estimated cost</span><strong>{nairaCompact(solar.systemCost)}</strong><small>installed, typical prices</small></div>
        </div>

        {flags.solarMayNotPayBack ? (
          <p className="r-callout warn">
            At your current power costs, a full solar system would take a long time to pay for itself. A smaller system
            for your biggest daytime loads, or trimming the heaviest appliances first, may make more sense. Vendors can
            advise once quotes are available.
          </p>
        ) : (
          <p className="r-callout good">
            {solar.paybackMonthsVsCurrent && (
              <>Compared with what you pay now, it would pay for itself in about <strong>{monthsToText(solar.paybackMonthsVsCurrent)}</strong>. </>
            )}
            {solar.paybackMonthsVsGenerator && current.kind !== 'generator-only' && (
              <>Against running on a generator alone, about <strong>{monthsToText(solar.paybackMonthsVsGenerator)}</strong>.</>
            )}
          </p>
        )}
      </section>

      {/* ---------- Ways to get it ---------- */}
      <section className="r-card r-wide" aria-labelledby="r-ways">
        <p className="eyebrow">Ways to get it</p>
        <h2 id="r-ways">Pick how you want to pay</h2>
        <p className="r-sub">
          You don&apos;t have to buy anything to switch. Compared with <em>{current.label.toLowerCase()}</em> (about{' '}
          {naira(current.monthlyCost)} a month).
        </p>
        <div className="opt-grid">
          {OPTIONS.map(({ key, title, blurb }) => {
            const o = options[key];
            const vs = versusToday(o);
            const suggested = options.suggested === key;
            return (
              <article key={key} className={`opt${suggested ? ' opt-suggested' : ''}`}>
                <div className="opt-tags">
                  {suggested && <span className="tag tag-gold">Good fit for you</span>}
                  {options.lowestTotalKey === key && <span className="tag">Lowest cost over 5 years</span>}
                </div>
                <h3>{title}</h3>
                <p className="opt-blurb">{blurb}</p>
                <OptionDetails k={key} o={o} solar={solar} />
                <p className={`opt-vs opt-vs-${vs.tone}`}>
                  {key === 'buy' ? `After it's paid for: ${vs.text.toLowerCase()}` : vs.text}
                </p>
                {mode === 'guest' && onChoose ? (
                  <button type="button" className="btn btn-ghost btn-small opt-cta" onClick={() => onChoose(key)}>
                    Sign up to continue
                  </button>
                ) : (
                  <p className="opt-soon">Provider matching opens soon</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------- Assumptions ---------- */}
      <details className="r-assume">
        <summary>How we worked this out</summary>
        <ul>
          <li>We use typical power ratings for each size and type of appliance. Brand and model make little difference, so we don&apos;t ask for them. Your actual bill may differ.</li>
          <li>{assumptions.usageSpread}</li>
          <li>Fridges, freezers and air conditioners switch on and off through the day, so we count the share of time they actually draw power.</li>
          <li>
            Generator: {naira(assumptions.fuelPricePerLitre)}/litre, about {assumptions.litresPerKwh} litres of {assumptions.fuel} per kWh, plus{' '}
            {Math.round(assumptions.generatorMaintenancePct * 100)}% for servicing.
          </li>
          <li>
            Electricity prices per kWh (Band A to E):{' '}
            {Object.entries(assumptions.tariffs).map(([b, t]) => `${b} ${naira(t)}`).join(' · ')}.
            {!assumptions.tariffsVerified && ' These are approximate and may differ from your current DisCo rate.'}
          </li>
          <li>Solar: {assumptions.peakSunHours} peak sun hours a day for your area, {Math.round(assumptions.performanceRatio * 100)}% real-world efficiency. Prices are typical installed costs until you receive real vendor quotes.</li>
          <li>Lease: {assumptions.lease.termMonths} months, {Math.round(assumptions.lease.depositPct * 100)}% deposit. Energy as a service: {assumptions.eaas.termMonths} months. Both are indicative, not offers.</li>
          <li>Last updated {assumptions.asOf}.</li>
        </ul>
      </details>
    </div>
  );
}
