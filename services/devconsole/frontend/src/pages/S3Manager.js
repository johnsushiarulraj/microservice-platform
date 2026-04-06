import React, { useState, useEffect, useRef } from 'react';

export default function S3Manager({ apiBase }) {
  const [buckets, setBuckets] = useState([]);
  const [newBucket, setNewBucket] = useState('');
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [objects, setObjects] = useState([]);
  const [status, setStatus] = useState('');
  const fileRef = useRef();

  const loadBuckets = () => {
    fetch(`${apiBase}/api/s3/buckets`).then(r => r.json()).then(setBuckets).catch(() => {});
  };

  useEffect(() => { loadBuckets(); }, [apiBase]);

  const loadObjects = (bucket) => {
    fetch(`${apiBase}/api/s3/buckets/${bucket}/objects`)
      .then(r => r.json()).then(setObjects).catch(() => setObjects([]));
  };

  const selectBucket = (name) => {
    setSelectedBucket(name);
    loadObjects(name);
  };

  const createBucket = async () => {
    if (!newBucket) return;
    await fetch(`${apiBase}/api/s3/buckets`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBucket }),
    });
    setNewBucket('');
    setStatus(`Bucket "${newBucket}" created`);
    loadBuckets();
  };

  const deleteBucket = async (name) => {
    if (!window.confirm(`Delete bucket "${name}"?`)) return;
    await fetch(`${apiBase}/api/s3/buckets/${name}`, { method: 'DELETE' });
    setStatus(`Bucket "${name}" deleted`);
    if (selectedBucket === name) { setSelectedBucket(null); setObjects([]); }
    loadBuckets();
  };

  const uploadFile = async () => {
    const file = fileRef.current?.files[0];
    if (!file || !selectedBucket) return;
    const formData = new FormData();
    formData.append('file', file);
    await fetch(`${apiBase}/api/s3/buckets/${selectedBucket}/objects?key=${encodeURIComponent(file.name)}`, {
      method: 'POST', body: formData,
    });
    setStatus(`Uploaded "${file.name}"`);
    fileRef.current.value = '';
    loadObjects(selectedBucket);
  };

  const deleteObject = async (key) => {
    if (!window.confirm(`Delete "${key}"?`)) return;
    await fetch(`${apiBase}/api/s3/buckets/${selectedBucket}/objects/${encodeURIComponent(key)}`, { method: 'DELETE' });
    setStatus(`Deleted "${key}"`);
    loadObjects(selectedBucket);
  };

  const downloadObject = (key) => {
    window.open(`${apiBase}/api/s3/buckets/${selectedBucket}/objects/${encodeURIComponent(key)}`);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">S3 Manager</h2>

      {status && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">{status}</div>}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Bucket List */}
        <div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Buckets</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Bucket name" value={newBucket}
                onChange={e => setNewBucket(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm flex-1"
                onKeyDown={e => e.key === 'Enter' && createBucket()} />
              <button onClick={createBucket} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">Create</button>
            </div>
            <div className="space-y-1">
              {buckets.map(b => (
                <div key={b.name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${selectedBucket === b.name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  onClick={() => selectBucket(b.name)}>
                  <div className="font-medium">{b.name}</div>
                  <button onClick={(e) => { e.stopPropagation(); deleteBucket(b.name); }}
                    className="text-red-500 text-xs hover:underline">Delete</button>
                </div>
              ))}
              {buckets.length === 0 && <div className="text-sm text-gray-400">No buckets</div>}
            </div>
          </div>
        </div>

        {/* Right: File Browser */}
        <div className="col-span-2">
          {selectedBucket ? (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{selectedBucket}</h3>
                <div className="flex gap-2">
                  <input type="file" ref={fileRef} className="text-sm" />
                  <button onClick={uploadFile}
                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Upload</button>
                </div>
              </div>

              {objects.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Key</th>
                      <th className="text-left px-3 py-2">Size</th>
                      <th className="text-left px-3 py-2">Modified</th>
                      <th className="text-left px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objects.map(obj => (
                      <tr key={obj.key} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs">{obj.key}</td>
                        <td className="px-3 py-2 text-gray-500">{formatSize(obj.size)}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{obj.lastModified}</td>
                        <td className="px-3 py-2 space-x-2">
                          <button onClick={() => downloadObject(obj.key)}
                            className="text-blue-600 text-xs hover:underline">Download</button>
                          <button onClick={() => deleteObject(obj.key)}
                            className="text-red-600 text-xs hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">Bucket is empty</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 mt-10 text-center">Select a bucket to browse files</div>
          )}
        </div>
      </div>
    </div>
  );
}
