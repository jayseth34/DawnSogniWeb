/* WebP encoder for browsers that can't save WebP themselves (iPhone/iPad Safari).
   libwebp compiled to WebAssembly, from @jsquash/webp 1.5.0 (Apache-2.0, see LICENSE). Loaded by the admin only when needed. */
import factory from "./webp_enc.js";
const defaults = { quality: 75, target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50, filter_strength: 60, filter_sharpness: 0, filter_type: 1, partitions: 0, segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0, partition_limit: 0, alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100, lossless: 0, exact: 0, image_hint: 0, emulate_jpeg_size: 0, thread_level: 0, low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0 };
let mod;
export default async function encode(imageData, options = {}) {
  mod = mod || factory({ noInitialRun: true });
  const m = await mod, out = m.encode(imageData.data, imageData.width, imageData.height, { ...defaults, ...options });
  if (!out) throw new Error("WebP encoding failed");
  return out.buffer;
}
