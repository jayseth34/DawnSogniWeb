import { useEffect, useState } from "react";
import { api, type DropDesign } from "../../api";
import { uploadToImageKit } from "../../imagekitUpload";

function rupees(cents: number) {
  return `₹${Math.round(cents / 100)}`;
}

export function AdminDropsPage() {
  const [drops, setDrops] = useState<DropDesign[]>([]);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priceCents: 69900,
    category: "oversized",
    imagesCsv: "",
    isActive: true
  });

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
      const existing = form.imagesCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const next = [...existing, ...urls].join(", ");
      setForm({ ...form, imagesCsv: next });
    } catch (e: any) {
      setStatus(`Upload failed: ${String(e?.message ?? e)}`);
    } finally {
      setUploading(false);
    }
  }

  async function create() {
    setStatus("");
    try {
      await api.admin.createDrop({
        title: form.title,
        description: form.description || undefined,
        priceCents: Number(form.priceCents),
        category: form.category,
        images: form.imagesCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: form.isActive
      });
      setForm({ ...form, title: "", description: "", imagesCsv: "" });
      await load();
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    }
  }

  async function toggleActive(d: DropDesign) {
    await api.admin.updateDrop(d.id, { ...d, isActive: !d.isActive });
    await load();
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="h2">Drops (admin)</div>
      <div className="muted">Add your personal drops here. Upload images via ImageKit (or paste URLs).</div>
      <div className="hr" />

      <div className="card">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Create new drop</div>
          <div className="row">
            <div style={{ flex: 2 }}>
              <div className="label">Title</div>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={{ width: 180 }}>
              <div className="label">Price (₹)</div>
              <input
                className="input"
                type="number"
                value={Math.round(Number(form.priceCents) / 100)}
                onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) * 100 })}
              />
            </div>
            <div style={{ width: 180 }}>
              <div className="label">Category</div>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div className="label">Description</div>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="label">Upload images (ImageKit)</div>
          <input className="input" type="file" multiple disabled={uploading} onChange={(e) => upload(e.currentTarget.files)} />

          <div className="label">Image URLs (comma-separated)</div>
          <input className="input" value={form.imagesCsv} onChange={(e) => setForm({ ...form, imagesCsv: e.target.value })} />
          <div style={{ height: 12 }} />
          <button className="btn primary" onClick={create} disabled={!form.title || uploading}>
            Create drop
          </button>
        </div>
      </div>

      <div style={{ height: 14 }} />
      {status && <div className="muted">{status}</div>}
      <div className="grid cards">
        {drops.map((d) => (
          <div className="card" key={d.id}>
            {d.images?.[0] ? <img className="img" src={d.images[0]} alt={d.title} /> : <div className="img" />}
            <div className="p">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800 }}>{d.title}</div>
                <div className="tag">{rupees(d.priceCents)}</div>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                Active: {String(d.isActive)}
              </div>
              <div style={{ height: 12 }} />
              <div className="row">
                <button className="btn" onClick={() => toggleActive(d)}>
                  Toggle active
                </button>
                <button
                  className="btn danger"
                  onClick={async () => {
                    await api.admin.deleteDrop(d.id);
                    await load();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {drops.length === 0 && <div className="muted">No drops yet.</div>}
    </div>
  );
}
