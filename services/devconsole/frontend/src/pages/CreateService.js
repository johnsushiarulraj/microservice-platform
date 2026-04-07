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
  { id: 'keycloak', label: 'Keycloak OAuth2', desc: 'JWT authentication via gateway', cat: 'Security', mandatory: true },
  { id: 'actuator', label: 'Prometheus + Grafana', desc: 'Health checks, metrics, dashboards', cat: 'Observability', mandatory: true },
  { id: 'sleuth', label: 'Distributed Tracing + Loki', desc: 'Trace IDs, structured logging', cat: 'Observability', mandatory: true },
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
  const [groupId, setGroupId] = useState('com.example');
  const [artifactId, setArtifactId] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [deps, setDeps] = useState(DEPS.map(d => d.id));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (id) => setDeps(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  // Derive values from artifact ID
  const serviceName = name || (artifactId ? artifactId + '-service' : '');
  const packageName = artifactId ? groupId + '.' + artifactId.replace(/-/g, '') : '';
  const ctx = artifactId ? '/' + artifactId : '';
  const cats = [...new Set(DEPS.map(d => d.cat))];

  // Update name when artifact changes
  const handleArtifactChange = (val) => {
    setArtifactId(val);
    setName(val ? val + '-service' : '');
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${apiBase}/api/scaffold`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serviceName, description: desc, dependencies: deps, groupId, artifactId }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${serviceName}.zip`; a.click();
        URL.revokeObjectURL(url);
        setResult({ ok: true });
      } else { setResult({ ok: false, err: 'Generation failed' }); }
    } catch (e) { setResult({ ok: false, err: e.message }); }
    setGenerating(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <PageHeader title="Create Service" description="Generate a new microservice from the template" />
      <StepIndicator current={step} steps={['Configure', 'Dependencies', 'Review']} />

      {step === 1 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Project Metadata</h3>

          {/* Build info (read-only, like start.spring.io) */}
          <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Build</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">Maven</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Language</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">Java 11</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Framework</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">Spring Boot 2.7</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Config</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">YAML</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Group" placeholder="com.example" value={groupId} onChange={e => setGroupId(e.target.value)} />
              <Input label="Artifact" placeholder="payment" value={artifactId} onChange={e => handleArtifactChange(e.target.value)} />
            </div>
            <Input label="Service Name" placeholder="payment-service" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Description (optional)" placeholder="Handles payment processing" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {artifactId && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Package:</span> <code className="text-slate-900 font-mono text-xs bg-white px-1.5 py-0.5 rounded border">{packageName}</code></div>
                <div><span className="text-slate-500">Context:</span> <code className="text-slate-900 font-mono text-xs bg-white px-1.5 py-0.5 rounded border">{ctx}</code></div>
                <div><span className="text-slate-500">Service:</span> <code className="text-slate-900 font-mono text-xs bg-white px-1.5 py-0.5 rounded border">{serviceName}</code></div>
                <div><span className="text-slate-500">Artifact:</span> <code className="text-slate-900 font-mono text-xs bg-white px-1.5 py-0.5 rounded border">{groupId}:{artifactId}</code></div>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!artifactId}>Continue</Button>
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
                    <label key={dep.id} className={`flex items-start gap-3 p-3 rounded-lg transition-all border ${
                      dep.mandatory ? 'bg-slate-50 border-slate-200 cursor-default' :
                      deps.includes(dep.id) ? 'bg-slate-50 border-slate-300 cursor-pointer' : 'border-transparent hover:bg-slate-50 cursor-pointer'}`}>
                      <input type="checkbox" checked={deps.includes(dep.id)} onChange={() => !dep.mandatory && toggle(dep.id)}
                        disabled={dep.mandatory}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 disabled:opacity-50" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {dep.label}
                          {dep.mandatory && <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Required</span>}
                        </div>
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
              <span className="text-sm text-slate-500">Group</span>
              <code className="text-sm font-mono text-slate-900">{groupId}</code>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Artifact</span>
              <code className="text-sm font-mono text-slate-900">{artifactId}</code>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Service Name</span>
              <span className="text-sm font-medium text-slate-900">{serviceName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Package</span>
              <code className="text-sm font-mono text-slate-900">{packageName}</code>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Context Path</span>
              <code className="text-sm font-mono text-slate-900">{ctx}</code>
            </div>
            <div className="grid grid-cols-4 gap-2 py-2 border-b border-slate-100">
              <div><span className="text-xs text-slate-400">Build</span><p className="text-sm text-slate-900">Maven</p></div>
              <div><span className="text-xs text-slate-400">Java</span><p className="text-sm text-slate-900">11</p></div>
              <div><span className="text-xs text-slate-400">Spring Boot</span><p className="text-sm text-slate-900">2.7</p></div>
              <div><span className="text-xs text-slate-400">Config</span><p className="text-sm text-slate-900">YAML</p></div>
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
              {result.ok ? `${serviceName}.zip downloaded! Extract, run scripts/build.bat 1.0.0, then deploy from DevConsole.` : result.err}
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
