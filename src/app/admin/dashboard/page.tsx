"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteData } from "@/types";

const TABS = ["About", "Categories", "Services", "Links"] as const;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("About");
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loginPw, setLoginPw] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/data");
    const json = await res.json();
    setData(json as SiteData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleLogin() {
    setLoginErr("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: loginPw }),
    });
    if (res.ok) {
      setIsAuthed(true);
    } else {
      setLoginErr("密码错误");
    }
  }

  async function save(patch: object) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        setMsg({ type: "ok", text: "Saved!" });
        await fetchData();
      } else {
        const err = await res.text();
        setMsg({ type: "err", text: `Save failed: ${err}` });
      }
    } catch {
      setMsg({ type: "err", text: "Network error" });
    }
    setSaving(false);
  }

  function saveWithType(type: string) {
    return (patch: object) => save({ type, ...patch });
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 w-full max-w-xs text-center">
          <h1 className="font-sans text-fg text-lg mb-6">Admin Login</h1>
          <input
            type="password"
            value={loginPw}
            onChange={(e) => setLoginPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter password"
            className="w-full px-4 py-2 mb-4 bg-neutral-800 border border-neutral-700 text-fg font-sans text-sm rounded focus:outline-none focus:border-accent"
          />
          {loginErr && <p className="text-red-400 font-sans text-xs mb-4">{loginErr}</p>}
          <button
            onClick={handleLogin}
            className="w-full px-6 py-2 bg-accent text-bg font-sans text-sm rounded hover:opacity-90"
          >
            Login
          </button>
          <p className="font-sans text-xs text-neutral-600 mt-6">
            Default: lumos2024
          </p>
        </div>
      </div>
    );
  }

  if (loading || !data) return <div className="font-sans text-muted p-8">Loading...</div>;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-sans text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "text-accent border-accent"
                : "text-muted border-transparent hover:text-fg"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2 font-sans text-sm ${
          msg.type === "ok" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
        }`}>
          {msg.text}
        </div>
      )}

      {activeTab === "About" && (
        <AboutEditor about={data.about} save={saveWithType("about")} saving={saving} />
      )}
      {activeTab === "Categories" && (
        <CategoriesEditor categories={data.categories} save={saveWithType("category")} saving={saving} />
      )}
      {activeTab === "Services" && (
        <ServicesEditor services={data.services} save={saveWithType("service")} saving={saving} />
      )}
      {activeTab === "Links" && (
        <LinksEditor links={data.links} save={saveWithType("link")} saving={saving} />
      )}
    </div>
  );
}

// ─── About Editor ───────────────────────────────────────────────
function AboutEditor({
  about, save, saving
}: { about: SiteData["about"]; save: (p: object) => void; saving: boolean }) {
  const [f, setF] = useState(about);

  // Map display keys to snake_case API field names
  const fieldMap: Record<string, string> = {
    nameZh: "name_zh", nameEn: "name_en",
    titleZh: "title_zh", titleEn: "title_en",
    quoteZh: "quote_zh", quoteEn: "quote_en",
    bioZh: "bio_zh", bioEn: "bio_en",
    educationZh: "education_zh", educationEn: "education_en",
    photo: "photo",
  };

  function field(k: string) {
    return {
      value: f[fieldMap[k] ?? k] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setF({ ...f, [fieldMap[k] ?? k]: e.target.value }),
    };
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="font-sans text-xs text-muted mb-4">Edit site-wide About info. Bilingual fields share the same form.</p>
      {(["nameZh", "nameEn", "titleZh", "titleEn", "quoteZh", "quoteEn",
         "bioZh", "bioEn", "educationZh", "educationEn", "photo"] as const).map((k) => (
        <div key={k}>
          <label className="block font-sans text-xs text-muted mb-1">{k}</label>
          {k === "bioZh" || k === "bioEn" ? (
            <textarea {...field(k)} rows={4}
              className="w-full px-3 py-2 bg-bg border border-border text-fg font-sans text-sm focus:outline-none focus:border-accent resize-y" />
          ) : (
            <input {...field(k)}
              className="w-full px-3 py-2 bg-bg border border-border text-fg font-sans text-sm focus:outline-none focus:border-accent" />
          )}
        </div>
      ))}
      <button onClick={() => save({ ...f, id: "about" })} disabled={saving}
        className="px-6 py-2 bg-accent text-bg font-sans text-sm hover:opacity-90 disabled:opacity-50">
        {saving ? "Saving..." : "Save About"}
      </button>
    </div>
  );
}

// ─── Categories Editor ─────────────────────────────────────────
function CategoriesEditor({
  categories, save, saving
}: { categories: SiteData["categories"]; save: (p: object) => void; saving: boolean }) {
  const [cats, setCats] = useState(categories);

  function updCat(id: string, patch: Partial<typeof cats[0]>) {
    setCats(cats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCat() {
    setCats([...cats, { id: `new-${Date.now()}`, key: "", nameEn: "", nameZh: "", sortOrder: cats.length, projects: [] }]);
  }

  return (
    <div className="space-y-8">
      {cats.map((cat) => (
        <div key={cat.id} className="p-4 border border-border space-y-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <span className="font-display text-fg">Category</span>
            <button onClick={() => setCats(cats.filter((c) => c.id !== cat.id))}
              className="font-sans text-xs text-muted hover:text-red-400">Remove</button>
          </div>
          {(["key", "nameEn", "nameZh"] as const).map((k) => (
            <div key={k}>
              <label className="block font-sans text-xs text-muted mb-1">{k}</label>
              <input value={cat[k] as string} onChange={(e) => updCat(cat.id, { [k]: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border text-fg font-sans text-sm focus:outline-none focus:border-accent" />
            </div>
          ))}
          <label className="block">
            <span className="font-sans text-xs text-muted">sortOrder</span>
            <input type="number" value={cat.sortOrder}
              onChange={(e) => updCat(cat.id, { sortOrder: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-bg border border-border text-fg font-sans text-sm focus:outline-none focus:border-accent mt-1" />
          </label>
          <button onClick={() => save({ id: cat.id, key: cat.key, nameEn: cat.name_en, nameZh: cat.name_zh, sortOrder: cat.sort_order })}
            disabled={saving}
            className="px-4 py-1.5 bg-accent text-bg font-sans text-xs hover:opacity-90 disabled:opacity-50">
            Save Category
          </button>
        </div>
      ))}
      <button onClick={addCat}
        className="px-4 py-2 border border-border text-muted font-sans text-sm hover:border-accent hover:text-fg transition-colors">
        + Add Category
      </button>
    </div>
  );
}

// ─── Services Editor ────────────────────────────────────────────
function ServicesEditor({
  services, save, saving
}: { services: SiteData["services"]; save: (p: object) => void; saving: boolean }) {
  const [svcs, setSvcs] = useState(services);

  function upd(id: string, patch: Partial<typeof svcs[0]>) {
    setSvcs(svcs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function add() {
    setSvcs([...svcs, { id: `s-${Date.now()}`, titleEn: "", titleZh: "", descEn: "", descZh: "", sortOrder: svcs.length }]);
  }

  return (
    <div className="space-y-8">
      {svcs.map((s) => (
        <div key={s.id} className="p-4 border border-border space-y-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <span className="font-display text-fg">Service</span>
            <button onClick={() => setSvcs(svcs.filter((x) => x.id !== s.id))}
              className="font-sans text-xs text-muted hover:text-red-400">Remove</button>
          </div>
          {(["titleEn", "titleZh", "descEn", "descZh"] as const).map((k) => (
            <div key={k}>
              <label className="block font-sans text-xs text-muted mb-1">{k}</label>
              <textarea value={s[k] as string} rows={2}
                onChange={(e) => upd(s.id, { [k]: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border text-fg font-sans text-sm focus:outline-none focus:border-accent resize-y" />
            </div>
          ))}
          <button onClick={() => save({ id: s.id, titleEn: s.titleEn, titleZh: s.titleZh, descEn: s.descEn, descZh: s.descZh, sortOrder: s.sortOrder })}
            disabled={saving}
            className="px-4 py-1.5 bg-accent text-bg font-sans text-xs hover:opacity-90 disabled:opacity-50">
            Save
          </button>
        </div>
      ))}
      <button onClick={add}
        className="px-4 py-2 border border-border text-muted font-sans text-sm hover:border-accent hover:text-fg transition-colors">
        + Add Service
      </button>
    </div>
  );
}

// ─── Links Editor ───────────────────────────────────────────────
function LinksEditor({
  links, save, saving
}: { links: SiteData["links"]; save: (p: object) => void; saving: boolean }) {
  const [lnks, setLnks] = useState(links);

  function upd(i: number, patch: Partial<typeof lnks[0]>) {
    setLnks(lnks.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function add() {
    setLnks([...lnks, { platform: "linkedin", url: "" }]);
  }

  return (
    <div className="space-y-8">
      {lnks.map((l, i) => (
        <div key={i} className="p-4 border border-border space-y-3 max-w-2xl">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-sans text-xs text-muted mb-1">platform</label>
              <input value={l.platform}
                onChange={(e) => upd(i, { platform: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border text-fg font-sans text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="flex-1">
              <label className="block font-sans text-xs text-muted mb-1">url</label>
              <input value={l.url}
                onChange={(e) => upd(i, { url: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border text-fg font-sans text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save({ id: `l-${i}`, platform: l.platform, url: l.url, sortOrder: i })}
              disabled={saving}
              className="px-4 py-1.5 bg-accent text-bg font-sans text-xs hover:opacity-90 disabled:opacity-50">
              Save
            </button>
            <button onClick={() => setLnks(lnks.filter((_, idx) => idx !== i))}
              className="px-4 py-1.5 border border-border text-muted font-sans text-xs hover:text-red-400">
              Remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="px-4 py-2 border border-border text-muted font-sans text-sm hover:border-accent hover:text-fg transition-colors">
        + Add Link
      </button>
    </div>
  );
}
