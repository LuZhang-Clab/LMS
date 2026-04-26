"use client";

import { useState, useEffect } from "react";
import { X, Plus, Save, ExternalLink, LogOut, Upload } from "lucide-react";

interface ContentBlock {
  type: "text" | "heading" | "images" | "link";
  text?: string;
  files?: string[];
  url?: string;
}

interface Project {
  id: string;
  title_en: string;
  title_zh: string;
  cover: string;
  image_folder: string;
  link?: string;
  images?: string[];
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
}

interface Category {
  id: string;
  name_en: string;
  name_zh: string;
  projects: Project[];
}

interface WorkExperience {
  id: string;
  title_en: string;
  title_zh: string;
  period: string;
  detail_folder: string;
  content_zh: ContentBlock[];
  content_en: ContentBlock[];
}

interface Service {
  id: string;
  title_en: string;
  title_zh: string;
  desc_en: string;
  desc_zh: string;
  sort_order: number;
}

interface SiteData {
  site: { title_en: string; title_zh: string; subtitle_en: string; subtitle_zh: string };
  about: { name_en: string; name_zh: string; title_en: string; title_zh: string; bio_en: string; bio_zh: string; quote_en: string; quote_zh: string; education_en: string; education_zh: string; photo: string };
  links: { id?: string; platform: string; url: string; sort_order?: number }[];
  workExperience: WorkExperience[];
  services: Service[];
  categories: Category[];
}

