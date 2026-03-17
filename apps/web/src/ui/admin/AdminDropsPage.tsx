import { useEffect, useMemo, useState } from "react";
import { api, type DropDesign } from "../../api";
import { uploadToImageKit } from "../../imagekitUpload";
import { formatRupees } from "../money";

const CATEGORY_OPTIONS = ["Oversized", "Round Neck", "Collar", "Tee", "Shirt", "Other"] as const;
type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

function parseCsv(csv: string) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function removeAt<T>(arr: T[], idx: number) {
  return arr.filter((_, i) => i !== idx);
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
    categoryOption: "Oversized" as CategoryOption,
    categoryOther: "",
    imagesCsv: "",
    isActive: true
  });

  const imageUrls = useMemo(() => parseCsv(form.imagesCsv), [form.imagesCsv]);
  const categoryValue = form.categoryOption === "Other" ? form.categoryOther.trim() : form.categoryOption;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ images: string[]; category: string; description: string } | null>(null);

  async function load() {
    setStatus("");
    const list = await api.admin.drops();
    setDrops(list);
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e?.message ?? e)));
  }, []);

  async function upload(files: FileList | null, target: "create" | "edit") {
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

      if (target === "create") {
        const next = [...imageUrls, ...urls].join(", ");
        setForm((prev) => ({ ...prev, imagesCsv: next }));
      } else {
        setEditDraft((prev) => ({
          images: [...(prev?.images ?? []), ...urls],
          category: prev?.category ?? "",
          description: prev?.description ?? ""
        }));
      }
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
        category: categoryValue || undefined,
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

  function startEdit(d: DropDesign) {
    setEditingId(d.id);
    setEditDraft({
      images: Array.isArray(d.images) ? d.images : [],
      category: d.category ?? "",
      description: d.description ?? ""
    });
  }

  async function saveEdit(d: DropDesign) {
    if (!editDraft) return;
    setStatus("");
    setSaving(true);
    try {
      await api.admin.updateDrop(d.id, {
        ...d,
        images: editDraft.images,
        category: editDraft.category || undefined,
        description: editDraft.description || undefined
      });
      setEditingId(null);
      setEditDraft(null);
      await load();
    } catch (e: any) {
      setStatus(`Update failed: ${String(e?.message ?? e)}`);
    } finally {
      setSaving(false);
    }
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
              <div className="label">Price (INR)</div>
              <input
                className="input"
                type="number"
                value={Math.round(Number(form.priceCents) / 100)}
                onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) * 100 })}
              />
            </div>
            <div style={{ width: 260, minWidth: 260 }}>
              <div className="label">Category</div>
              <select
                className="input"
                value={form.categoryOption}
                onChange={(e) => setForm({ ...form, categoryOption: e.target.value as CategoryOption })}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {form.categoryOption === "Other" && (
                <input
                  className="input"
                  style={{ marginTop: 10 }}
                  value={form.categoryOther}
                  onChange={(e) => setForm({ ...form, categoryOther: e.target.value })}
                  placeholder="Custom category"
                />
              )}
            </div>
          </div>

          <div className="label">Description</div>
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div className="label">Upload images</div>
              <input className="input" type="file" multiple disabled={uploading || saving} onChange={(e) => upload(e.currentTarget.files, "create")} />
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

          {imageUrls.length > 0 && (
            <div className="row" style={{ marginTop: 12, gap: 10, alignItems: "flex-end" }}>
              {imageUrls.map((u, idx) => (
                <div key={u} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                  <a href={u} target="_blank" rel="noreferrer">
                    <img className="adminThumbSm" src={u} alt="" />
                  </a>
                  <button
                    className="btn danger"
                    style={{ padding: "6px 10px", borderRadius: 10 }}
                    disabled={uploading || saving}
                    onClick={() => {
                      const next = removeAt(imageUrls, idx).join(", ");
                      setForm((prev) => ({ ...prev, imagesCsv: next }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {status && (
            <div className="muted" style={{ marginTop: 12 }}>
              {status}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="adminList">
        {drops.map((d) => {
          const isEditing = editingId === d.id;
          return (
            <div className="adminItem" key={d.id}>
              <div className="adminItemInner">
                {d.images?.[0] ? <img className="adminThumb" src={d.images[0]} alt={d.title} /> : <div className="adminThumb" />}

                <div className="adminMeta">
                  <div className="adminMetaTitle clamp2" title={d.title}>
                    {d.title}
                  </div>
                  <div className="adminMetaSub">
                    {formatRupees(d.priceCents)} · {d.category || "-"} · {d.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => toggleActive(d)}>
                    {d.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn" onClick={() => (isEditing ? (setEditingId(null), setEditDraft(null)) : startEdit(d))}>
                    {isEditing ? "Close" : "Edit"}
                  </button>
                  <button className="btn danger" onClick={() => removeDrop(d)}>
                    Delete
                  </button>
                </div>
              </div>

              {isEditing && editDraft && (
                <div className="p" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="row" style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div className="label">Category</div>
                      <input className="input" value={editDraft.category} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} />
                    </div>
                    <div style={{ width: 240 }}>
                      <div className="label">Upload more images</div>
                      <input className="input" type="file" multiple disabled={uploading || saving} onChange={(e) => upload(e.currentTarget.files, "edit")} />
                    </div>
                    <button className="btn primary" disabled={saving} onClick={() => saveEdit(d)}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>

                  <div className="label">Description</div>
                  <textarea className="textarea" value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} />

                  <div className="label">Images</div>
                  <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
                    {editDraft.images.map((u, idx) => (
                      <div key={u} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                        <a href={u} target="_blank" rel="noreferrer">
                          <img className="adminThumbSm" src={u} alt="" />
                        </a>
                        <button
                          className="btn danger"
                          style={{ padding: "6px 10px", borderRadius: 10 }}
                          disabled={saving}
                          onClick={() => setEditDraft({ ...editDraft, images: removeAt(editDraft.images, idx) })}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {editDraft.images.length === 0 && <div className="muted2">No images</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {drops.length === 0 && <div className="muted">No products yet.</div>}
      </div>
    </div>
  );
}