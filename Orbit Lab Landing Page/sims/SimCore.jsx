// Shared icons + tiny helpers
const Icon = {
  Play: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/></svg>
  ),
  Pause: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>
  ),
  Reset: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 10 9 10"/></svg>
  ),
  Orbit: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><ellipse cx="12" cy="12" rx="10" ry="4"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
  ),
  Pendulum: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="4" y1="4" x2="20" y2="4"/><line x1="12" y1="4" x2="18" y2="18"/><circle cx="18" cy="19" r="3" fill="currentColor"/></svg>
  ),
  Wave: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12c2 0 2-5 5-5s3 10 6 10 3-10 6-10 2 5 3 5"/></svg>
  ),
  Arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="5 12 10 17 20 7"/></svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
  ),
};

// rAF loop hook — calls onFrame(dt_seconds) when playing
const useRaf = (playing, onFrame) => {
  const ref = React.useRef({ last: 0, onFrame });
  ref.current.onFrame = onFrame;
  React.useEffect(() => {
    if (!playing) return;
    let raf;
    ref.current.last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - ref.current.last) / 1000);
      ref.current.last = t;
      ref.current.onFrame(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
};

// Param slider component
const Param = ({ name, value, min, max, step, unit, fmt, onChange, desc }) => {
  const display = fmt ? fmt(value) : (value.toFixed(step < 1 ? 2 : 0) + (unit ? ` ${unit}` : ''));
  return (
    <div className="param">
      <div className="param-head">
        <span className="name">{name}</span>
        <span className="val">{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      {desc && <div className="desc">{desc}</div>}
    </div>
  );
};

// Toggle component
const Toggle = ({ name, on, onChange }) => (
  <div className="toggle-row">
    <span className="name">{name}</span>
    <button
      className={'toggle' + (on ? ' on' : '')}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={name}
    />
  </div>
);

// Transport bar
const Transport = ({ playing, onTogglePlay, onReset, t, tMax, onScrub, readouts, rate, onRateChange }) => (
  <div className="sim-transport">
    <button className="tp-btn play" onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'}>
      {playing ? <Icon.Pause/> : <Icon.Play/>}
    </button>
    <button className="tp-btn" onClick={onReset} aria-label="Reset"><Icon.Reset/></button>
    {tMax != null && (
      <div className="tp-scrub">
        <span>t</span>
        <input
          type="range" min="0" max={tMax} step="0.01"
          value={t} onChange={e => onScrub(parseFloat(e.target.value))}
        />
        <span style={{minWidth: 44, textAlign: 'right'}}>{t.toFixed(1)}s</span>
      </div>
    )}
    <div className="readouts">
      {readouts.map((r, i) => (
        <div key={i} className="r">
          <span className="label">{r.label}</span>
          <span className="val">{r.val}</span>
        </div>
      ))}
    </div>
  </div>
);

window.Icon = Icon;
window.useRaf = useRaf;
window.Param = Param;
window.Toggle = Toggle;
window.Transport = Transport;
