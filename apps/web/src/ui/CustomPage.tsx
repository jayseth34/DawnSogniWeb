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

function quoteText(cr?: CustomRequest) {
  if (!cr) return "Loading...";
  if (cr.quotedPriceCents) return `Quoted: INR ${Math.round(cr.quotedPriceCents / 100)}`;
  return `Approx: INR ${cr.approxPriceLow ?? 600} - ${cr.approxPriceHigh ?? 800}`;
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
    void refreshTracked(customTokens);
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
    <div className="container page publicPageShell" style={{ maxWidth: 1180 }}>
      <div className="publicPageIntro revealSection sectionGlow">
        <div className="infoEyebrow">Custom design desk</div>
        <div className="h2">Share your idea, references, and fit preference</div>
        <div className="muted">
          We accept one-off custom design requests and bulk custom clothing. You can upload references now, and we will update the same request with status,
          quotes, and design previews.
        </div>
      </div>
      <div className="hr" />

      <div className="grid customSplitGrid">
        <div className="card revealSection sectionGlow">
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }}>Create request</div>
                <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
                  Approx starting range: INR 600 - 800 for custom work before final quote.
                </div>
              </div>
              <span className="glassBadge active">ImageKit upload</span>
            </div>

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
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tell us the concept, colour, fit, print style, and deadline." />

            <div className="label">Upload reference images</div>
            <input className="input" type="file" multiple disabled={uploading || submitting} onChange={(e) => upload(e.currentTarget.files)} />

            {referenceImages.length > 0 && (
              <div className="customThumbGrid" style={{ marginTop: 14 }}>
                {referenceImages.map((u) => (
                  <div key={u} className="miniImageCard">
                    <img className="adminThumbSm customThumbPreview" src={u} alt="Reference" />
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

        <div className="card revealSection sectionGlow">
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }}>Your custom orders</div>
                <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
                  Saved on this device. Admin updates and uploaded designs appear here.
                </div>
              </div>
              <button className="btn" onClick={() => refreshTracked(customTokens)}>
                Refresh
              </button>
            </div>

            <div style={{ height: 12 }} />
            {customTokens.length === 0 && <div className="muted">No custom orders yet.</div>}

            <div className="stackList">
              {customTokens.map((t) => {
                const cr = tracked[t];
                return (
                  <div key={t} className="statusCard">
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800 }}>{cr ? cr.customerName : "Custom request"}</div>
                        <div className="muted2" style={{ fontSize: 12, marginTop: 4 }}>
                          Status: {cr?.status ?? "Loading..."} | {quoteText(cr)}
                        </div>
                      </div>
                      <button className="btn danger" onClick={() => persistTokens(customTokens.filter((x) => x !== t))}>
                        Delete
                      </button>
                    </div>

                    {cr?.notes ? <div className="muted" style={{ marginTop: 10 }}>{cr.notes}</div> : null}

                    {cr?.referenceImages?.length ? (
                      <>
                        <div className="label">Your uploaded references</div>
                        <div className="customThumbGrid">
                          {cr.referenceImages.map((u) => (
                            <div key={u} className="miniImageCard">
                              <img className="adminThumbSm customThumbPreview" src={u} alt="Uploaded reference" />
                              <button className="btn danger" style={{ padding: "6px 10px", borderRadius: 10 }} onClick={() => removeTrackedImage(t, u)}>
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {cr?.designs?.length ? (
                      <>
                        <div className="label">Admin design previews</div>
                        <div className="customThumbGrid">
                          {cr.designs.flatMap((d) => d.images).map((u) => (
                            <div key={u} className="miniImageCard">
                              <img className="adminThumbSm customThumbPreview" src={u} alt="Design preview" />
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
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
