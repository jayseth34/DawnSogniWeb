import { useMemo, useState } from "react";
import { api } from "../api";
import { uploadToImageKit } from "../imagekitUpload";

function normalizePhone(input: string) {
  return input.replace(/[^0-9+]/g, "").slice(0, 16);
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
      setReferenceImages((prev) => [...urls, ...prev]);
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
      await api.createCustomRequest({ customerName: customerName.trim(), phone: normalizePhone(phone), notes, referenceImages });
      setCustomerName("");
      setPhone("");
      setNotes("");
      setReferenceImages([]);
      setStatus("Sent! We’ll review and get back with a quote.");
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <div className="h2">Custom design request</div>
      <div className="muted">Share your idea and any references. Pricing depends on complexity (approx ₹600–₹800 to start).</div>
      <div className="hr" />

      <div className="label">Name</div>
      <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

      <div className="label">Phone</div>
      <input className="input" value={phone} onChange={(e) => setPhone(normalizePhone(e.target.value))} placeholder="e.g. +91xxxxxxxxxx" />
      {!phoneOk && phone.trim() && <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>Enter a valid phone number.</div>}

      <div className="label">What do you want?</div>
      <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="label">Upload reference images (ImageKit)</div>
      <input className="input" type="file" multiple disabled={uploading || submitting} onChange={(e) => upload(e.currentTarget.files)} />
      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
        If ImageKit isn’t configured yet, uploads will fail — you can still paste image URLs below.
      </div>

      <div className="label">Reference image URLs (optional)</div>
      <input
        className="input"
        placeholder="Paste a public image URL and press Enter"
        disabled={uploading || submitting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const v = (e.currentTarget.value || "").trim();
            if (!v) return;
            setReferenceImages((prev) => [v, ...prev]);
            e.currentTarget.value = "";
          }
        }}
      />
      <div className="row" style={{ marginTop: 10 }}>
        {referenceImages.map((u) => (
          <a className="tag" key={u} href={u} target="_blank" rel="noreferrer">
            image
          </a>
        ))}
      </div>

      <div style={{ height: 14 }} />
      <button className="btn primary" onClick={submit} disabled={!customerName.trim() || !phoneOk || uploading || submitting}>
        {submitting ? "Sending..." : "Send request"}
      </button>
      {status && (
        <div className="muted" style={{ marginTop: 12 }}>
          {status}
        </div>
      )}
    </div>
  );
}
