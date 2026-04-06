import React, { useState, useEffect } from 'react';

const STATUS_CONFIG = {
  UP: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-500/20' },
  DOWN: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-500/20' },
  DEGRADED: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-500/20' },
  UNKNOWN: { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', text: 'text-slate-500', ring: 'ring-slate-400/20' },
};

const QUICK_LINKS = [
  { label: 'Keycloak', url: 'http://localhost:18081', desc: 'Identity & Access', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', color: 'from-rose-500 to-pink-600' },
  { label: 'Grafana', url: 'http://localhost:13000', desc: 'Dashboards & Metrics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'from-amber-500 to-orange-600' },
  { label: 'pgAdmin', url: 'http://localhost:15050', desc: 'PostgreSQL Manager', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', color: 'from-sky-500 to-blue-600' },
  { label: 'Kafka UI', url: 'http://localhost:18002', desc: 'Topics & Messages', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-indigo-500 to-violet-600' },
  { label: 'DynamoDB', url: 'http://localhost:18001', desc: 'NoSQL Tables', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'from-emerald-500 to-teal-600' },
  { label: 'OpenSearch', url: 'http://localhost:15601', desc: 'Search & Analytics', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'from-violet-500 to-purple-600' },
  { label: 'Prometheus', url: 'http://localhost:19090', desc: 'Raw Metrics', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'from-slate-500 to-gray-600' },
  { label: 'API Gateway', url: 'http://localhost:18090/actuator/health', desc: 'Gateway Health', icon: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z', color: 'from-cyan-500 to-blue-600' },
];

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200"></div>
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );
}

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

  if (loading) return <LoadingSpinner />;

  const infraServices = ['postgresql', 'redis', 'kafka', 'localstack', 'keycloak', 'opensearch'];
  const overall = health.overall || 'UNKNOWN';
  const overallConfig = STATUS_CONFIG[overall] || STATUS_CONFIG.UNKNOWN;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Infrastructure overview and quick access</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${overallConfig.bg} border ${overallConfig.border}`}>
          <span className={`w-2 h-2 rounded-full ${overallConfig.dot} animate-pulse`}></span>
          <span className={`text-sm font-medium ${overallConfig.text}`}>System {overall}</span>
        </div>
      </div>

      {/* Health Grid */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Infrastructure Health</h3>
        <div className="grid grid-cols-6 gap-3">
          {infraServices.map(name => {
            const status = health[name]?.status || 'UNKNOWN';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;
            return (
              <div key={name} className={`${config.bg} border ${config.border} rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md`}>
                <div className={`w-3 h-3 rounded-full ${config.dot} mx-auto mb-2.5 ring-4 ${config.ring}`}></div>
                <div className="text-sm font-semibold text-slate-700 capitalize">{name}</div>
                <div className={`text-xs font-medium mt-0.5 ${config.text}`}>{status}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deployed Services */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Deployed Services</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{services.length} releases</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chart</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map(svc => (
                <tr key={svc.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{svc.name}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{svc.chart}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      svc.status === 'deployed'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${svc.status === 'deployed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
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
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Access</h3>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 shadow-sm`}>
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
              </div>
              <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{link.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{link.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
