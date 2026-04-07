import React, { useState, useMemo, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { learnContent } from './learn/content';
import { Icon } from '../components/ui';

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative group my-4">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[13px] leading-relaxed overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <button onClick={copy}
        className="absolute top-2.5 right-2.5 px-2 py-1 text-xs rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-all">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function LearnPage({ page }) {
  return (
    <article className="max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">{page.section}</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{page.title}</h1>
      </div>

      <div className="prose-sm">
        {page.content.map((block, i) => {
          if (block.type === 'text') return <p key={i} className="text-[15px] leading-relaxed text-slate-600 mb-4">{block.value}</p>;
          if (block.type === 'heading') return <h2 key={i} className="text-base font-semibold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-100">{block.value}</h2>;
          if (block.type === 'code') return <CodeBlock key={i} code={block.value} />;
          if (block.type === 'list') return (
            <ul key={i} className="space-y-1.5 mb-4 ml-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-[15px] text-slate-600">
                  <span className="w-1 h-1 rounded-full bg-slate-400 mt-2.5 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          );
          if (block.type === 'table') return (
            <div key={i} className="my-4 border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  {block.headers.map((h, j) => <th key={j} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {block.rows.map((row, j) => (
                    <tr key={j} className="hover:bg-slate-50/50">
                      {row.map((cell, k) => <td key={k} className="px-4 py-2.5 text-sm text-slate-700">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          if (block.type === 'tip') return (
            <div key={i} className="flex gap-3 my-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">{block.value}</p>
            </div>
          );
          if (block.type === 'warning') return (
            <div key={i} className="flex gap-3 my-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{block.value}</p>
            </div>
          );
          return null;
        })}
      </div>
    </article>
  );
}

function SidebarSection({ section, pages, isExpanded, onToggle }) {
  return (
    <div className="mb-1">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-600">
          {section}
        </span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="ml-1">
          {pages.map(page => (
            <NavLink key={page.slug} to={`/learn/${page.slug}`}
              className={({ isActive }) =>
                `block px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                  isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`
              }>{page.title}</NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const [search, setSearch] = useState('');
  const location = useLocation();

  const sections = useMemo(() => {
    const map = {};
    learnContent.forEach(page => { if (!map[page.section]) map[page.section] = []; map[page.section].push(page); });
    return map;
  }, []);

  // Determine which section the current page belongs to
  const activeSection = useMemo(() => {
    const currentSlug = location.pathname.replace('/learn/', '').replace('/learn', '');
    const page = learnContent.find(p => p.slug === currentSlug);
    return page?.section || null;
  }, [location.pathname]);

  // Track which sections are expanded — default: only the active section
  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    Object.keys(sections).forEach(s => { initial[s] = s === activeSection; });
    // If no active section, expand the first one
    if (!activeSection && Object.keys(sections).length > 0) initial[Object.keys(sections)[0]] = true;
    return initial;
  });

  // Auto-expand active section when navigation changes
  const prevActiveRef = React.useRef(activeSection);
  React.useEffect(() => {
    if (activeSection && activeSection !== prevActiveRef.current) {
      setExpandedSections(prev => ({ ...prev, [activeSection]: true }));
      prevActiveRef.current = activeSection;
    }
  }, [activeSection]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => {
      const isCurrentlyOpen = prev[section];
      // Close all sections, then toggle the clicked one
      const allClosed = {};
      Object.keys(prev).forEach(k => { allClosed[k] = false; });
      return { ...allClosed, [section]: !isCurrentlyOpen };
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return sections;
    const q = search.toLowerCase();
    const map = {};
    learnContent.filter(p =>
      p.title.toLowerCase().includes(q) || p.section.toLowerCase().includes(q) ||
      p.content.some(b => (b.value || '').toLowerCase().includes(q))
    ).forEach(p => { if (!map[p.section]) map[p.section] = []; map[p.section].push(p); });
    return map;
  }, [search, sections]);

  const isSearching = search.length > 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="sticky top-0 bg-white z-10 px-4 pt-6 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-3">Learn</h2>
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search docs..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{learnContent.length} pages</p>
        </div>
        <nav className="px-3 py-3 overflow-y-auto flex-1">
          {Object.entries(filtered).map(([section, pages]) => (
            isSearching ? (
              <div key={section} className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">{section}</p>
                {pages.map(page => (
                  <NavLink key={page.slug} to={`/learn/${page.slug}`}
                    className={({ isActive }) =>
                      `block px-2.5 py-1.5 rounded-lg text-[13px] transition-all ${
                        isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`
                    }>{page.title}</NavLink>
                ))}
              </div>
            ) : (
              <SidebarSection
                key={section}
                section={section}
                pages={pages}
                isExpanded={!!expandedSections[section]}
                onToggle={() => toggleSection(section)}
              />
            )
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 px-12 py-8 overflow-y-auto">
        <Routes>
          {learnContent.map(page => (
            <Route key={page.slug} path={page.slug} element={<LearnPage page={page} />} />
          ))}
          <Route path="*" element={
            learnContent.length > 0 ? <Navigate to={`/learn/${learnContent[0].slug}`} replace /> : <div>No content</div>
          } />
        </Routes>
      </div>
    </div>
  );
}
