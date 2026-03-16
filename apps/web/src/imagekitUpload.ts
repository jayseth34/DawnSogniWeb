type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
};

export async function uploadToImageKit(params: {
  file: File;
  fileName?: string;
  folder?: string;
  auth: () => Promise<ImageKitAuth>;
  publicKey: string;
}) {
  const auth = await params.auth();
  const form = new FormData();
  form.append("file", params.file);
  form.append("fileName", params.fileName ?? params.file.name);
  if (params.folder) form.append("folder", params.folder);
  form.append("publicKey", params.publicKey);
  form.append("token", auth.token);
  form.append("expire", String(auth.expire));
  form.append("signature", auth.signature);

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: form
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "ImageKit upload failed");
  return data as { url: string; fileId: string; name: string };
}
