// Wave Interference sim — superposition of two sine waves
const WaveSim = () => {
  const [playing, setPlaying] = React.useState(true);
  const [f1, setF1] = React.useState(1.0);
  const [f2, setF2] = React.useState(1.5);
  const [a1, setA1] = React.useState(1.0);
  const [a2, setA2] = React.useState(1.0);
  const [phase2, setPhase2] = React.useState(0);
  const [rate, setRate] = React.useState(1.0);
  const [showSum, setShowSum] = React.useState(true);
  const [showBoth, setShowBoth] = React.useState(true);
  const [t, setT] = React.useState(0);

  useRaf(playing, (dt) => setT(p => p + dt * rate));

  const W = 520, H = 400;
  const padX = 30, padY = 20;
  const innerW = W - padX * 2;
  const waveH = 70; // amplitude in px
  const rowY = [110, 210, 320]; // y positions of w1, w2, sum

  const N = 120;
  const xs = [...Array(N + 1)].map((_, i) => padX + (i / N) * innerW);
  const phaseT = t * 2 * Math.PI;

  const y1 = xs.map(x => {
    const u = (x - padX) / innerW;
    return rowY[0] - a1 * waveH * Math.sin(2 * Math.PI * f1 * u * 2 - phaseT);
  });
  const y2 = xs.map(x => {
    const u = (x - padX) / innerW;
    return rowY[1] - a2 * waveH * Math.sin(2 * Math.PI * f2 * u * 2 - phaseT + phase2);
  });
  const ySum = xs.map((x, i) => rowY[2] - ((rowY[0] - y1[i]) + (rowY[1] - y2[i])));

  const toPath = (pts) => pts.map((y, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Readout: amplitude at x=middle
  const midSum = (rowY[0] - y1[60]) + (rowY[1] - y2[60]);
  const readouts = [
    { label: 'Δf', val: (f2 - f1).toFixed(2) },
    { label: 'φ', val: (phase2 * 180 / Math.PI).toFixed(0) + '°' },
    { label: 'A(mid)', val: midSum.toFixed(1) },
  ];

  const Axis = ({ y, label, color }) => (
    <g>
      <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#16213A" strokeWidth="1" opacity="0.25" strokeDasharray="2 3"/>
      <text x={padX - 6} y={y + 4} fontFamily="JetBrains Mono, monospace" fontSize="11" fill={color} textAnchor="end">{label}</text>
    </g>
  );

  return (
    <div className="sim-canvas-wrap">
      <div className="sim-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{background: 'var(--paper)', width: '100%', height: '100%'}}>
          <Axis y={rowY[0]} label="w₁" color="#1E9E84"/>
          <Axis y={rowY[1]} label="w₂" color="#EC6A4C"/>
          <Axis y={rowY[2]} label="Σ" color="#16213A"/>

          {/* dividers */}
          <line x1={padX} y1={170} x2={W - padX} y2={170} stroke="#16213A" opacity="0.1"/>
          <line x1={padX} y1={270} x2={W - padX} y2={270} stroke="#16213A" opacity="0.1"/>

          {showBoth && <path d={toPath(y1)} fill="none" stroke="#1E9E84" strokeWidth="2.5" strokeLinecap="round"/>}
          {showBoth && <path d={toPath(y2)} fill="none" stroke="#EC6A4C" strokeWidth="2.5" strokeLinecap="round"/>}
          {showSum && <path d={toPath(ySum)} fill="none" stroke="#16213A" strokeWidth="2.5" strokeLinecap="round"/>}

          {/* shaded envelope for sum */}
          {showSum && (
            <path
              d={`${toPath(ySum)} L ${xs[N].toFixed(1)},${rowY[2]} L ${xs[0].toFixed(1)},${rowY[2]} Z`}
              fill="#16213A" opacity="0.05"
            />
          )}

          {/* label top */}
          <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#16213A" opacity="0.6">
            <text x={W - padX} y={rowY[0] - waveH - 8} textAnchor="end">f={f1.toFixed(2)}Hz  a={a1.toFixed(2)}</text>
            <text x={W - padX} y={rowY[1] - waveH - 8} textAnchor="end">f={f2.toFixed(2)}Hz  a={a2.toFixed(2)}  φ={(phase2*180/Math.PI).toFixed(0)}°</text>
            <text x={W - padX} y={rowY[2] - waveH - 8} textAnchor="end">superposition</text>
          </g>
        </svg>
      </div>
      <Transport
        playing={playing}
        onTogglePlay={() => setPlaying(p => !p)}
        onReset={() => setT(0)}
        t={t} tMax={null}
        onScrub={() => {}}
        readouts={readouts}
      />
      <div className="sim-params">
        <div className="panel-head">
          <h4>Parameters</h4>
          <span className="pill">Waves</span>
        </div>
        <div className="param-group-title">Wave 1</div>
        <Param name="Frequency f₁" value={f1} min={0.2} max={3} step={0.05} unit="Hz" onChange={setF1}/>
        <Param name="Amplitude a₁" value={a1} min={0} max={1.5} step={0.05} onChange={setA1}/>
        <div className="param-group-title">Wave 2</div>
        <Param name="Frequency f₂" value={f2} min={0.2} max={3} step={0.05} unit="Hz" onChange={setF2}/>
        <Param name="Amplitude a₂" value={a2} min={0} max={1.5} step={0.05} onChange={setA2}/>
        <Param
          name="Phase offset" value={phase2}
          min={0} max={2 * Math.PI} step={0.05}
          fmt={v => (v * 180 / Math.PI).toFixed(0) + '°'}
          onChange={setPhase2}
          desc="0° additive, 180° cancels at equal freq."
        />
        <div className="param-group-title">Time & display</div>
        <Param name="Time rate" value={rate} min={0.1} max={2.5} step={0.05} unit="×" onChange={setRate}/>
        <Toggle name="Show components" on={showBoth} onChange={setShowBoth}/>
        <Toggle name="Show sum" on={showSum} onChange={setShowSum}/>
      </div>
    </div>
  );
};

window.WaveSim = WaveSim;
