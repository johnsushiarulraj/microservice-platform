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
  { path: '/', label: 'Dashboard' },
  { path: '/services', label: 'Services' },
  { path: '/create', label: 'Create Service' },
  { path: '/data/sqs', label: 'SQS' },
  { path: '/data/s3', label: 'S3' },
  { path: '/learn', label: 'Learn' },
];

const EXTERNAL_LINKS = [
  { label: 'Keycloak', url: 'http://localhost:18081', color: 'bg-red-500' },
  { label: 'Grafana', url: 'http://localhost:13000', color: 'bg-orange-500' },
  { label: 'Prometheus', url: 'http://localhost:19090', color: 'bg-yellow-600' },
  { label: 'pgAdmin', url: 'http://localhost:15050', color: 'bg-blue-500' },
  { label: 'OpenSearch Dash', url: 'http://localhost:15601', color: 'bg-purple-500' },
  { label: 'DynamoDB Admin', url: 'http://localhost:18001', color: 'bg-green-500' },
  { label: 'Kafka UI', url: 'http://localhost:18002', color: 'bg-indigo-500' },
  { label: 'K8s Dashboard', url: 'https://localhost:13003', color: 'bg-gray-600' },
];

function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">DevConsole</h1>
        <p className="text-xs text-gray-400">Microservice Platform</p>
      </div>
      <nav className="flex-1 p-2">
        <p className="text-xs text-gray-500 uppercase px-3 pt-3 pb-1">Management</p>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <p className="text-xs text-gray-500 uppercase px-3 pt-4 pb-1">External Tools</p>
        {EXTERNAL_LINKS.map(link => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded"
          >
            <span className={`w-2 h-2 rounded-full ${link.color} mr-2`}></span>
            {link.label}
            <span className="ml-auto text-xs text-gray-500">↗</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
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
