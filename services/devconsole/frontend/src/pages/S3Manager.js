import { useAuth } from '../auth';
import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, Card, CardHeader, Button, Input, Badge, Table, Alert, Spinner, EmptyState, Icon } from '../components/ui';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function S3Manager({ apiBase }) {
  const { authFetch } = useAuth();
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBucket, setNewBucket] = useState('');
  const [selected, setSelected] = useState(null);
  const [objects, setObjects] = useState([]);
  const [objLoading, setObjLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const loadBuckets = () => {
    setLoading(true);
    authFetch(`${apiBase}/api/s3/buckets`).then(r => r.ok ? r.json() : []).then(b => { setBuckets(b); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { loadBuckets(); }, [apiBase]);

  const loadObjects = (bucket) => {
    setObjLoading(true);
    authFetch(`${apiBase}/api/s3/buckets/${bucket}/objects`).then(r => r.json()).then(o => { setObjects(o); setObjLoading(false); }).catch(() => setObjLoading(false));
  };

  const selectBucket = (name) => { setSelected(name); loadObjects(name); };

  const createBucket = async () => {
    if (!newBucket.trim()) return;
    await authFetch(`${apiBase}/api/s3/buckets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newBucket }) });
    setAlert({ type: 'success', msg: `Bucket "${newBucket}" created` });
    setNewBucket('');
    loadBuckets();
  };

  const deleteBucket = async (name) => {
    if (!window.confirm(`Delete bucket "${name}"? It must be empty.`)) return;
    await authFetch(`${apiBase}/api/s3/buckets/${name}`, { method: 'DELETE' });
    if (selected === name) { setSelected(null); setObjects([]); }
    setAlert({ type: 'success', msg: `Bucket "${name}" deleted` });
    loadBuckets();
  };

  const upload = async () => {
    const file = fileRef.current?.files[0];
    if (!file || !selected) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    await authFetch(`${apiBase}/api/s3/buckets/${selected}/objects?key=${encodeURIComponent(file.name)}`, { method: 'POST', body: formData });
    setAlert({ type: 'success', msg: `Uploaded "${file.name}"` });
    fileRef.current.value = '';
    setUploading(false);
    loadObjects(selected);
  };

  const deleteObject = async (key) => {
    if (!window.confirm(`Delete "${key}"?`)) return;
    await authFetch(`${apiBase}/api/s3/buckets/${selected}/objects/${encodeURIComponent(key)}`, { method: 'DELETE' });
    setAlert({ type: 'success', msg: `Deleted "${key}"` });
    loadObjects(selected);
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="S3 Storage" description="Manage buckets and files in LocalStack S3" />
      {alert && <Alert variant={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader title="Buckets" subtitle={`${buckets.length} bucket${buckets.length !== 1 ? 's' : ''}`} />
            <div className="p-4 border-b border-slate-100">
              <div className="flex gap-2">
                <Input placeholder="New bucket name" value={newBucket} onChange={e => setNewBucket(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createBucket()} />
                <Button size="sm" onClick={createBucket} className="flex-shrink-0"><Icon name="plus" className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            {loading ? <Spinner size="sm" /> : buckets.length === 0 ? (
              <EmptyState icon="folder" title="No buckets" description="Create your first bucket above" />
            ) : (
              <div className="divide-y divide-slate-50">
                {buckets.map(b => (
                  <div key={b.name} onClick={() => selectBucket(b.name)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      selected === b.name ? 'bg-slate-50 border-l-2 border-slate-900' : 'hover:bg-slate-50/50 border-l-2 border-transparent'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon name="folder" className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-900 truncate">{b.name}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteBucket(b.name); }} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-3">
          {selected ? (
            <Card>
              <CardHeader title={selected} subtitle={`${objects.length} object${objects.length !== 1 ? 's' : ''}`}
                action={
                  <div className="flex items-center gap-2">
                    <input type="file" ref={fileRef} className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer file:transition-colors" />
                    <Button size="sm" onClick={upload} loading={uploading}><Icon name="upload" className="w-3.5 h-3.5" /> Upload</Button>
                  </div>
                } />
              {objLoading ? <Spinner size="sm" /> : objects.length === 0 ? (
                <EmptyState icon="folder" title="Bucket is empty" description="Upload a file to get started" />
              ) : (
                <Table headers={['Key', 'Size', 'Modified', '']}>
                  {objects.map(obj => (
                    <tr key={obj.key} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Icon name="document" className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-mono text-slate-900">{obj.key}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatSize(obj.size)}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{new Date(obj.lastModified).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a href={`${apiBase}/api/s3/buckets/${selected}/objects/${encodeURIComponent(obj.key)}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                            <Icon name="download" className="w-3 h-3" /> Download
                          </a>
                          <button onClick={() => deleteObject(obj.key)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <Icon name="trash" className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[300px]">
              <EmptyState icon="folder" title="Select a bucket" description="Choose a bucket from the left to browse and manage files" />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
