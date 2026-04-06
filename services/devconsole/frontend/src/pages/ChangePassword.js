import React, { useState } from 'react';
import { useAuth } from '../auth';
import { PageHeader, Card, Button, Alert } from '../components/ui';

export default function ChangePassword() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', msg: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setAlert({ type: 'error', msg: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    try {
      // Verify current password by getting a token
      const tokenRes = await fetch('/auth/realms/template/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'microservice-template',
          client_secret: 'template-secret',
          username: user.username,
          password: currentPassword,
        }),
      });
      if (!tokenRes.ok) {
        setAlert({ type: 'error', msg: 'Current password is incorrect' });
        setLoading(false);
        return;
      }

      // Use the Keycloak account API to change password
      const tokenData = await tokenRes.json();
      const res = await fetch('/auth/realms/template/account/credentials/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmation: newPassword,
        }),
      });

      if (res.ok || res.status === 204) {
        setAlert({ type: 'success', msg: 'Password changed successfully. Use your new password next time you sign in.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json().catch(() => ({}));
        setAlert({ type: 'error', msg: err.errorMessage || 'Failed to change password' });
      }
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md">
      <PageHeader title="Change Password" description={`Signed in as ${user?.username}`} />

      {alert && <Alert variant={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
              <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />
            </div>
          </div>
          <div className="mt-6">
            <Button type="submit" loading={loading}>Change Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
