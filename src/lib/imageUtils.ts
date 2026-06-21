export const imgToBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    if (url.startsWith("data:")) {
      resolve(url);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
          return;
        }
      } catch (e) {
        console.warn("Failed canvas toDataURL conversion for URL", url, e);
      }
      resolve(null);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url.includes("?")
      ? `${url}&cache_bypass=${Date.now()}`
      : `${url}?cache_bypass=${Date.now()}`;
  });
};
