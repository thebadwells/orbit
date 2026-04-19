// Orbital Motion sim
const OrbitalSim = ({ compact = false, initialPlaying = true, initialTrail = true }) => {
  const [playing, setPlaying] = React.useState(initialPlaying);
  const [mass, setMass] = React.useState(1.0);      // central mass
  const [ecc, setEcc] = React.useState(0.35);       // eccentricity
  const [a, setA] = React.useState(120);            // semi-major axis px
  const [rate, setRate] = React.useState(1.0);      // time scale
  const [trail, setTrail] = React.useState(initialTrail);
  const [vectors, setVectors] = React.useState(false);
  const [t, setT] = React.useState(0);
  const [M, setM] = React.useState(0); // mean anomaly

  const W = compact ? 460 : 520;
  const H = compact ? 340 : 380;

  // Kepler params
  const b = a * Math.sqrt(1 - ecc * ecc);
  // Period ~ a^(3/2) / sqrt(M), normalize so period at a=120, mass=1 is ~4s
  const period = 4 * Math.pow(a / 120, 1.5) / Math.sqrt(mass);
  const n = 2 * Math.PI / period; // mean motion

  // Solve Kepler's equation for eccentric anomaly E from mean anomaly M
  const solveE = (M, ecc) => {
    let E = M;
    for (let i = 0; i < 6; i++) {
      E = E - (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
    }
    return E;
  };

  const E = solveE(M, ecc);
  // Position relative to center of ellipse
  const x = a * (Math.cos(E) - ecc);
  const y = b * Math.sin(E);
  // distance from focus (the star at left focus)
  const r = Math.sqrt(x * x + y * y);
  // Orbital speed (vis-viva): v = sqrt( GM (2/r - 1/a) )
  // Normalize GM such that at a=120, speed scales reasonably
  const GM = mass * 6000;
  const rPhys = Math.max(1, r);
  const speed = Math.sqrt(GM * Math.max(0.0001, (2 / rPhys - 1 / a)));

  const trailRef = React.useRef([]);
  const lastTrailT = React.useRef(0);

  useRaf(playing, (dt) => {
    setT(p => p + dt * rate);
    setM(p => p + dt * n * rate);
  });

  // Track trail (retain N points)
  React.useEffect(() => {
    if (!trail) { trailRef.current = []; return; }
    if (t - lastTrailT.current > 0.02) {
      trailRef.current.push({ x, y });
      if (trailRef.current.length > 240) trailRef.current.shift();
      lastTrailT.current = t;
    }
  });

  const reset = () => {
    setT(0); setM(0);
    trailRef.current = [];
  };

  // SVG coords — center at (W/2 + ecc*a, H/2) so the star (left focus) is visible
  const cx = W / 2;
  const cy = H / 2;
  // Place ellipse so star (focus) is roughly centered at cx, cy
  const ellipseCx = cx + ecc * a;
  const ellipseCy = cy;

  const planetX = ellipseCx + x;
  const planetY = ellipseCy - y;

  // Velocity vector (tangent to orbit)
  // dE/dt = n / (1 - ecc*cosE)
  const dEdt = n / (1 - ecc * Math.cos(E));
  const vx = -a * Math.sin(E) * dEdt;
  const vy = b * Math.cos(E) * dEdt;
  const vMag = Math.sqrt(vx * vx + vy * vy);
  const vScale = 18 / Math.max(0.01, vMag) * (vMag); // normalized
  const vNormX = vx / Math.max(0.01, vMag);
  const vNormY = vy / Math.max(0.01, vMag);

  // Gravity vector (from planet toward star)
  const gDx = cx - planetX;
  const gDy = cy - planetY;
  const gMag = Math.sqrt(gDx * gDx + gDy * gDy);

  const trailPath = trailRef.current.map((p, i) => {
    const px = ellipseCx + p.x;
    const py = ellipseCy - p.y;
    return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(' ');

  const readouts = [
    { label: 'r (AU)', val: (r / 80).toFixed(2) },
    { label: 'v', val: (vMag * 0.5).toFixed(2) },
    { label: 'T', val: period.toFixed(2) + 's' },
  ];

  return (
    <div className="sim-canvas-wrap">
      <div className="sim-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{background: 'var(--paper)'}}>
          {/* Star-field backdrop */}
          <defs>
            <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F4B92A" stopOpacity="1"/>
              <stop offset="60%" stopColor="#F4B92A" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#F4B92A" stopOpacity="0"/>
            </radialGradient>
            <pattern id="stars" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="18" r="0.7" fill="#16213A" opacity="0.35"/>
              <circle cx="48" cy="54" r="0.5" fill="#16213A" opacity="0.25"/>
              <circle cx="68" cy="12" r="0.8" fill="#16213A" opacity="0.3"/>
              <circle cx="30" cy="70" r="0.6" fill="#16213A" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#stars)"/>

          {/* Orbit ellipse */}
          <ellipse
            cx={ellipseCx} cy={ellipseCy} rx={a} ry={b}
            fill="none" stroke="#16213A" strokeWidth="1.5"
            strokeDasharray="4 4" opacity="0.35"
          />
          {/* Foci markers */}
          <circle cx={cx} cy={cy} r="2" fill="#16213A" opacity="0.4"/>
          <circle cx={ellipseCx + ecc * a} cy={ellipseCy} r="2" fill="#16213A" opacity="0.2"/>

          {/* Trail */}
          {trail && trailPath && (
            <path d={trailPath} fill="none" stroke="#1E9E84" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
          )}

          {/* Star (sun) */}
          <circle cx={cx} cy={cy} r={18 + mass * 6} fill="url(#star-glow)"/>
          <circle cx={cx} cy={cy} r={8 + mass * 3} fill="#F4B92A" stroke="#16213A" strokeWidth="1.5"/>

          {/* Gravity vector */}
          {vectors && (
            <g>
              <line
                x1={planetX} y1={planetY}
                x2={planetX + gDx * 0.25}
                y2={planetY + gDy * 0.25}
                stroke="#EC6A4C" strokeWidth="2" strokeLinecap="round"
              />
              <circle cx={planetX + gDx * 0.25} cy={planetY + gDy * 0.25} r="3" fill="#EC6A4C"/>
            </g>
          )}

          {/* Velocity vector */}
          {vectors && (
            <g>
              <line
                x1={planetX} y1={planetY}
                x2={planetX + vNormX * 45}
                y2={planetY - vNormY * 45}
                stroke="#3A4BD1" strokeWidth="2" strokeLinecap="round"
              />
              <circle cx={planetX + vNormX * 45} cy={planetY - vNormY * 45} r="3" fill="#3A4BD1"/>
            </g>
          )}

          {/* Planet */}
          <circle cx={planetX} cy={planetY} r="8" fill="#1E9E84" stroke="#16213A" strokeWidth="1.5"/>

          {/* Labels */}
          <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#16213A" opacity="0.6">
            <text x={cx + 14} y={cy + 4}>★</text>
            {vectors && <text x={planetX + vNormX * 45 + 6} y={planetY - vNormY * 45 + 3} fill="#3A4BD1">v</text>}
            {vectors && <text x={planetX + gDx * 0.25 + 6} y={planetY + gDy * 0.25 + 3} fill="#EC6A4C">F</text>}
          </g>
        </svg>
      </div>
      <Transport
        playing={playing}
        onTogglePlay={() => setPlaying(p => !p)}
        onReset={reset}
        t={t} tMax={period * 2}
        onScrub={(v) => { setT(v); setM(v * n); }}
        readouts={readouts}
      />
      {!compact && (
        <div className="sim-params">
          <div className="panel-head">
            <h4>Parameters</h4>
            <span className="pill">Astronomy</span>
          </div>
          <div className="param-group-title">Central body</div>
          <Param
            name="Star mass (M☉)" value={mass}
            min={0.3} max={3} step={0.05}
            onChange={setMass}
            desc="Heavier star → shorter orbital period."
          />
          <div className="param-group-title">Orbit</div>
          <Param
            name="Eccentricity (e)" value={ecc}
            min={0} max={0.85} step={0.01}
            onChange={setEcc}
            desc="0 is circular. 0.7 is Halley-comet-ish."
          />
          <Param
            name="Semi-major axis (a)" value={a}
            min={70} max={180} step={1} unit="px"
            onChange={setA}
          />
          <div className="param-group-title">Time</div>
          <Param
            name="Time rate" value={rate}
            min={0.1} max={3} step={0.05} unit="×"
            onChange={setRate}
          />
          <div className="param-group-title">Display</div>
          <Toggle name="Show trail" on={trail} onChange={setTrail}/>
          <Toggle name="Show vectors" on={vectors} onChange={setVectors}/>
        </div>
      )}
    </div>
  );
};

// Compact hero variant — just the canvas in a windowed card
const OrbitalHero = () => {
  return (
    <div className="hero-sim" aria-label="Orbital motion demonstration">
      <div className="hero-sim-head">
        <div className="dots"><span/><span/><span/></div>
        <span className="title">orbital_motion.sim — live</span>
      </div>
      <OrbitalSimCompact/>
    </div>
  );
};

// compact variant reuses sim logic but w/o panel
const OrbitalSimCompact = () => {
  const [playing, setPlaying] = React.useState(true);
  const [ecc, setEcc] = React.useState(0.3);
  const [mass, setMass] = React.useState(1.0);
  const [M, setM] = React.useState(0);
  const [t, setT] = React.useState(0);
  const a = 140;
  const b = a * Math.sqrt(1 - ecc * ecc);
  const period = 4 * Math.pow(a / 120, 1.5) / Math.sqrt(mass);
  const n = 2 * Math.PI / period;
  const W = 500, H = 360;

  const solveE = (M, ecc) => {
    let E = M;
    for (let i = 0; i < 6; i++) E = E - (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
    return E;
  };
  const E = solveE(M, ecc);
  const x = a * (Math.cos(E) - ecc);
  const y = b * Math.sin(E);
  const r = Math.sqrt(x * x + y * y);

  const cx = W / 2;
  const cy = H / 2;
  const ellipseCx = cx + ecc * a;
  const planetX = ellipseCx + x;
  const planetY = cy - y;

  const trailRef = React.useRef([]);
  const lastT = React.useRef(0);
  useRaf(playing, (dt) => { setT(p => p + dt); setM(p => p + dt * n); });
  React.useEffect(() => {
    if (t - lastT.current > 0.02) {
      trailRef.current.push({ x, y });
      if (trailRef.current.length > 180) trailRef.current.shift();
      lastT.current = t;
    }
  });
  const trailPath = trailRef.current.map((p, i) => {
    const px = ellipseCx + p.x;
    const py = cy - p.y;
    return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(' ');

  return (
    <div style={{position:'relative', aspectRatio: '500/420', background: 'var(--paper)'}}>
      <svg viewBox={`0 0 ${W} 420`} preserveAspectRatio="xMidYMid meet" style={{width: '100%', height: '100%', display:'block'}}>
        <defs>
          <pattern id="stars-hero" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="18" r="0.7" fill="#16213A" opacity="0.4"/>
            <circle cx="48" cy="54" r="0.5" fill="#16213A" opacity="0.3"/>
            <circle cx="56" cy="10" r="0.8" fill="#16213A" opacity="0.35"/>
            <circle cx="22" cy="60" r="0.6" fill="#16213A" opacity="0.3"/>
          </pattern>
          <radialGradient id="hero-star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4B92A" stopOpacity="1"/>
            <stop offset="60%" stopColor="#F4B92A" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#F4B92A" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width={W} height="420" fill="url(#stars-hero)"/>

        <ellipse cx={ellipseCx} cy={cy} rx={a} ry={b} fill="none" stroke="#16213A" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3"/>
        {trailPath && <path d={trailPath} fill="none" stroke="#1E9E84" strokeWidth="2" strokeLinecap="round" opacity="0.65"/>}
        <circle cx={cx} cy={cy} r={28} fill="url(#hero-star-glow)"/>
        <circle cx={cx} cy={cy} r={10 + mass * 3} fill="#F4B92A" stroke="#16213A" strokeWidth="1.5"/>
        <circle cx={planetX} cy={planetY} r="9" fill="#EC6A4C" stroke="#16213A" strokeWidth="1.5"/>

        {/* Inline sliders */}
        <g transform={`translate(24, ${420 - 56})`} fontFamily="DM Sans, sans-serif">
          <rect x="0" y="0" width={W - 48} height="44" rx="12" fill="#fff" stroke="#16213A" strokeWidth="1.5"/>
        </g>
      </svg>

      {/* Overlay controls at the bottom */}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 16,
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff',
        border: '1.5px solid #16213A',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '2px 2px 0 #16213A'
      }}>
        <button
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1.5px solid #16213A',
            background: '#1E9E84', color: '#fff',
            cursor: 'pointer', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '1.5px 1.5px 0 #16213A', flexShrink: 0
          }}
        >
          {playing ? <Icon.Pause style={{width:14,height:14}}/> : <Icon.Play style={{width:14,height:14}}/>}
        </button>
        <div style={{display:'flex', flexDirection:'column', gap:2, flex: 1, minWidth: 0}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'#7A839C'}}>
            <span>eccentricity</span>
            <span style={{color:'#16213A', fontWeight: 600}}>{ecc.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="0.75" step="0.01" value={ecc} onChange={e => setEcc(parseFloat(e.target.value))} style={{margin: 0}}/>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:2, flex: 1, minWidth: 0}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'#7A839C'}}>
            <span>star mass</span>
            <span style={{color:'#16213A', fontWeight: 600}}>{mass.toFixed(2)}</span>
          </div>
          <input type="range" min="0.4" max="2.5" step="0.05" value={mass} onChange={e => setMass(parseFloat(e.target.value))} style={{margin: 0}}/>
        </div>
      </div>
    </div>
  );
};

window.OrbitalSim = OrbitalSim;
window.OrbitalHero = OrbitalHero;
