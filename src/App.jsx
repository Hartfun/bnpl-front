import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend, LabelList
} from 'recharts';

// v2.1 - cluster personas, gold theme, full width
const API = 'https://bnpl-back.onrender.com';

/* ── colour tokens ─────────────────────────────────────────────────────────── */
const C = {
  accent: '#C9A84C', accent2: '#F0D080',
  positive: '#C9A84C', neutral: '#e2e8f0', negative: '#ef4444',
  cluster: ['#C9A84C', '#F0D080', '#e2e8f0'],
  bg: '#0a0a0a', surface: '#111111', surface2: '#1a1a1a', border: '#2a2a2a',
  text: '#f8f8f8', muted: '#888888',
};

/* ── tiny shared components ─────────────────────────────────────────────────── */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 28, ...style
  }}>{children}</div>
);

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 600, background: color + '22', color,
    border: `1px solid ${color}55`
  }}>{label}</span>
);

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted }}>
    <div style={{
      width: 16, height: 16, border: `2px solid ${C.border}`,
      borderTopColor: C.accent, borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: 14 }}>Analysing…</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const StatTile = ({ label, value, sub, color = C.accent }) => (
  <Card>
    <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 36, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </Card>
);

const sentimentColor = s =>
  s === 'Positive' ? C.positive : s === 'Negative' ? C.negative : C.neutral;

