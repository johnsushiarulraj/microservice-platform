import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import CreateService from './pages/CreateService';
import SqsManager from './pages/SqsManager';
import S3Manager from './pages/S3Manager';
import Learn from './pages/Learn';

const API_BASE = process.env.REACT_APP_API_URL || '/devconsole';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/services', label: 'Services', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/create', label: 'Create Service', icon: 'M12 4v16m8-8H4' },
  { path: '/data/sqs', label: 'SQS Queues', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/data/s3', label: 'S3 Storage', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { path: '/learn', label: 'Learn', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

const EXTERNAL_LINKS = [
  { label: 'Keycloak', url: 'http://localhost:18081', color: 'bg-rose-500' },
  { label: 'Grafana', url: 'http://localhost:13000', color: 'bg-amber-500' },
  { label: 'Prometheus', url: 'http://localhost:19090', color: 'bg-yellow-500' },
  { label: 'pgAdmin', url: 'http://localhost:15050', color: 'bg-sky-500' },
  { label: 'OpenSearch', url: 'http://localhost:15601', color: 'bg-violet-500' },
  { label: 'DynamoDB', url: 'http://localhost:18001', color: 'bg-emerald-500' },
  { label: 'Kafka UI', url: 'http://localhost:18002', color: 'bg-indigo-500' },
  { label: 'K8s Dashboard', url: 'https://localhost:13003', color: 'bg-slate-500' },
];

function Icon({ d, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Sidebar() {
  return (
    <aside className="w-60 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">DevConsole</h1>
            <p className="text-[10px] text-slate-400 tracking-wide uppercase">Microservice Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Management</p>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                isActive
                  ? 'bg-slate-700/70 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            <Icon d={item.icon} className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-4 pb-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">External Tools</p>
        </div>
        {EXTERNAL_LINKS.map(link => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 rounded-lg transition-all duration-150 group"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${link.color} ring-2 ring-slate-900 flex-shrink-0`}></span>
            <span className="flex-1">{link.label}</span>
            <svg className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-600">v1.0.0</p>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <Router basename="/devconsole">
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard apiBase={API_BASE} />} />
            <Route path="/services" element={<Services apiBase={API_BASE} />} />
            <Route path="/create" element={<CreateService apiBase={API_BASE} />} />
            <Route path="/data/sqs" element={<SqsManager apiBase={API_BASE} />} />
            <Route path="/data/s3" element={<S3Manager apiBase={API_BASE} />} />
            <Route path="/learn/*" element={<Learn />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
