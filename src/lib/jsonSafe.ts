
export const safeStringify = (obj: any): string => {
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return undefined;
        }
        // Safely exclude HTML Nodes and Event objects that trigger circularity
        if (
          (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) ||
          (typeof HTMLImageElement !== "undefined" && value instanceof HTMLImageElement) ||
          (typeof Event !== "undefined" && value instanceof Event) ||
          (value.constructor && value.constructor.name === "FiberNode")
        ) {
          return undefined;
        }
        seen.add(value);
      }
      return value;
    };
  };

  try {
    return JSON.stringify(obj, getCircularReplacer());
  } catch (e) {
    console.warn("JSON.stringify fallback failed:", e);
    return "{}";
  }
};
