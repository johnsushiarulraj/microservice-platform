import React, { useState, useEffect } from 'react';

export default function Services({ apiBase }) {
  const [services, setServices] = useState([]);
  const [deployForm, setDeployForm] = useState({ name: '', tag: 'latest', contextPath: '' });
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState('');

  const loadServices = () => {
    fetch(`${apiBase}/api/services`).then(r => r.json()).then(setServices).catch(() => {});
  };

  useEffect(() => { loadServices(); }, [apiBase]);

  const handleDeploy = async (e) => {
    e.preventDefault();
    setDeploying(true);
    setMessage('Deploying...');
    try {
      const body = {
        name: deployForm.name,
        tag: deployForm.tag,
        contextPath: deployForm.contextPath || '/' + deployForm.name.replace('-service', ''),
      };
      const res = await fetch(`${apiBase}/api/services/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMessage(`Deployed ${data.name} (${data.image})`);
      loadServices();
    } catch (err) {
      setMessage('Deploy failed: ' + err.message);
    }
    setDeploying(false);
  };

  const handleDestroy = async (name) => {
    if (!window.confirm(`Destroy ${name}?`)) return;
    try {
      await fetch(`${apiBase}/api/services/${name}`, { method: 'DELETE' });
      setMessage(`Destroyed ${name}`);
      loadServices();
    } catch (err) {
      setMessage('Destroy failed: ' + err.message);
    }
  };

  const handleRestart = async (name) => {
    await fetch(`${apiBase}/api/services/${name}/restart`, { method: 'POST' });
    setMessage(`Restarting ${name}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Services</h2>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">{message}</div>
      )}

      {/* Deploy Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Deploy Service</h3>
        <form onSubmit={handleDeploy} className="flex gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Service Name</label>
            <input type="text" required placeholder="payment-service"
              className="border rounded px-3 py-2 text-sm w-48"
              value={deployForm.name}
              onChange={e => setDeployForm({ ...deployForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Image Tag</label>
            <input type="text" required placeholder="1.0.0"
              className="border rounded px-3 py-2 text-sm w-32"
              value={deployForm.tag}
              onChange={e => setDeployForm({ ...deployForm, tag: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Context Path</label>
            <input type="text" placeholder="/payment (auto)"
              className="border rounded px-3 py-2 text-sm w-36"
              value={deployForm.contextPath}
              onChange={e => setDeployForm({ ...deployForm, contextPath: e.target.value })} />
          </div>
          <button type="submit" disabled={deploying}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {deploying ? 'Deploying...' : 'Deploy'}
          </button>
        </form>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Chart</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(svc => (
              <tr key={svc.name} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{svc.name}</td>
                <td className="px-4 py-3 text-gray-500">{svc.chart}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${svc.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {svc.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleRestart(svc.name)}
                    className="text-xs text-blue-600 hover:underline">Restart</button>
                  <button onClick={() => handleDestroy(svc.name)}
                    className="text-xs text-red-600 hover:underline">Destroy</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
