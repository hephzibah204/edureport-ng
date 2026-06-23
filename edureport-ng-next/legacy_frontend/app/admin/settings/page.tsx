"use client";

import React, { useState, useEffect } from 'react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json() as any;
      setSettings(data.settings || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Settings saved successfully');
      else alert('Failed to save settings');
    } catch (err) {
      console.error(err);
    }
  };

  const updateKey = (k: string, v: string) => {
    setSettings(prev => ({ ...prev, [k]: v }));
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading settings...</div>;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          System Settings
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Platform configuration</small>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}>💾 Save Settings</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.4rem]">
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">💰 Pricing Configuration</div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Starter Plan Price (₦)</label>
            <input 
              type="number" 
              value={settings['price_starter'] || '15000'} 
              onChange={e => updateKey('price_starter', e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
            />
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Lifetime Plan Price (₦)</label>
            <input 
              type="number" 
              value={settings['price_lifetime'] || '25000'} 
              onChange={e => updateKey('price_lifetime', e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
            />
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Pro Plan Price (₦)</label>
            <input 
              type="number" 
              value={settings['price_pro'] || '35000'} 
              onChange={e => updateKey('price_pro', e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
            />
          </div>
        </div>
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">📬 Contact & Support</div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">WhatsApp Number</label>
            <input 
              type="text" 
              value={settings['support_whatsapp'] || '08037000456'} 
              onChange={e => updateKey('support_whatsapp', e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
            />
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Support Email</label>
            <input 
              type="text" 
              value={settings['support_email'] || 'abbeydmarketer@gmail.com'} 
              onChange={e => updateKey('support_email', e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
            />
          </div>
        </div>
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="font-bold text-[1rem] mb-[1.2rem]">🤖 AI Provider Keys</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            <div className="m-0">
              <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">OpenAI Key</label>
              <input 
                type="password" 
                placeholder="sk-..." 
                value={settings['key_openai'] || ''}
                onChange={e => updateKey('key_openai', e.target.value)}
                className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
              />
            </div>
            <div className="m-0">
              <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Anthropic Key</label>
              <input 
                type="password" 
                placeholder="sk-ant-..." 
                value={settings['key_anthropic'] || ''}
                onChange={e => updateKey('key_anthropic', e.target.value)}
                className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
              />
            </div>
            <div className="m-0">
              <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Gemini API Key</label>
              <input 
                type="password" 
                placeholder="AIza..." 
                value={settings['key_gemini'] || ''}
                onChange={e => updateKey('key_gemini', e.target.value)}
                className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
