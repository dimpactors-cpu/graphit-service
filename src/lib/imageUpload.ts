export async function fileToDataUrl(
  file: File,
  maxWidth = 1400,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || "");
      // If small file (< 180KB), keep original data URL as-is
      if (file.size <= 180 * 1024) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const webp = canvas.toDataURL("image/webp", quality);
          if (webp.startsWith("data:image/webp") && webp.length < rawDataUrl.length) {
            resolve(webp);
            return;
          }
          const jpeg = canvas.toDataURL("image/jpeg", quality);
          resolve(jpeg.length < rawDataUrl.length ? jpeg : rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