type Tab = "projects" | "about" | "work" | "services" | "site";


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      showToast("获取数据失败", "error");
    }
  };

  const showToast = (message: string, type: "success" | "info" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        fetchData();
      } else {
        setLoginError("密码错误，请重试");
        setPassword("");
      }
    } catch {
      setLoginError("登录失败，请重试");
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setData(null);
    setPassword("");
    await fetch("/api/admin", { method: "DELETE" });
  };

  const saveData = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setLastSaved(new Date().toLocaleTimeString());
        showToast("已保存，前台已自动更新", "success");
      } else {
        showToast("保存失败", "error");
      }
    } catch {
      showToast("保存失败", "error");
    }
    setSaving(false);
  };

  const uploadImage = async (file: File, folder: string = "uploads", projectId?: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    if (projectId) formData.append("projectId", projectId);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        return url;
      }
    } catch {}
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 w-full max-w-sm text-center">
          <h1 className="text-amber-500/90 text-lg tracking-widest mb-2 font-light">LUMOS CREATIVE</h1>
          <p className="text-neutral-500 text-sm mb-6">后台管理 · 请输入管理员密码</p>
          <div className="text-red-500 text-sm mb-4 min-h-5">{loginError}</div>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="管理员密码"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 text-center tracking-widest focus:outline-none focus:border-amber-500/50 mb-4"
            autoFocus
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-amber-500/90 hover:bg-amber-500 text-black font-medium tracking-wider rounded transition-colors"
          >
            进入后台
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
      <header className="bg-neutral-900 border-b border-neutral-800 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-amber-500/90 text-sm tracking-widest font-light">LUMOS CREATIVE 后台</h1>
        <div className="flex items-center gap-6">
          <a href="/" target="_blank" className="text-neutral-500 hover:text-amber-500/80 text-sm flex items-center gap-1 transition-colors">
            <ExternalLink size={14} /> 预览网站
          </a>
          <button onClick={handleLogout} className="text-red-400/70 hover:text-red-400 text-sm flex items-center gap-1 transition-colors">
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex gap-0 mb-8 border-b border-neutral-800 overflow-x-auto">
          {(["projects", "about", "work", "services", "site"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs tracking-wider whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? "text-amber-500/90 border-amber-500/90"
                  : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              {tab === "projects" && "项目管理"}
              {tab === "about" && "关于页面"}
              {tab === "work" && "工作经历"}
              {tab === "services" && "专业领域"}
              {tab === "site" && "站点设置"}
            </button>
          ))}
        </div>

        {activeTab === "projects" && <ProjectsTab data={data} setData={setData} showToast={showToast} uploadImage={uploadImage} />}
        {activeTab === "about" && <AboutTab data={data} setData={setData} showToast={showToast} uploadImage={uploadImage} />}
        {activeTab === "work" && <WorkTab data={data} setData={setData} />}
        {activeTab === "services" && <ServicesTab data={data} setData={setData} />}
        {activeTab === "site" && <SiteTab data={data} setData={setData} />}

        <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-end">
          <button
            onClick={saveData}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/90 hover:bg-amber-500 text-black font-medium text-sm tracking-wider rounded transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "保存中..." : "保存并发布"}
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 px-8 py-2 text-xs text-neutral-600 flex justify-between z-50">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          后台保存后，前台自动刷新，无需额外操作
        </span>
        <span>上次保存: {lastSaved || "—"}</span>
      </div>

      {toast && (
        <div className={`fixed bottom-12 right-8 px-5 py-2.5 rounded text-sm z-50 ${
          toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-red-500" : "bg-blue-500"
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Projects Tab
function ProjectsTab({ data, setData, showToast, uploadImage }: {
  data: SiteData;
  setData: React.Dispatch<React.SetStateAction<SiteData | null>>;
  showToast: (msg: string, type: "success" | "info" | "error") => void;
  uploadImage: (file: File, folder?: string, projectId?: string) => Promise<string | null>;
}) {
  const addCategory = () => {
    if (!data) return;
    setData({ ...data, categories: [...data.categories, { id: `cat-${Date.now()}`, name_en: "New Category", name_zh: "新分类", projects: [] }] });
  };

  const removeCategory = (ci: number) => {
    if (!data || !confirm("确定删除此分类？")) return;
    setData({ ...data, categories: data.categories.filter((_, i) => i !== ci) });
  };

  const addProject = (ci: number) => {
    if (!data) return;
    const id = `proj-${Date.now()}`;
    const newProject: Project = { id, title_en: "", title_zh: "", cover: "", image_folder: id, link: "", images: [], content_zh: [], content_en: [] };
    const cats = [...data.categories];
    cats[ci] = { ...cats[ci], projects: [...cats[ci].projects, newProject] };
    setData({ ...data, categories: cats });
  };

  const removeProject = (ci: number, pi: number) => {
    if (!data || !confirm("删除此项目？")) return;
    const cats = [...data.categories];
    cats[ci] = { ...cats[ci], projects: cats[ci].projects.filter((_, i) => i !== pi) };
    setData({ ...data, categories: cats });
  };

  const updateCategory = (ci: number, field: "name_en" | "name_zh", value: string) => {
    if (!data) return;
    const cats = [...data.categories];
    cats[ci] = { ...cats[ci], [field]: value };
    setData({ ...data, categories: cats });
  };

  const updateProject = (ci: number, pi: number, field: keyof Project, value: string) => {
    if (!data) return;
    const cats = [...data.categories];
    cats[ci] = { ...cats[ci], projects: cats[ci].projects.map((p, i) => i === pi ? { ...p, [field]: value } : p) };
    setData({ ...data, categories: cats });
  };

  const handleImageUpload = async (ci: number, pi: number, files: FileList | null) => {
    if (!files?.length || !data) return;
    const cats = [...data.categories];
    const proj = cats[ci].projects[pi];
    if (!proj.images) (cats[ci].projects[pi] as Project & { images: string[] }).images = [];
    const folder = proj.image_folder || proj.id;
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, `projects/${folder}`, proj.id);
      if (url) {
        cats[ci].projects[pi].images = [...(cats[ci].projects[pi].images || []), url];
        if (!cats[ci].projects[pi].cover) cats[ci].projects[pi].cover = url;
      }
    }
    setData({ ...data, categories: cats });
    showToast(`已上传 ${files.length} 张${!proj.cover ? "，首张自动设为封面" : ""}`, "success");
  };

  const setCover = (ci: number, pi: number, url: string) => {
    if (!data) return;
    const cats = [...data.categories];
    cats[ci].projects[pi].cover = url;
    setData({ ...data, categories: cats });
    showToast("封面已更新", "info");
  };

  const deleteImage = (ci: number, pi: number, imgIdx: number) => {
    if (!data) return;
    const cats = [...data.categories];
    const imgs = [...(cats[ci].projects[pi].images || [])];
    const removed = imgs.splice(imgIdx, 1)[0];
    cats[ci].projects[pi].images = imgs;
    if (cats[ci].projects[pi].cover === removed) cats[ci].projects[pi].cover = imgs[0] || "";
    setData({ ...data, categories: cats });
  };

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button onClick={addCategory} className="flex items-center gap-2 px-4 py-2 bg-amber-500/90 hover:bg-amber-500 text-black text-sm font-medium rounded transition-colors">
          <Plus size={16} /> 新建分类
        </button>
      </div>

      {data.categories.map((cat, ci) => (
        <div key={cat.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-amber-500/80 text-sm font-normal">{cat.name_zh} / {cat.name_en}</h3>
            <div className="flex gap-2">
              <button onClick={() => addProject(ci)} className="px-3 py-1.5 border border-neutral-700 hover:border-amber-500/50 hover:text-amber-500/80 text-xs rounded transition-colors">+ 添加项目</button>
              <button onClick={() => removeCategory(ci)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400/70 hover:text-red-400 text-xs rounded transition-colors">删除分类</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">分类名 (中文)</label>
              <input type="text" value={cat.name_zh} onChange={(e) => updateCategory(ci, "name_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">分类名 (英文)</label>
              <input type="text" value={cat.name_en} onChange={(e) => updateCategory(ci, "name_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>

          {cat.projects.map((proj, pi) => (
            <div key={proj.id} className="bg-neutral-800/50 border border-neutral-700/50 rounded p-4 mb-3">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  {proj.cover && (
                    <img src={proj.cover} alt="" className="w-10 h-10 rounded object-cover border border-neutral-600" />
                  )}
                  <strong className="text-sm text-neutral-300">{proj.title_zh || proj.title_en || "新项目"}</strong>
                </div>
                <button onClick={() => removeProject(ci, pi)} className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400/70 hover:text-red-400 text-xs rounded transition-colors">删除项目</button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">标题 (中文)</label>
                  <input type="text" value={proj.title_zh} onChange={(e) => updateProject(ci, pi, "title_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">标题 (英文)</label>
                  <input type="text" value={proj.title_en} onChange={(e) => updateProject(ci, pi, "title_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">外部链接 (可选)</label>
                <input type="text" value={proj.link || ""} onChange={(e) => updateProject(ci, pi, "link", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
              </div>

              <div className="mb-3">
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">项目图片 <span className="normal-case text-neutral-600 italic">（点击设为封面，悬浮右上角删除）</span></label>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {(proj.images || []).map((url, idx) => (
                    <div key={idx} className={`relative aspect-square rounded overflow-hidden border-2 cursor-pointer transition-colors ${url === proj.cover ? "border-amber-500" : "border-transparent hover:border-neutral-600"}`} onClick={() => setCover(ci, pi, url)}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {url === proj.cover && <span className="absolute top-1 left-1 bg-amber-500 text-black text-xs px-1 rounded font-bold">封面</span>}
                      <button onClick={(e) => { e.stopPropagation(); deleteImage(ci, pi, idx); }} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-700 hover:border-amber-500/50 rounded p-4 cursor-pointer transition-colors">
                  <Upload size={16} className="text-neutral-500" />
                  <span className="text-xs text-neutral-500">点击或拖拽上传图片</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(ci, pi, e.target.files)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// About Tab
function AboutTab({ data, setData, showToast, uploadImage }: {
  data: SiteData;
  setData: React.Dispatch<React.SetStateAction<SiteData | null>>;
  showToast: (msg: string, type: "success" | "info" | "error") => void;
  uploadImage: (file: File, folder?: string) => Promise<string | null>;
}) {
  const update = (field: string, value: string) => {
    setData({ ...data, about: { ...data.about, [field]: value } });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("上传中...", "info");
    const url = await uploadImage(file);
    if (url) {
      setData({ ...data, about: { ...data.about, photo: url } });
      showToast("照片已更新", "success");
    } else {
      showToast("上传失败", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-amber-500/80 text-sm font-normal mb-4">个人信息</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">姓名 (中文)</label>
            <input type="text" value={data.about.name_zh} onChange={(e) => update("name_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">姓名 (英文)</label>
            <input type="text" value={data.about.name_en} onChange={(e) => update("name_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">头衔 (中文)</label>
            <input type="text" value={data.about.title_zh} onChange={(e) => update("title_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">头衔 (英文)</label>
            <input type="text" value={data.about.title_en} onChange={(e) => update("title_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">个人照片</label>
          <div className="flex gap-4 items-start">
            {data.about.photo && (
              <div className="relative w-24 h-28 rounded overflow-hidden border border-neutral-700">
                <img src={data.about.photo} alt="About" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-neutral-700 hover:border-amber-500/50 rounded p-4 cursor-pointer transition-colors">
              <Upload size={16} className="text-neutral-500" />
              <span className="text-xs text-neutral-500">点击上传新照片</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">引言 (中文)</label>
          <textarea value={data.about.quote_zh} onChange={(e) => update("quote_zh", e.target.value)} rows={3} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">引言 (英文)</label>
          <textarea value={data.about.quote_en} onChange={(e) => update("quote_en", e.target.value)} rows={3} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">简介 (中文)</label>
          <textarea value={data.about.bio_zh} onChange={(e) => update("bio_zh", e.target.value)} rows={5} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">简介 (英文)</label>
          <textarea value={data.about.bio_en} onChange={(e) => update("bio_en", e.target.value)} rows={5} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">教育背景 (中文)</label>
            <textarea value={data.about.education_zh} onChange={(e) => update("education_zh", e.target.value)} rows={2} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">教育背景 (英文)</label>
            <textarea value={data.about.education_en} onChange={(e) => update("education_en", e.target.value)} rows={2} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Work Tab
function WorkTab({ data, setData }: { data: SiteData; setData: React.Dispatch<React.SetStateAction<SiteData | null>> }) {
  const update = (i: number, field: keyof WorkExperience, value: string) => {
    const work = [...data.workExperience];
    work[i] = { ...work[i], [field]: value };
    setData({ ...data, workExperience: work });
  };

  const addWork = () => {
    setData({ ...data, workExperience: [...data.workExperience, { id: `w-${Date.now()}`, title_en: "", title_zh: "", period: "", detail_folder: "", content_zh: [], content_en: [] }] });
  };

  const removeWork = (i: number) => {
    if (!confirm("删除？")) return;
    setData({ ...data, workExperience: data.workExperience.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button onClick={addWork} className="flex items-center gap-2 px-4 py-2 bg-amber-500/90 hover:bg-amber-500 text-black text-sm font-medium rounded transition-colors"><Plus size={16} /> 添加工作经历</button>
      </div>
      {data.workExperience.map((exp, i) => (
        <div key={exp.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <strong className="text-sm text-neutral-300">{exp.title_zh || "新职位"}</strong>
            <button onClick={() => removeWork(i)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400/70 hover:text-red-400 text-xs rounded transition-colors">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">职位 (中文)</label>
              <input type="text" value={exp.title_zh} onChange={(e) => update(i, "title_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">职位 (英文)</label>
              <input type="text" value={exp.title_en} onChange={(e) => update(i, "title_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">时间段</label>
              <input type="text" value={exp.period} onChange={(e) => update(i, "period", e.target.value)} placeholder="2022-2025" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">关联图片文件夹 (可选)</label>
              <input type="text" value={exp.detail_folder} onChange={(e) => update(i, "detail_folder", e.target.value)} placeholder="director" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Services Tab
function ServicesTab({ data, setData }: { data: SiteData; setData: React.Dispatch<React.SetStateAction<SiteData | null>> }) {
  const update = (i: number, field: keyof Service, value: string) => {
    const services = [...data.services];
    services[i] = { ...services[i], [field]: value };
    setData({ ...data, services });
  };

  const addService = () => {
    setData({ ...data, services: [...data.services, { title_en: "", title_zh: "", desc_en: "", desc_zh: "" }] });
  };

  const removeService = (i: number) => {
    if (!confirm("删除？")) return;
    setData({ ...data, services: data.services.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button onClick={addService} className="flex items-center gap-2 px-4 py-2 bg-amber-500/90 hover:bg-amber-500 text-black text-sm font-medium rounded transition-colors"><Plus size={16} /> 添加服务</button>
      </div>
      {data.services.map((svc, i) => (
        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <strong className="text-sm text-neutral-300">{svc.title_zh || "新服务"}</strong>
            <button onClick={() => removeService(i)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400/70 hover:text-red-400 text-xs rounded transition-colors">删除</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">服务名 (中文)</label>
              <input type="text" value={svc.title_zh} onChange={(e) => update(i, "title_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">服务名 (英文)</label>
              <input type="text" value={svc.title_en} onChange={(e) => update(i, "title_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">描述 (中文)</label>
              <textarea value={svc.desc_zh} onChange={(e) => update(i, "desc_zh", e.target.value)} rows={2} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">描述 (英文)</label>
              <textarea value={svc.desc_en} onChange={(e) => update(i, "desc_en", e.target.value)} rows={2} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50 resize-y" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Site Tab
function SiteTab({ data, setData }: { data: SiteData; setData: React.Dispatch<React.SetStateAction<SiteData | null>> }) {
  const updateSite = (field: string, value: string) => {
    setData({ ...data, site: { ...data.site, [field]: value } });
  };

  const linkValue = (platform: string) => {
    const link = data.links.find((l) => l.platform === platform);
    return link?.url ?? "";
  };

  const updateLink = (platform: string, url: string) => {
    const existing = data.links.find((l) => l.platform === platform);
    if (existing) {
      setData({ ...data, links: data.links.map((l) => l.platform === platform ? { ...l, url } : l) });
    } else {
      setData({ ...data, links: [...data.links, { platform, url }] });
    }
  };

  const platforms = [
    { key: "linkedin", label: "LinkedIn" },
    { key: "github", label: "GitHub" },
    { key: "replit", label: "Replit" },
    { key: "xiaohongshu", label: "小红书" },
    { key: "email", label: "Email" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-amber-500/80 text-sm font-normal mb-4">品牌</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">网站标题 (中文)</label>
            <input type="text" value={data.site.title_zh} onChange={(e) => updateSite("title_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">网站标题 (英文)</label>
            <input type="text" value={data.site.title_en} onChange={(e) => updateSite("title_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">副标题 (中文)</label>
            <input type="text" value={data.site.subtitle_zh} onChange={(e) => updateSite("subtitle_zh", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">副标题 (英文)</label>
            <input type="text" value={data.site.subtitle_en} onChange={(e) => updateSite("subtitle_en", e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-amber-500/80 text-sm font-normal mb-4">联系方式</h3>
        <div className="grid grid-cols-2 gap-4">
          {platforms.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type="url" value={linkValue(key)} onChange={(e) => updateLink(key, e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
