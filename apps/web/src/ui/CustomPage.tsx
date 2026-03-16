import { useState } from "react";
import { api } from "../api";
import { uploadToImageKit } from "../imagekitUpload";

export function CustomPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [uploading, setUploading] = useState(false);

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
    setStatus("");
    try {
      await api.createCustomRequest({ customerName, phone, notes, referenceImages });
      setCustomerName("");
      setPhone("");
      setNotes("");
      setReferenceImages([]);
      setStatus("Sent! We’ll review and get back with a quote.");
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    }
  }

  return (
    <div style={{ paddingTop: 18, maxWidth: 720 }}>
      <div className="h2">Custom design request</div>
      <div className="muted">
        Share your idea and any references. Pricing depends on complexity (approx ₹600–₹800 as a starting range).
      </div>
      <div className="hr" />

      <div className="label">Name</div>
      <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

      <div className="label">Phone</div>
      <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div className="label">What do you want?</div>
      <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="label">Upload reference images (ImageKit)</div>
      <input className="input" type="file" multiple disabled={uploading} onChange={(e) => upload(e.currentTarget.files)} />
      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
        If ImageKit isn’t configured yet, uploads will fail — you can still paste image URLs below.
      </div>

      <div className="label">Reference image URLs (optional)</div>
      <input
        className="input"
        placeholder="Paste a public image URL and press Enter"
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
      <button className="btn primary" onClick={submit} disabled={!customerName || !phone || uploading}>
        Send request
      </button>
      {status && (
        <div className="muted" style={{ marginTop: 12 }}>
          {status}
        </div>
      )}
    </div>
  );
}