/* ── Tabs ───────────────────────────────────────────────────────────────────── */
const TABS = ['Overview', 'Predict', 'Clusters'];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState('Overview');
  const [statsData, setStatsData] = useState(null);
  const [statsErr, setStatsErr] = useState(null);
  const [fields, setFields] = useState(['Engineering / Technology','Science','Commerce / Management','Arts / Humanities','Medicine / Pharmacy','Other']);
  const [funds, setFunds] = useState(['Parental Allowance','Part-time Job','Scholarship / Stipend','Freelancing','Other']);

  /* api status */
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking' | 'online' | 'offline' | 'waking'

  /* predict form */
  const [text, setText] = useState('');
  const [field, setField] = useState('');
  const [fund, setFund] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predErr, setPredErr] = useState(null);

  /* fetch overview stats + check API status */
  useEffect(() => {
    let wakeTimer;
    const checkAndLoad = async () => {
      try {
        // First check health
        const health = await fetch(`${API}/api/health`);
        if (!health.ok) throw new Error('not ok');
        const hdata = await health.json();
        if (!hdata.models_ready) {
          setApiStatus('waking');
          wakeTimer = setTimeout(checkAndLoad, 4000);
          return;
        }
        setApiStatus('online');

        // Load stats and fields in parallel
        const [statsRes, fieldsRes] = await Promise.all([
          fetch(`${API}/api/stats`),
          fetch(`${API}/api/fields`),
        ]);
        const statsJson  = await statsRes.json();
        const fieldsJson = await fieldsRes.json();
        setStatsData(statsJson);
        setFields(fieldsJson.fields || []);
        setFunds(fieldsJson.funds   || []);
      } catch {
        setApiStatus('offline');
        setStatsErr('Cannot reach the API at ' + API);
      }
    };
    checkAndLoad();
    return () => clearTimeout(wakeTimer);
  }, []);

  const handlePredict = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true); setPredErr(null); setResult(null);
    try {
      const res = await fetch(`${API}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, field, funds: fund }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) {
      setPredErr(e.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [text, field, fund]);

  /* ── render ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Header */}
      <header style={{
        background: '#111111', borderBottom: `1px solid #2a2a2a`,
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg,#C9A84C,#F0D080)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>💳</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>BNPL Insight</div>
            <div style={{ fontSize: 11, color: C.muted }}>Student Survey · ML Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* API status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: apiStatus === 'online' ? '#22c55e'
                : apiStatus === 'waking'  ? '#f59e0b'
                : apiStatus === 'checking'? '#94a3b8'
                : '#ef4444',
              boxShadow: apiStatus === 'online' ? '0 0 6px #22c55e88' : 'none',
            }} />
            <span style={{ color: C.muted }}>
              {apiStatus === 'online'   ? 'API online'
               : apiStatus === 'waking'  ? 'API waking up…'
               : apiStatus === 'checking'? 'Checking API…'
               : 'API offline'}
            </span>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 500, fontSize: 14, transition: 'all .15s',
                background: tab === t ? '#C9A84C' : 'transparent',
                color: tab === t ? '#0a0a0a' : C.muted,
              }}>{t}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ width: '100%', padding: '32px 40px', boxSizing: 'border-box' }}>
        {tab === 'Overview' && <Overview data={statsData} err={statsErr} />}
        {tab === 'Predict' && (
          <Predict
            fields={fields} funds={funds}
            text={text} setText={setText}
            field={field} setField={setField}
            fund={fund} setFund={setFund}
            onSubmit={handlePredict}
            loading={loading} result={result} err={predErr}
          />
        )}
        {tab === 'Clusters' && <Clusters data={statsData} />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════════════════════════════════════════════ */
function Overview({ data, err }) {
  if (err) return <ErrorBox msg={err} />;
  if (!data) return <LoadingScreen />;

  const { total, users, non_users, sentiment, models: m, field_distribution } = data;

  const sentPie = [
    { name: 'Positive', value: sentiment.positive, fill: C.positive },
    { name: 'Neutral', value: sentiment.neutral, fill: C.neutral },
    { name: 'Negative', value: sentiment.negative, fill: C.negative },
  ];

  const fieldData = Object.entries(field_distribution)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.split('/')[0].trim(), value }));

  const modelAccData = [
    { name: 'Logistic\nRegression', accuracy: +(m.lr_accuracy * 100).toFixed(1), fill: C.accent },
    { name: 'Random\nForest', accuracy: +(m.rf_accuracy * 100).toFixed(1), fill: '#F0D080' },
    { name: 'Gradient\nBoosting', accuracy: +(m.gb_accuracy * 100).toFixed(1), fill: '#e2e8f0' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
        <StatTile label="Total Responses" value={total} sub="Survey participants" />
        <StatTile label="BNPL Users" value={users}
          sub={`${(users/total*100).toFixed(1)}% adoption rate`} color={C.positive} />
        <StatTile label="Non-Users" value={non_users}
          sub={`${(non_users/total*100).toFixed(1)}% of respondents`} color={C.neutral} />
        <StatTile label="Best Model Acc."
          value={`${(Math.max(m.lr_accuracy, m.rf_accuracy, m.gb_accuracy)*100).toFixed(1)}%`}
          sub="Random Forest (Adoption)" color={'#C9A84C'} />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
        <Card>
          <SectionTitle>Sentiment Distribution (VADER)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sentPie} cx="50%" cy="50%" outerRadius={85}
                dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}>
                {sentPie.map(e => <Cell key={e.name} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Responses']}
                contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {sentPie.map(e => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.fill }} />
                <span style={{ color: C.muted }}>{e.name}: <b style={{ color: C.text }}>{e.value}</b></span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Model Accuracy Comparison</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelAccData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 12 }} />
              <YAxis domain={[80, 100]} tick={{ fill: C.muted, fontSize: 12 }} unit="%" />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Accuracy']}
                contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {modelAccData.map(e => <Cell key={e.name} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Field distribution */}
      <Card>
        <SectionTitle>Respondents by Field of Study</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fieldData} layout="vertical" margin={{ left: 10, right: 70, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: C.muted, fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={185} tick={{ fill: C.text, fontSize: 13 }} interval={0} />
            <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            <Bar dataKey="value" fill={'#C9A84C'} radius={[0, 6, 6, 0]}>
              <LabelList dataKey="value" position="right" style={{ fill: C.text, fontSize: 13, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Model cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {[
          { title: '🤖 Logistic Regression', desc: 'Sentiment Classification (TF-IDF)', acc: m.lr_accuracy, color: '#C9A84C' },
          { title: '🌲 Random Forest', desc: 'BNPL Adoption Prediction', acc: m.rf_accuracy, color: '#F0D080' },
          { title: '🚀 Gradient Boosting', desc: 'Advanced Sentiment Analysis', acc: m.gb_accuracy, color: '#e2e8f0' },
        ].map(({ title, desc, acc, color }) => (
          <Card key={title} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{title.split(' ')[0]}</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title.split(' ').slice(1).join(' ')}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{desc}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color }}>{(acc * 100).toFixed(1)}%</div>
            <div style={{ fontSize: 11, color: C.muted }}>Test Accuracy</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREDICT TAB
═══════════════════════════════════════════════════════════════════════════ */
function Predict({ fields, funds, text, setText, field, setField, fund, setFund, onSubmit, loading, result, err }) {

  const CLUSTERS = [
    {
      id: 1, label: 'Cluster 1', name: 'Risk-Aware Avoiders',
      color: '#C9A84C', desc: 'Low adoption · Negative sentiment',
      personas: [
        { label: 'Debt anxiety', icon: '😰', text: 'I am very worried about debt and hidden charges. BNPL services feel risky and I prefer to avoid them entirely.' },
        { label: 'No trust', icon: '🚫', text: 'I do not trust buy now pay later apps. The fine print is confusing and missing payments ruins your credit score.' },
      ],
    },
    {
      id: 2, label: 'Cluster 2', name: 'Active Adopters',
      color: '#F0D080', desc: 'High adoption · Positive sentiment',
      personas: [
        { label: 'Regular user', icon: '✅', text: 'I use BNPL regularly for gadgets and online shopping. It is very convenient and helps me spread payments easily.' },
        { label: 'Smart finance', icon: '💡', text: 'Zero interest EMI is a great financial tool. I used it to buy my laptop and it did not affect my monthly budget at all.' },
      ],
    },
    {
      id: 3, label: 'Cluster 3', name: 'Curious Explorers',
      color: '#e2e8f0', desc: 'Mixed adoption · Neutral sentiment',
      personas: [
        { label: 'Considering it', icon: '🤔', text: 'I have never used BNPL but I am curious. It seems useful for big purchases though I worry about overspending.' },
        { label: 'Peer influence', icon: '👥', text: 'My friends use BNPL services and say it is helpful. I might try it for my next purchase if the terms are clear.' },
      ],
    },
  ];

  const FIELD_ICONS = {
    'Engineering / Technology': '💻',
    'Commerce / Management': '📊',
    'Science': '🔬',
    'Arts / Humanities': '🎨',
    'Medicine / Pharmacy': '⚕️',
    'Other': '📚',
  };

  const FUND_ICONS = {
    'Parental Allowance': '👨‍👩‍👧',
    'Part-time Job': '💼',
    'Scholarship / Stipend': '🏆',
    'Freelancing': '💻',
    'Other': '💰',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860, margin: '0 auto', width: '100%' }}>

      {/* Quick example pills */}
      <Card>
        <SectionTitle>Quick examples</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {CLUSTERS.flatMap(cl => cl.personas).map((p) => (
            <button key={p.label} onClick={() => setText(p.text)} style={{
              padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              border: text === p.text ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
              background: text === p.text ? C.accent + '18' : C.surface2,
              transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 12, color: text === p.text ? C.accent2 : C.text, lineHeight: 1.3 }}>{p.label}</span>
              <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{p.text.slice(0, 55)}…</span>
            </button>
          ))}
        </div>

        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted }}>or type your own</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a student's opinion about BNPL/EMI services…"
          rows={3}
          style={{
            width: '100%', padding: 14, borderRadius: 10, resize: 'vertical',
            background: C.surface2, border: `1px solid ${C.border}`,
            color: C.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
            transition: 'border .15s', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />

        {/* Profile selectors */}
        <div style={{ marginTop: 16, marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 500 }}>STUDENT PROFILE (improves adoption prediction)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Field of study pills */}
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Field of study</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {fields.map(f => (
                  <button key={f} onClick={() => setField(field === f ? '' : f)} style={{
                    padding: '6px 11px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: field === f ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: field === f ? C.accent + '33' : 'transparent',
                    color: field === f ? C.accent2 : C.muted, transition: 'all .15s',
                  }}>
                    {FIELD_ICONS[f] || '📚'} {f.split('/')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Funding source pills */}
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Funding source</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {funds.map(f => (
                  <button key={f} onClick={() => setFund(fund === f ? '' : f)} style={{
                    padding: '6px 11px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: fund === f ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: fund === f ? C.accent + '33' : 'transparent',
                    color: fund === f ? C.accent2 : C.muted, transition: 'all .15s',
                  }}>
                    {FUND_ICONS[f] || '💰'} {f}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Run button */}
        <button
          onClick={onSubmit}
          disabled={loading || !text.trim()}
          style={{
            marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 10,
            border: 'none', cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
            background: loading || !text.trim()
              ? C.border
              : `linear-gradient(135deg,${C.accent},${C.accent2})`,
            color: '#0a0a0a', fontWeight: 700, fontSize: 15, transition: 'all .2s',
            letterSpacing: '0.03em',
          }}
        >
          {loading ? '⏳  Analysing…' : '▶  Run All 4 Models'}
        </button>

        {loading && <div style={{ marginTop: 12 }}><Spinner /></div>}
        {err && <ErrorBox msg={err} />}
      </Card>

      {result && <PredictResult result={result} text={text} />}
    </div>
  );
}

function PredictResult({ result, text }) {
  const sentC = sentimentColor(result.vader_label);
  const adoptC = result.adoption_label === 'User' ? C.positive : C.neutral;

  const probaData = Object.entries(result.lr_probabilities).map(([name, value]) => ({
    name, value: +(value * 100).toFixed(1), fill: sentimentColor(name),
  }));

  // Smooth scroll to results after render
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  return (
    <div ref={ref} style={{
      display: 'flex', flexDirection: 'column', gap: 16,
      animation: 'fadeSlideIn 0.5s ease forwards',
    }}>
    <style>{`
      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
      {/* Echoed input */}
      <Card style={{ borderLeft: `4px solid ${C.accent}` }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>INPUT</div>
        <div style={{ fontSize: 14, fontStyle: 'italic', color: C.muted }}>"{text}"</div>
      </Card>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        <Card style={{ borderLeft: `4px solid ${sentC}` }}>
          <div style={{ fontSize: 12, color: C.muted }}>VADER Compound Score</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: sentC }}>
            {result.vader_score > 0 ? '+' : ''}{result.vader_score}
          </div>
          <Badge label={result.vader_label} color={sentC} />
        </Card>
        <Card style={{ borderLeft: `4px solid ${adoptC}` }}>
          <div style={{ fontSize: 12, color: C.muted }}>Adoption Probability (RF)</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: adoptC }}>
            {result.adoption_probability}%
          </div>
          <Badge label={result.adoption_label} color={adoptC} />
        </Card>
      </div>

      {/* Model outputs */}
      <Card>
        <SectionTitle>All Model Outputs</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {[
            { label: '🤖 Logistic Regression Sentiment', value: result.lr_sentiment, color: sentimentColor(result.lr_sentiment) },
            { label: '🚀 Gradient Boosting Sentiment', value: result.gb_sentiment, color: sentimentColor(result.gb_sentiment) },
            { label: '📍 Student Cluster', value: `Cluster ${result.cluster}`, color: C.cluster[result.cluster - 1] },
            { label: '🎯 Adoption Prediction', value: result.adoption_label, color: adoptC },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: C.surface2, borderRadius: 10, padding: 16,
              border: `1px solid ${C.border}`
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{label}</div>
              <Badge label={value} color={color} />
            </div>
          ))}
        </div>
      </Card>

      {/* LR probability bar */}
      <Card>
        <SectionTitle>Logistic Regression — Class Probabilities</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={probaData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 13 }} />
            <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 12 }} unit="%" />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Probability']}
              contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {probaData.map(e => <Cell key={e.name} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLUSTERS TAB
═══════════════════════════════════════════════════════════════════════════ */
function Clusters({ data }) {
  if (!data) return <LoadingScreen />;
  const { clusters } = data;

  const NAMES = ['💡 Curious Explorers', '⚠️ Risk-Aware Avoiders', '✅ Active Adopters'];
  const DESCS = [
    'Moderate sentiment, mixed adoption. Students exploring digital credit options.',
    'Lower sentiment scores, higher caution. Concerned about debt and hidden fees.',
    'High sentiment, active BNPL users. Comfortable with digital credit products.',
  ];

  const adoptData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`, value: c.adoption_rate, fill: C.cluster[i],
  }));

  const sentData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`, value: c.avg_sentiment, fill: C.cluster[i],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <SectionTitle>K-Means Segmentation (k = 3)</SectionTitle>
        <p style={{ color: C.muted, fontSize: 14 }}>
          Students were clustered into 3 segments using K-Means on sentiment score, field of study, and funding source.
          The optimal k was determined via the Elbow method.
        </p>
      </Card>

      {/* Cluster cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {clusters.map((c, i) => (
          <Card key={c.id} style={{ borderTop: `4px solid ${C.cluster[i]}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{NAMES[i].split(' ')[0]}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.cluster[i], marginBottom: 4 }}>
              {NAMES[i].split(' ').slice(1).join(' ')}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>{DESCS[i]}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Metric label="Students" value={c.size} color={C.cluster[i]} />
              <Metric label="Adoption Rate" value={`${c.adoption_rate}%`} color={C.cluster[i]} />
              <Metric label="Avg Sentiment" value={c.avg_sentiment.toFixed(3)} color={C.cluster[i]} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
        <Card>
          <SectionTitle>BNPL Adoption Rate by Cluster</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={adoptData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 13 }} />
              <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 12 }} unit="%" />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Adoption']}
                contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {adoptData.map(e => <Cell key={e.name} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Average Sentiment Score by Cluster</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sentData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 13 }} />
              <YAxis domain={[-0.5, 0.5]} tick={{ fill: C.muted, fontSize: 12 }} />
              <Tooltip
                formatter={(v) => [v, 'Avg Sentiment']}
                contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {sentData.map(e => <Cell key={e.name} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ── tiny helpers ──────────────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{children}</div>;
}

function Metric({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          background: C.surface2, border: `1px solid ${C.border}`,
          color: value ? C.text : C.muted, fontSize: 13, outline: 'none',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      marginTop: 12, padding: 14, borderRadius: 10,
      background: '#ef444422', border: `1px solid ${C.negative}`,
      color: '#fca5a5', fontSize: 14,
    }}>⚠️ {msg}</div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 300, gap: 16, color: C.muted,
    }}>
      <div style={{
        width: 40, height: 40, border: `3px solid ${C.border}`,
        borderTopColor: C.accent, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div>Loading dashboard data…</div>
    </div>
  );
}
