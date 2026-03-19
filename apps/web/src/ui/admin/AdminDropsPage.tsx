import { useEffect, useMemo, useState } from "react";
import { api, type DropDesign } from "../../api";
import { uploadToImageKit } from "../../imagekitUpload";
import { formatRupees } from "../money";

const CATEGORY_OPTIONS = ["Oversized", "Round Neck", "Collar", "Tee", "Shirt", "Other"] as const;
type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"] as const;
type SizeOption = (typeof SIZE_OPTIONS)[number];

type EditDraft = {
  images: string[];
  categoryOption: CategoryOption;
  categoryOther: string;
  description: string;
  priceCents: number;
  isActive: boolean;
  availableSizes: SizeOption[];
};

function parseCsv(csv: string) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function removeAt<T>(arr: T[], idx: number) {
  return arr.filter((_, i) => i !== idx);
}

function normalizeSizes(input?: string[] | null): SizeOption[] {
  const up = Array.isArray(input) ? input.map((s) => String(s).trim().toUpperCase()) : [];
  const filtered = up.filter((s): s is SizeOption => (SIZE_OPTIONS as readonly string[]).includes(s));
  const unique = filtered.filter((s, i) => filtered.indexOf(s) === i);
  return unique.length ? unique : Array.from(SIZE_OPTIONS);
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
    isActive: true,
    availableSizes: Array.from(SIZE_OPTIONS) as SizeOption[]
  });

  const imageUrls = useMemo(() => parseCsv(form.imagesCsv), [form.imagesCsv]);
  const categoryValue = form.categoryOption === "Other" ? form.categoryOther.trim() : form.categoryOption;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

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
        setEditDraft((prev) => {
          if (!prev) return null;
          return { ...prev, images: [...prev.images, ...urls] };
        });
      }
    } catch (e: any) {
      setStatus(`Upload failed: ${String(e?.message ?? e)}`);
    } finally {
      setUploading(false);
    }
  }

  function toggleSize(current: SizeOption[], s: SizeOption) {
    if (current.includes(s)) {
      const next = current.filter((x) => x !== s);
      return next.length ? next : current;
    }
    return [...current, s];
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
        isActive: form.isActive,
        availableSizes: form.availableSizes
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
    const matchedCategory = CATEGORY_OPTIONS.find((c) => (d.category || "").toLowerCase() === c.toLowerCase());
    setEditingId(d.id);
    setEditDraft({
      images: Array.isArray(d.images) ? d.images : [],
      categoryOption: (matchedCategory as CategoryOption) || "Other",
      categoryOther: matchedCategory ? "" : d.category ?? "",
      description: d.description ?? "",
      priceCents: d.priceCents ?? 0,
      isActive: !!d.isActive,
      availableSizes: normalizeSizes(d.availableSizes)
    });
  }

  async function saveEdit(d: DropDesign) {
    if (!editDraft) return;
    setStatus("");
    setSaving(true);
    try {
      const category = editDraft.categoryOption === "Other" ? editDraft.categoryOther.trim() : editDraft.categoryOption;
      await api.admin.updateDrop(d.id, {
        ...d,
        images: editDraft.images,
        category: category || undefined,
        description: editDraft.description || undefined,
        priceCents: editDraft.priceCents,
        isActive: editDraft.isActive,
        availableSizes: editDraft.availableSizes
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
          <div className="muted">Create, activate/deactivate, edit price, category, and available sizes.</div>
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
                onChange={(e) => setForm({ ...form, priceCents: Math.max(0, Number(e.target.value) * 100) })}
              />
            </div>
            <div style={{ width: 260, minWidth: 260 }}>
              <div className="label">Category</div>
              <select className="input" value={form.categoryOption} onChange={(e) => setForm({ ...form, categoryOption: e.target.value as CategoryOption })}>
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

          <div className="label">Available sizes</div>
          <div className="sizeRow" style={{ marginBottom: 6 }}>
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={form.availableSizes.includes(s) ? "sizeChip selected" : "sizeChip"}
                onClick={() => setForm({ ...form, availableSizes: toggleSize(form.availableSizes, s) })}
              >
                {s}
              </button>
            ))}
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

          {status && <div className="muted" style={{ marginTop: 12 }}>{status}</div>}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="adminList">
        {drops.map((d) => {
          const isEditing = editingId === d.id;
          const sizes = normalizeSizes(d.availableSizes);
          return (
            <div className="adminItem" key={d.id}>
              <div className="adminItemInner">
                {d.images?.[0] ? <img className="adminThumb" src={d.images[0]} alt={d.title} /> : <div className="adminThumb" />}

                <div className="adminMeta">
                  <div className="adminMetaTitle clamp2" title={d.title}>
                    {d.title}
                  </div>
                  <div className="adminMetaSub">
                    {formatRupees(d.priceCents)} • {d.category || "-"} • {d.isActive ? "Active" : "Inactive"}
                  </div>
                  <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
                    Sizes: {sizes.join(", ")}
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
                  <div className="row" style={{ alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div className="label">Category</div>
                      <select className="input" value={editDraft.categoryOption} onChange={(e) => setEditDraft({ ...editDraft, categoryOption: e.target.value as CategoryOption })}>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {editDraft.categoryOption === "Other" && (
                        <input className="input" style={{ marginTop: 8 }} value={editDraft.categoryOther} onChange={(e) => setEditDraft({ ...editDraft, categoryOther: e.target.value })} placeholder="Custom category" />
                      )}
                    </div>

                    <div style={{ width: 180, minWidth: 160 }}>
                      <div className="label">Price (INR)</div>
                      <input className="input" type="number" value={Math.round(editDraft.priceCents / 100)} onChange={(e) => setEditDraft({ ...editDraft, priceCents: Math.max(0, Number(e.target.value) * 100) })} />
                    </div>

                    <div style={{ width: 220, minWidth: 200 }}>
                      <div className="label">Upload more images</div>
                      <input className="input" type="file" multiple disabled={uploading || saving} onChange={(e) => upload(e.currentTarget.files, "edit")} />
                    </div>

                    <button className="btn" onClick={() => setEditDraft({ ...editDraft, isActive: !editDraft.isActive })}>
                      {editDraft.isActive ? "Active" : "Inactive"}
                    </button>

                    <button className="btn primary" disabled={saving} onClick={() => saveEdit(d)}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>

                  <div className="label">Available sizes</div>
                  <div className="sizeRow" style={{ marginBottom: 8 }}>
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={editDraft.availableSizes.includes(s) ? "sizeChip selected" : "sizeChip"}
                        onClick={() => setEditDraft({ ...editDraft, availableSizes: toggleSize(editDraft.availableSizes, s) })}
                      >
                        {s}
                      </button>
                    ))}
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
