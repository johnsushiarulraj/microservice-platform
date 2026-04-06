import React, { useState } from 'react';

const ALL_DEPS = [
  { id: 'postgresql', label: 'PostgreSQL + Liquibase', category: 'Database' },
  { id: 'redis', label: 'Redis Cache', category: 'Database' },
  { id: 'kafka', label: 'Kafka (Spring Cloud Stream)', category: 'Messaging' },
  { id: 'sqs', label: 'SQS (AWS SDK v2)', category: 'Messaging' },
  { id: 's3', label: 'S3 (AWS SDK v2)', category: 'Storage' },
  { id: 'dynamodb', label: 'DynamoDB', category: 'Storage' },
  { id: 'opensearch', label: 'OpenSearch', category: 'Search' },
  { id: 'keycloak', label: 'Keycloak OAuth2', category: 'Security' },
  { id: 'actuator', label: 'Actuator + Prometheus Metrics', category: 'Observability' },
  { id: 'sleuth', label: 'Distributed Tracing (Sleuth)', category: 'Observability' },
  { id: 'resilience4j', label: 'Circuit Breaker (Resilience4j)', category: 'Resilience' },
];

export default function CreateService({ apiBase }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deps, setDeps] = useState(ALL_DEPS.map(d => d.id));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const toggleDep = (id) => {
    setDeps(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const packageName = name ? name.split('-')[0] : '';
  const contextPath = name ? '/' + name.replace('-service', '') : '';

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${apiBase}/api/scaffold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, dependencies: deps }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        setResult({ success: true });
      } else {
        setResult({ success: false, error: 'Generation failed' });
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setGenerating(false);
  };

  const categories = [...new Set(ALL_DEPS.map(d => d.category))];

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Create Microservice</h2>

      {/* Step indicators */}
      <div className="flex mb-8 text-sm">
        {['Name', 'Dependencies', 'Review'].map((label, i) => (
          <div key={label} className={`flex-1 text-center py-2 border-b-2 ${step === i + 1 ? 'border-blue-600 text-blue-600 font-medium' : 'border-gray-200 text-gray-400'}`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Service Name</label>
            <input type="text" placeholder="payment-service" value={name}
              onChange={e => setName(e.target.value)}
              className="border rounded px-3 py-2 w-full" />
            <p className="text-xs text-gray-500 mt-1">Lowercase with hyphens. E.g. payment-service, order-service</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input type="text" placeholder="Handles payment processing" value={description}
              onChange={e => setDescription(e.target.value)}
              className="border rounded px-3 py-2 w-full" />
          </div>
          {name && (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <div>Package: <code>com.example.{packageName}</code></div>
              <div>Context: <code>{contextPath}</code></div>
            </div>
          )}
          <button onClick={() => setStep(2)} disabled={!name}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Step 2: Dependencies */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-6">
          {categories.map(cat => (
            <div key={cat} className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">{cat}</h4>
              <div className="space-y-1">
                {ALL_DEPS.filter(d => d.category === cat).map(dep => (
                  <label key={dep.id} className="flex items-center text-sm cursor-pointer">
                    <input type="checkbox" checked={deps.includes(dep.id)}
                      onChange={() => toggleDep(dep.id)} className="mr-2" />
                    {dep.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 border rounded text-sm">Back</button>
            <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Review: {name}</h3>
          <div className="text-sm space-y-1 mb-4">
            <div>Package: <code>com.example.{packageName}</code></div>
            <div>Context: <code>{contextPath}</code></div>
            <div className="mt-2 font-medium">Dependencies ({deps.length}):</div>
            <ul className="list-disc pl-5">
              {deps.map(id => (
                <li key={id}>{ALL_DEPS.find(d => d.id === id)?.label}</li>
              ))}
            </ul>
          </div>
          {result && (
            <div className={`p-3 rounded text-sm mb-4 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.success ? `${name}.zip downloaded! Extract and open in your IDE.` : result.error}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 border rounded text-sm">Back</button>
            <button onClick={handleGenerate} disabled={generating}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">
              {generating ? 'Generating...' : 'Download ZIP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
