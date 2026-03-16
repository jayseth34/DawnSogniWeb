import { useEffect, useMemo, useState } from "react";
import { api, type DropDesign } from "../../api";
import { uploadToImageKit } from "../../imagekitUpload";
import { formatRupees } from "../money";

function parseCsv(csv: string) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AdminDropsPage() {
  const [drops, setDrops] = useState<DropDesign[]>([]);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priceCents: 69900,
    category: "Oversized",
    imagesCsv: "",
    isActive: true
  });

  const imageUrls = useMemo(() => parseCsv(form.imagesCsv), [form.imagesCsv]);

  async function load() {
    setStatus("");
    const list = await api.admin.drops();
    setDrops(list);
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e?.message ?? e)));
  }, []);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setStatus("");
    setUploading(true);
    try {
      const auth = await api.imagekit.adminAuth();
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const r = await uploadToImageKit({
          file: f,
          folder: "/dawn-sogni/drops",
          publicKey: auth.publicKey,
          auth: async () => auth
        });
        urls.push(r.url);
      }
      const next = [...imageUrls, ...urls].join(", ");
      setForm((prev) => ({ ...prev, imagesCsv: next }));
    } catch (e: any) {
      setStatus(`Upload failed: ${String(e?.message ?? e)}`);
    } finally {
      setUploading(false);
    }
  }

  async function create() {
    if (!form.title.trim()) return;
    setStatus("");
    setSaving(true);
    try {
      await api.admin.createDrop({
        title: form.title.trim(),
        description: form.description.trim() ? form.description.trim() : undefined,
        priceCents: Number(form.priceCents),
        category: form.category.trim() || undefined,
        images: imageUrls,
        isActive: form.isActive
      });
      setForm({ ...form, title: "", description: "", imagesCsv: "" });
      await load();
    } catch (e: any) {
      setStatus(`Save failed: ${String(e?.message ?? e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(d: DropDesign) {
    setStatus("");
    await api.admin.updateDrop(d.id, { ...d, isActive: !d.isActive });
    await load();
  }

  async function removeDrop(d: DropDesign) {
    setStatus("");
    await api.admin.deleteDrop(d.id);
    await load();
  }

  return (
    <div>
      <div className="adminPageTitle">
        <div>
          <div className="h2">Products (Drops)</div>
          <div className="muted">Create, activate/deactivate, and manage your product drops.</div>
        </div>
      </div>

      <div className="hr" />

      <div className="card">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Add new product</div>
          <div style={{ height: 10 }} />

          <div className="row">
            <div style={{ flex: 2, minWidth: 240 }}>
              <div className="label">Title</div>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={{ width: 180, minWidth: 180 }}>
              <div className="label">Price (₹)</div>
              <input
                className="input"
                type="number"
                value={Math.round(Number(form.priceCents) / 100)}
                onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) * 100 })}
              />
            </div>
            <div style={{ width: 220, minWidth: 220 }}>
              <div className="label">Category</div>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>

          <div className="label">Description</div>
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div className="label">Upload images</div>
              <input className="input" type="file" multiple disabled={uploading || saving} onChange={(e) => upload(e.currentTarget.files)} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <button className={form.isActive ? "btn primary" : "btn"} onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                {form.isActive ? "Active" : "Inactive"}
              </button>
              <button className="btn primary" onClick={create} disabled={!form.title.trim() || uploading || saving}>
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>

          <div className="label">Image URLs (comma-separated)</div>
          <input className="input" value={form.imagesCsv} onChange={(e) => setForm({ ...form, imagesCsv: e.target.value })} />

          {imageUrls.length > 0 && (
            <div className="row" style={{ marginTop: 12, gap: 10 }}>
              {imageUrls.slice(0, 6).map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  <img className="adminThumbSm" src={u} alt="" />
                </a>
              ))}
              {imageUrls.length > 6 && <span className="muted2">+{imageUrls.length - 6} more</span>}
            </div>
          )}

          {status && <div className="muted" style={{ marginTop: 12 }}>{status}</div>}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="adminList">
        {drops.map((d) => (
          <div className="adminItem" key={d.id}>
            <div className="adminItemInner">
              {d.images?.[0] ? <img className="adminThumb" src={d.images[0]} alt={d.title} /> : <div className="adminThumb" />}

              <div className="adminMeta">
                <div className="adminMetaTitle clamp2" title={d.title}>
                  {d.title}
                </div>
                <div className="adminMetaSub">
                  {formatRupees(d.priceCents)} · {d.category || "—"} · {d.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => toggleActive(d)}>
                  {d.isActive ? "Deactivate" : "Activate"}
                </button>
                <button className="btn danger" onClick={() => removeDrop(d)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {drops.length === 0 && <div className="muted">No products yet.</div>}
      </div>
    </div>
  );
}
