// Pendulum sim — physical pendulum with damping
const PendulumSim = () => {
  const [playing, setPlaying] = React.useState(true);
  const [L, setL] = React.useState(1.2);       // length (m)
  const [g, setG] = React.useState(9.8);       // gravity (m/s^2)
  const [theta0, setTheta0] = React.useState(0.6); // initial angle (rad)
  const [damping, setDamping] = React.useState(0.05);
  const [rate, setRate] = React.useState(1.0);
  const [trail, setTrail] = React.useState(true);
  const [showPeriod, setShowPeriod] = React.useState(true);
  const [theta, setTheta] = React.useState(theta0);
  const [omega, setOmega] = React.useState(0);
  const [t, setT] = React.useState(0);

  const W = 520, H = 400;
  const pivotX = W / 2;
  const pivotY = 50;
  const lenPx = L * 180; // 1m = 180px
  const bobR = 14;

  useRaf(playing, (dt) => {
    const step = dt * rate;
    // simple pendulum ODE: theta'' = -(g/L) sin(theta) - damping * theta'
    const alpha = -(g / L) * Math.sin(theta) - damping * omega;
    const newOmega = omega + alpha * step;
    const newTheta = theta + newOmega * step;
    setOmega(newOmega);
    setTheta(newTheta);
    setT(p => p + step);
  });

  const reset = () => {
    setTheta(theta0); setOmega(0); setT(0);
    trailRef.current = [];
  };
  // reset when theta0 changes
  React.useEffect(() => { setTheta(theta0); setOmega(0); setT(0); trailRef.current = []; }, [theta0]);

  const bobX = pivotX + Math.sin(theta) * lenPx;
  const bobY = pivotY + Math.cos(theta) * lenPx;

  const trailRef = React.useRef([]);
  const lastTrailT = React.useRef(0);
  React.useEffect(() => {
    if (!trail) return;
    if (t - lastTrailT.current > 0.03) {
      trailRef.current.push({ x: bobX, y: bobY });
      if (trailRef.current.length > 120) trailRef.current.shift();
      lastTrailT.current = t;
    }
  });

  // period T = 2π√(L/g) (small angle)
  const period = 2 * Math.PI * Math.sqrt(L / g);

  const trailPath = trailRef.current.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  ).join(' ');

  const readouts = [
    { label: 'θ', val: (theta * 180 / Math.PI).toFixed(1) + '°' },
    { label: 'ω', val: omega.toFixed(2) },
    { label: 'T', val: period.toFixed(2) + 's' },
  ];

  // Reference arc showing rest / swing extents
  const arcR = lenPx;
  const arcMax = Math.abs(theta0);
  const arcX1 = pivotX + Math.sin(arcMax) * arcR;
  const arcY1 = pivotY + Math.cos(arcMax) * arcR;
  const arcX2 = pivotX - Math.sin(arcMax) * arcR;
  const arcY2 = pivotY + Math.cos(arcMax) * arcR;

  return (
    <div className="sim-canvas-wrap">
      <div className="sim-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{background: 'var(--paper)', width: '100%', height: '100%'}}>
          {/* Ceiling / ground lines */}
          <line x1="40" y1={pivotY} x2={W - 40} y2={pivotY} stroke="#16213A" strokeWidth="1.5"/>
          <g>
            {[...Array(14)].map((_, i) => (
              <line key={i}
                x1={40 + i * ((W - 80) / 14)} y1={pivotY - 10}
                x2={40 + i * ((W - 80) / 14) + 8} y2={pivotY}
                stroke="#16213A" strokeWidth="1.2" opacity="0.7"
              />
            ))}
          </g>

          {/* Equilibrium line */}
          <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + lenPx + 30}
                stroke="#16213A" strokeWidth="1" strokeDasharray="3 4" opacity="0.25"/>

          {/* Swing extent arc */}
          {showPeriod && (
            <>
              <path
                d={`M${arcX1},${arcY1} A ${arcR} ${arcR} 0 0 0 ${arcX2} ${arcY2}`}
                fill="none" stroke="#3A4BD1" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4"
              />
              {/* Angle arc near pivot */}
              <path
                d={`M ${pivotX} ${pivotY + 50}
                    A 50 50 0 0 ${theta > 0 ? 0 : 1}
                    ${pivotX + Math.sin(theta) * 50} ${pivotY + Math.cos(theta) * 50}`}
                fill="none" stroke="#EC6A4C" strokeWidth="2"
              />
              <text
                x={pivotX + Math.sin(theta/2) * 70}
                y={pivotY + Math.cos(theta/2) * 70 + 4}
                fontFamily="JetBrains Mono, monospace" fontSize="12"
                fill="#EC6A4C" textAnchor="middle"
              >
                θ
              </text>
            </>
          )}

          {/* Trail */}
          {trail && trailPath && (
            <path d={trailPath} fill="none" stroke="#1E9E84" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          )}

          {/* String */}
          <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#16213A" strokeWidth="2"/>

          {/* Pivot */}
          <circle cx={pivotX} cy={pivotY} r="5" fill="#16213A"/>
          <circle cx={pivotX} cy={pivotY} r="2" fill="#FBF7EE"/>

          {/* Bob */}
          <circle cx={bobX} cy={bobY} r={bobR + 2} fill="#16213A"/>
          <circle cx={bobX} cy={bobY} r={bobR} fill="#EC6A4C"/>
          <circle cx={bobX - 4} cy={bobY - 4} r="3" fill="#F79A82" opacity="0.9"/>
        </svg>
      </div>
      <Transport
        playing={playing}
        onTogglePlay={() => setPlaying(p => !p)}
        onReset={reset}
        t={t} tMax={null}
        onScrub={() => {}}
        readouts={readouts}
      />
      <div className="sim-params">
        <div className="panel-head">
          <h4>Parameters</h4>
          <span className="pill">Mechanics</span>
        </div>
        <div className="param-group-title">Physics</div>
        <Param name="Length (L)" value={L} min={0.3} max={2.2} step={0.05} unit="m" onChange={setL} desc="Period grows with √L."/>
        <Param name="Gravity (g)" value={g} min={1.6} max={25} step={0.1} unit="m/s²" onChange={setG} desc="Earth 9.8. Moon 1.6. Jupiter 24.8."/>
        <Param name="Damping" value={damping} min={0} max={0.5} step={0.01} onChange={setDamping} desc="Air + friction. 0 is ideal."/>
        <div className="param-group-title">Initial conditions</div>
        <Param name="Start angle" value={theta0} min={0.05} max={1.4} step={0.01}
               fmt={v => (v * 180 / Math.PI).toFixed(0) + '°'}
               onChange={setTheta0}/>
        <div className="param-group-title">Time</div>
        <Param name="Time rate" value={rate} min={0.1} max={2.5} step={0.05} unit="×" onChange={setRate}/>
        <div className="param-group-title">Display</div>
        <Toggle name="Swing trail" on={trail} onChange={setTrail}/>
        <Toggle name="Show angle" on={showPeriod} onChange={setShowPeriod}/>
      </div>
    </div>
  );
};

window.PendulumSim = PendulumSim;
