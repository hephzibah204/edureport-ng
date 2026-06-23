"use client";

import React, { useState, useEffect } from 'react';

export default function AdminPayments() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTxs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json() as any;
      setTxs(data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTxs();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Payments
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Gateways, webhooks, and transactions</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={loadTxs}>🔄 Refresh</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.4rem] mb-[1.4rem]">
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">🔐 Gateway Keys</div>
          <div className="grid grid-cols-2 gap-[10px] mb-4">
            <div className="m-0">
              <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Gateway</label>
              <select className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green bg-white">
                <option value="PAYSTACK">Paystack</option>
                <option value="FLUTTERWAVE">Flutterwave</option>
                <option value="PAYVESSEL">Payvessel</option>
              </select>
            </div>
            <div className="m-0">
              <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Status</label>
              <select className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green bg-white">
                <option value="LIVE">Live Mode</option>
                <option value="TEST">Test Mode</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Public Key</label>
            <input type="password" value="pk_test_********************************" readOnly className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green bg-panel text-muted" />
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Secret Key</label>
            <input type="password" value="sk_test_********************************" readOnly className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green bg-panel text-muted" />
          </div>
          <button className="btn btn-primary btn-sm mt-[10px]" onClick={() => alert('Key management coming soon')}>Update Keys</button>
        </div>
        
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">🔗 Webhook Setup</div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Webhook URL (Copy to Gateway)</label>
            <div className="flex gap-[10px]">
              <input type="text" value="https://reportsheet.com.ng/api/webhooks/payment" readOnly className="flex-1 py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green bg-panel text-muted" />
              <button className="btn btn-outline shrink-0">Copy</button>
            </div>
          </div>
          <div className="text-[0.8rem] text-muted mt-[10px]">
            Ensure your webhook receives <strong className="font-bold">charge.success</strong> events to automatically provision licenses to schools upon payment.
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border bg-panel flex items-center justify-between">
          <strong className="text-[0.88rem] font-bold text-ink2">Recent Transactions</strong>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[0.85rem]">
            <thead className="bg-panel border-b border-border">
              <tr>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Ref</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">School</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Amount</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Gateway</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Status</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted">Loading transactions...</td></tr>
              ) : txs.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted">No transactions found.</td></tr>
              ) : txs.map(t => (
                <tr key={t.id} className="border-b border-border hover:bg-panel/50 transition-colors">
                  <td className="p-3 font-mono text-[0.75rem]">{t.reference}</td>
                  <td className="p-3 font-bold">{t.schoolName}</td>
                  <td className="p-3">₦{(t.amountKobo / 100).toLocaleString()}</td>
                  <td className="p-3">{t.provider}</td>
                  <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-full font-extrabold text-[0.7rem] ${t.status === 'SUCCESS' ? 'bg-green4 text-green' : 'bg-panel text-muted'}`}>{t.status}</span></td>
                  <td className="p-3">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
