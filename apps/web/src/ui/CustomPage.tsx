import { useEffect, useMemo, useState } from "react";
import { api, type CustomRequest } from "../api";
import { uploadToImageKit } from "../imagekitUpload";
import { loadSession, saveSession } from "../storage";

function normalizePhone(input: string) {
  return input.replace(/[^0-9+]/g, "").slice(0, 16);
}

function uniq(arr: string[]) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
}

export function CustomPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneOk = useMemo(() => normalizePhone(phone).replace(/^\+/, "").length >= 6, [phone]);

  const [customTokens, setCustomTokens] = useState<string[]>(() => {
    const s = loadSession();
    return (s as any).customRequestTokens ?? [];
  });
  const [tracked, setTracked] = useState<Record<string, CustomRequest>>({});

  async function refreshTracked(tokens: string[]) {
    const out: Record<string, CustomRequest> = {};
    for (const t of tokens) {
      try {
        const cr = await api.getCustomRequestByToken(t);
        out[t] = cr;
      } catch {
        // ignore
      }
    }
    setTracked(out);
  }

  useEffect(() => {
    refreshTracked(customTokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTokens.join("|")]);

  function persistTokens(nextTokens: string[]) {
    const s = loadSession();
    const next = { ...(s as any), customRequestTokens: nextTokens };
    setCustomTokens(nextTokens);
    saveSession(next as any);
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setStatus("");
    setUploading(true);
    try {
      const auth = await api.imagekit.publicAuth();
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const r = await uploadToImageKit({
          file: f,
          folder: "/dawn-sogni/custom-requests",
          publicKey: auth.publicKey,
          auth: async () => auth
        });
        urls.push(r.url);
      }
      setReferenceImages((prev) => uniq([...urls, ...prev]));
    } catch (e: any) {
      setStatus(`Upload failed: ${String(e?.message ?? e)}`);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!customerName.trim() || !phoneOk) return;
    setStatus("");
    setSubmitting(true);
    try {
      const resp = await api.createCustomRequest({
        customerName: customerName.trim(),
        phone: normalizePhone(phone),
        notes,
        referenceImages
      });

      const token = resp.customRequest.accessToken;
      if (token) {
        persistTokens(uniq([token, ...customTokens]).slice(0, 30));
      }

      setCustomerName("");
      setPhone("");
      setNotes("");
      setReferenceImages([]);
      setStatus("Sent! Track your custom orders below.");
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTrackedImage(token: string, url: string) {
    const cr = tracked[token];
    if (!cr) return;
    const nextImages = (cr.referenceImages ?? []).filter((u) => u !== url);
    const next = await api.updateCustomRequestByToken(token, { referenceImages: nextImages });
    setTracked((prev) => ({ ...prev, [token]: next }));
  }

  return (
    <div className="container page" style={{ maxWidth: 900 }}>
      <div className="h2">Custom order</div>
      <div className="muted">Upload references, tell us your idea, and we will update status and share designs here.</div>
      <div className="hr" />

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="p">
            <div style={{ fontWeight: 900 }}>Create request</div>

            <div className="label">Name</div>
            <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

            <div className="label">Phone</div>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(normalizePhone(e.target.value))}
              placeholder="e.g. +91xxxxxxxxxx"
            />
            {!phoneOk && phone.trim() && <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>Enter a valid phone number.</div>}

            <div className="label">What do you want?</div>
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />

            <div className="label">Upload reference images (ImageKit)</div>
            <input className="input" type="file" multiple disabled={uploading || submitting} onChange={(e) => upload(e.currentTarget.files)} />

            {referenceImages.length > 0 && (
              <div className="row" style={{ marginTop: 12, gap: 10, alignItems: "flex-end" }}>
                {referenceImages.map((u) => (
                  <div key={u} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                    <a href={u} target="_blank" rel="noreferrer">
                      <img className="adminThumbSm" src={u} alt="" />
                    </a>
                    <button className="btn danger" style={{ padding: "6px 10px", borderRadius: 10 }} onClick={() => setReferenceImages((prev) => prev.filter((x) => x !== u))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: 14 }} />
            <button className="btn primary" onClick={submit} disabled={!customerName.trim() || !phoneOk || uploading || submitting}>
              {submitting ? "Sending..." : "Send request"}
            </button>
            {status && <div className="muted" style={{ marginTop: 12 }}>{status}</div>}
          </div>
        </div>

        <div className="card">
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>Your custom orders</div>
              <button className="btn" onClick={() => refreshTracked(customTokens)}>
                Refresh
              </button>
            </div>
            <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
              Saved on this device. Admin status updates will appear here.
            </div>

            <div style={{ height: 12 }} />
            {customTokens.length === 0 && <div className="muted">No custom orders yet.</div>}

            <div className="grid" style={{ gap: 10 }}>
              {customTokens.map((t) => {
                const cr = tracked[t];
                return (
                  <div key={t} className="pill" style={{ width: "100%", justifyContent: "space-between" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800 }}>{cr ? cr.customerName : "Custom request"}</div>
                      <div className="muted2" style={{ fontSize: 12, marginTop: 2 }}>
                        Status: {cr?.status ?? "Loading..."}
                        {cr?.quotedPriceCents ? ` | Quote: INR ${Math.round(cr.quotedPriceCents / 100)}` : ""}
                      </div>

                      {cr?.referenceImages?.length ? (
                        <div className="row" style={{ marginTop: 10, gap: 10, alignItems: "flex-end" }}>
                          {cr.referenceImages.map((u) => (
                            <div key={u} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                              <a href={u} target="_blank" rel="noreferrer">
                                <img className="adminThumbSm" src={u} alt="" />
                              </a>
                              <button className="btn danger" style={{ padding: "6px 10px", borderRadius: 10 }} onClick={() => removeTrackedImage(t, u)}>
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {cr?.designs?.length ? (
                        <div className="row" style={{ marginTop: 10, gap: 10 }}>
                          {cr.designs.flatMap((d) => d.images).map((u) => (
                            <a key={u} href={u} target="_blank" rel="noreferrer">
                              <img className="adminThumbSm" src={u} alt="" />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <button className="btn danger" onClick={() => persistTokens(customTokens.filter((x) => x !== t))}>
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}