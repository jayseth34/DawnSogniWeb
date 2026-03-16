import { useEffect, useMemo, useState } from "react";
import { api, type CustomRequest } from "../../api";
import { uploadToImageKit } from "../../imagekitUpload";
import { formatRupees } from "../money";

function parseCsv(csv: string) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AdminCustomRequestsPage() {
  const [list, setList] = useState<CustomRequest[]>([]);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const [selected, setSelected] = useState<CustomRequest | null>(null);
  const [quote, setQuote] = useState<number>(70000);
  const [designUrlsCsv, setDesignUrlsCsv] = useState("");

  async function load() {
    setStatus("");
    const items = await api.admin.customRequests();
    setList(items);
    if (selected) {
      const fresh = items.find((x) => x.id === selected.id) ?? null;
      setSelected(fresh);
      if (fresh?.quotedPriceCents) setQuote(fresh.quotedPriceCents);
    }
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e?.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function update(id: string, patch: any) {
    setStatus("");
    await api.admin.updateCustomRequest(id, patch);
    await load();
  }

  async function uploadDesigns(files: FileList | null) {
    if (!selected || !files || files.length === 0) return;
    setStatus("");
    setUploading(true);
    try {
      const auth = await api.imagekit.adminAuth();
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const r = await uploadToImageKit({
          file: f,
          folder: `/dawn-sogni/custom-designs/${selected.id}`,
          publicKey: auth.publicKey,
          auth: async () => auth
        });
        urls.push(r.url);
      }
      const existing = parseCsv(designUrlsCsv);
      setDesignUrlsCsv([...existing, ...urls].join(", "));
    } catch (e: any) {
      setStatus(`Upload failed: ${String(e?.message ?? e)}`);
    } finally {
      setUploading(false);
    }
  }

  async function addDesign(id: string) {
    const images = parseCsv(designUrlsCsv);
    if (images.length === 0) return;
    setStatus("");
    await api.admin.addCustomDesign(id, { images });
    setDesignUrlsCsv("");
    await load();
  }

  const selectedDesignUrls = useMemo(() => {
    return (selected?.designs ?? []).flatMap((d) => d.images);
  }, [selected]);

  return (
    <div>
      <div className="adminPageTitle">
        <div>
          <div className="h2">Custom Requests</div>
          <div className="muted">Review customer requests, set status, and add quotes/designs.</div>
        </div>
      </div>

      <div className="hr" />
      {status && <div className="muted">{status}</div>}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="adminList">
          {list.map((c) => (
            <button
              key={c.id}
              className={selected?.id === c.id ? "adminItem" : "adminItem"}
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => {
                setSelected(c);
                setQuote(c.quotedPriceCents ?? 70000);
              }}
            >
              <div className="adminItemInner" style={{ gridTemplateColumns: "1fr auto", gap: 12 }}>
                <div className="adminMeta">
                  <div className="adminMetaTitle">{c.customerName}</div>
                  <div className="adminMetaSub">
                    {c.phone} · {c.status} · {c.quotedPriceCents ? formatRupees(c.quotedPriceCents) : "No quote"}
                  </div>
                </div>
                <div className="tag">{new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
            </button>
          ))}
          {list.length === 0 && <div className="muted">No requests.</div>}
        </div>

        <div className="card">
          <div className="p">
            <div style={{ fontWeight: 800 }}>Details</div>
            {!selected ? (
              <div className="muted" style={{ marginTop: 10 }}>
                Select a request.
              </div>
            ) : (
              <>
                <div className="muted" style={{ marginTop: 10 }}>
                  <div>
                    <b>{selected.customerName}</b> · {selected.phone}
                  </div>
                  <div style={{ marginTop: 6 }}>{selected.notes ?? "—"}</div>
                </div>

                <div style={{ height: 10 }} />
                <div className="row">
                  <span className="tag">{selected.status}</span>
                  <span className="tag">Quoted: {selected.quotedPriceCents ? formatRupees(selected.quotedPriceCents) : "—"}</span>
                </div>

                <div style={{ height: 12 }} />
                <div className="muted">Reference images</div>
                <div className="row" style={{ marginTop: 10, gap: 10 }}>
                  {(selected.referenceImages ?? []).map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer">
                      <img className="adminThumbSm" src={u} alt="" />
                    </a>
                  ))}
                  {(selected.referenceImages ?? []).length === 0 && <span className="muted">—</span>}
                </div>

                <div className="hr" />

                <div className="label">Set status</div>
                <div className="row">
                  {(["REQUESTED", "IN_PROGRESS", "QUOTED", "ACCEPTED", "DECLINED", "COMPLETED"] as const).map((s) => (
                    <button key={s} className={s === selected.status ? "btn primary" : "btn"} onClick={() => update(selected.id, { status: s })}>
                      {s}
                    </button>
                  ))}
                </div>

                <div className="label">Quote (₹)</div>
                <div className="row">
                  <input
                    className="input"
                    style={{ width: 180 }}
                    type="number"
                    value={Math.round(quote / 100)}
                    onChange={(e) => setQuote(Number(e.target.value) * 100)}
                  />
                  <button className="btn primary" onClick={() => update(selected.id, { quotedPriceCents: quote, status: "QUOTED" })}>
                    Save quote
                  </button>
                </div>

                <div className="label">Upload created designs</div>
                <input className="input" type="file" multiple disabled={uploading} onChange={(e) => uploadDesigns(e.currentTarget.files)} />

                <div className="label">Design image URLs (comma-separated)</div>
                <input className="input" value={designUrlsCsv} onChange={(e) => setDesignUrlsCsv(e.target.value)} />
                <div style={{ height: 10 }} />
                <button className="btn primary" onClick={() => addDesign(selected.id)} disabled={!designUrlsCsv.trim() || uploading}>
                  Add designs
                </button>

                {parseCsv(designUrlsCsv).length > 0 && (
                  <div className="row" style={{ marginTop: 12, gap: 10 }}>
                    {parseCsv(designUrlsCsv).slice(0, 6).map((u) => (
                      <a key={u} href={u} target="_blank" rel="noreferrer">
                        <img className="adminThumbSm" src={u} alt="" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="hr" />
                <div className="muted">Saved designs</div>
                <div className="row" style={{ marginTop: 10, gap: 10 }}>
                  {selectedDesignUrls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer">
                      <img className="adminThumbSm" src={u} alt="" />
                    </a>
                  ))}
                  {selectedDesignUrls.length === 0 && <span className="muted">—</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
