import React, { useState, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { learnContent } from './learn/content';

function CodeBlock({ code, lang }) {
  return (
    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto my-3 font-mono">
      <code>{code}</code>
    </pre>
  );
}

function LearnPage({ page }) {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-2">{page.title}</h2>
      <p className="text-sm text-gray-500 mb-6">{page.section}</p>

      {page.content.map((block, i) => {
        if (block.type === 'text') {
          return <p key={i} className="text-gray-700 mb-4 leading-relaxed">{block.value}</p>;
        }
        if (block.type === 'heading') {
          return <h3 key={i} className="text-lg font-semibold mt-6 mb-3">{block.value}</h3>;
        }
        if (block.type === 'code') {
          return <CodeBlock key={i} code={block.value} lang={block.lang} />;
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
              {block.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
        }
        if (block.type === 'table') {
          return (
            <table key={i} className="w-full text-sm border mb-4">
              <thead className="bg-gray-50">
                <tr>{block.headers.map((h, j) => <th key={j} className="text-left px-3 py-2 border-b">{h}</th>)}</tr>
              </thead>
              <tbody>
                {block.rows.map((row, j) => (
                  <tr key={j} className="border-b">
                    {row.map((cell, k) => <td key={k} className="px-3 py-2 font-mono text-xs">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        if (block.type === 'tip') {
          return (
            <div key={i} className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm text-blue-800">
              {block.value}
            </div>
          );
        }
        if (block.type === 'warning') {
          return (
            <div key={i} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 text-sm text-yellow-800">
              {block.value}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function Learn() {
  const [search, setSearch] = useState('');
  const sections = useMemo(() => {
    const sectionMap = {};
    learnContent.forEach(page => {
      if (!sectionMap[page.section]) sectionMap[page.section] = [];
      sectionMap[page.section].push(page);
    });
    return sectionMap;
  }, []);

  const filteredContent = useMemo(() => {
    if (!search) return learnContent;
    const q = search.toLowerCase();
    return learnContent.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.section.toLowerCase().includes(q) ||
      p.content.some(b => (b.value || '').toLowerCase().includes(q))
    );
  }, [search]);

  const filteredSections = useMemo(() => {
    const sectionMap = {};
    filteredContent.forEach(page => {
      if (!sectionMap[page.section]) sectionMap[page.section] = [];
      sectionMap[page.section].push(page);
    });
    return sectionMap;
  }, [filteredContent]);

  return (
    <div className="flex -m-6">
      {/* Learn Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen p-4 overflow-y-auto">
        <h3 className="font-bold text-lg mb-3">Learn</h3>
        <input type="text" placeholder="Search..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-full mb-4" />

        {Object.entries(filteredSections).map(([section, pages]) => (
          <div key={section} className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{section}</p>
            {pages.map(page => (
              <NavLink key={page.slug}
                to={`/learn/${page.slug}`}
                className={({ isActive }) =>
                  `block px-2 py-1 text-sm rounded ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
                }>
                {page.title}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>

      {/* Learn Content */}
      <div className="flex-1 p-6 overflow-auto">
        <Routes>
          {learnContent.map(page => (
            <Route key={page.slug} path={page.slug} element={<LearnPage page={page} />} />
          ))}
          <Route path="*" element={
            learnContent.length > 0
              ? <Navigate to={`/learn/${learnContent[0].slug}`} replace />
              : <div>No content</div>
          } />
        </Routes>
      </div>
    </div>
  );
}
