import React, { useState } from 'react';
import { PageHeader, Card, Button, Input, Badge, Alert, Icon } from '../components/ui';

const DEPS = [
  { id: 'postgresql', label: 'PostgreSQL + Liquibase', desc: 'Relational database with schema migrations', cat: 'Database' },
  { id: 'redis', label: 'Redis Cache', desc: 'In-memory caching with TTL', cat: 'Database' },
  { id: 'kafka', label: 'Kafka', desc: 'Event streaming via Spring Cloud Stream', cat: 'Messaging' },
  { id: 'sqs', label: 'SQS', desc: 'Task queues via AWS SDK', cat: 'Messaging' },
  { id: 's3', label: 'S3', desc: 'Object storage via AWS SDK', cat: 'Storage' },
  { id: 'dynamodb', label: 'DynamoDB', desc: 'NoSQL key-value store', cat: 'Storage' },
  { id: 'opensearch', label: 'OpenSearch', desc: 'Full-text search engine', cat: 'Search' },
  { id: 'keycloak', label: 'Keycloak OAuth2', desc: 'JWT authentication via gateway', cat: 'Security' },
  { id: 'actuator', label: 'Prometheus Metrics', desc: 'Health checks and metrics export', cat: 'Observability' },
  { id: 'sleuth', label: 'Distributed Tracing', desc: 'Trace ID propagation (Sleuth)', cat: 'Observability' },
  { id: 'resilience4j', label: 'Circuit Breaker', desc: 'Resilience4j retry and fallback', cat: 'Resilience' },
];

function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              i + 1 < current ? 'bg-slate-900 text-white' :
              i + 1 === current ? 'bg-slate-900 text-white ring-4 ring-slate-900/10' :
              'bg-slate-100 text-slate-400'
            }`}>{i + 1 < current ? <Icon name="check" className="w-3.5 h-3.5" /> : i + 1}</div>
            <span className={`text-sm hidden sm:inline ${i + 1 === current ? 'font-medium text-slate-900' : 'text-slate-400'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${i + 1 < current ? 'bg-slate-900' : 'bg-slate-200'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CreateService({ apiBase }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [deps, setDeps] = useState(DEPS.map(d => d.id));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (id) => setDeps(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  const pkg = name ? name.split('-')[0] : '';
  const ctx = name ? '/' + name.replace('-service', '') : '';
  const cats = [...new Set(DEPS.map(d => d.cat))];

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${apiBase}/api/scaffold`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, dependencies: deps }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${name}.zip`; a.click();
        URL.revokeObjectURL(url);
        setResult({ ok: true });
      } else { setResult({ ok: false, err: 'Generation failed — scaffold API not implemented yet' }); }
    } catch (e) { setResult({ ok: false, err: e.message }); }
    setGenerating(false);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Create Service" description="Generate a new microservice from the template" />
      <StepIndicator current={step} steps={['Configure', 'Dependencies', 'Review']} />

      {step === 1 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Service Details</h3>
          <div className="space-y-4">
            <Input label="Service Name" placeholder="payment-service" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Description (optional)" placeholder="Handles payment processing" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          {name && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Package:</span> <code className="text-slate-900 font-mono text-xs bg-white px-1.5 py-0.5 rounded border">com.example.{pkg}</code></div>
                <div><span className="text-slate-500">Context:</span> <code className="text-slate-900 font-mono text-xs bg-white px-1.5 py-0.5 rounded border">{ctx}</code></div>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!name}>Continue</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Dependencies</h3>
            <Badge variant="neutral">{deps.length} selected</Badge>
          </div>
          <div className="space-y-5">
            {cats.map(cat => (
              <div key={cat}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat}</p>
                <div className="space-y-1">
                  {DEPS.filter(d => d.cat === cat).map(dep => (
                    <label key={dep.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                      deps.includes(dep.id) ? 'bg-slate-50 border-slate-300' : 'border-transparent hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={deps.includes(dep.id)} onChange={() => toggle(dep.id)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{dep.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{dep.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Continue</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Review</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Service</span>
              <span className="text-sm font-medium text-slate-900">{name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Package</span>
              <code className="text-sm font-mono text-slate-900">com.example.{pkg}</code>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Context Path</span>
              <code className="text-sm font-mono text-slate-900">{ctx}</code>
            </div>
            <div className="py-2">
              <span className="text-sm text-slate-500 block mb-2">Dependencies ({deps.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {deps.map(id => <Badge key={id} variant="info">{DEPS.find(d => d.id === id)?.label}</Badge>)}
              </div>
            </div>
          </div>

          {result && (
            <Alert variant={result.ok ? 'success' : 'error'}>
              {result.ok ? `${name}.zip downloaded! Extract, open in IDE, run ./scripts/build.sh 1.0.0` : result.err}
            </Alert>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={generate} loading={generating}><Icon name="download" className="w-4 h-4" /> Download ZIP</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
