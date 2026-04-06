import React, { useState, useEffect } from 'react';

const STATUS_COLORS = { UP: 'bg-green-500', DOWN: 'bg-red-500', DEGRADED: 'bg-yellow-500' };

export default function Dashboard({ apiBase }) {
  const [health, setHealth] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/health`).then(r => r.json()).catch(() => ({})),
      fetch(`${apiBase}/api/services`).then(r => r.json()).catch(() => []),
    ]).then(([h, s]) => {
      setHealth(h);
      setServices(s);
      setLoading(false);
    });
  }, [apiBase]);

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const infraServices = ['postgresql', 'redis', 'kafka', 'localstack', 'keycloak', 'opensearch'];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Health Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Infrastructure Health</h3>
        <div className="grid grid-cols-6 gap-3">
          {infraServices.map(name => {
            const status = health[name]?.status || 'UNKNOWN';
            return (
              <div key={name} className="bg-white rounded-lg shadow p-4 text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${STATUS_COLORS[status] || 'bg-gray-400'}`}></div>
                <div className="text-sm font-medium capitalize">{name}</div>
                <div className="text-xs text-gray-500">{status}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deployed Services */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Deployed Services</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Chart</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map(svc => (
                <tr key={svc.name} className="border-t">
                  <td className="px-4 py-2 font-medium">{svc.name}</td>
                  <td className="px-4 py-2 text-gray-500">{svc.chart}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${svc.status === 'deployed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {svc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Keycloak', url: 'http://localhost:18081', desc: 'admin / admin' },
            { label: 'Grafana', url: 'http://localhost:13000', desc: 'admin / admin' },
            { label: 'pgAdmin', url: 'http://localhost:15050', desc: 'admin@admin.com' },
            { label: 'Kafka UI', url: 'http://localhost:18002', desc: 'Topics & messages' },
            { label: 'DynamoDB Admin', url: 'http://localhost:18001', desc: 'Tables & items' },
            { label: 'OpenSearch Dash', url: 'http://localhost:15601', desc: 'Search & indices' },
            { label: 'Prometheus', url: 'http://localhost:19090', desc: 'Raw metrics' },
            { label: 'Gateway Health', url: 'http://localhost:18090/actuator/health', desc: 'API Gateway' },
          ].map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="font-medium text-sm">{link.label}</div>
              <div className="text-xs text-gray-500 mt-1">{link.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
