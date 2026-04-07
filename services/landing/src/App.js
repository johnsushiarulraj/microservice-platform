import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import CreateService from './pages/CreateService';
import Learn from './pages/Learn';
import Tutorial from './pages/Tutorial';

const DEVCONSOLE_URL = process.env.REACT_APP_DEVCONSOLE_URL || '/devconsole';

function TopNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900">JavaBackend</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/create" className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`
          }>Create</NavLink>
          <NavLink to="/learn" className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`
          }>Learn</NavLink>
          <NavLink to="/tutorial" className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`
          }>Tutorial</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <a href="https://github.com/johnsushiarulraj/microservice-platform" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
          <a href={`${DEVCONSOLE_URL}/login`}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            Dashboard
          </a>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <TopNav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<CreateService apiBase={DEVCONSOLE_URL} />} />
          <Route path="/learn/*" element={<Learn />} />
          <Route path="/tutorial" element={<Tutorial />} />
        </Routes>
      </div>
    </Router>
  );
}
