import React, { StrictMode, ReactNode, Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LanguageProvider } from "./LanguageContext.tsx";
import { AgentProvider } from "./AgentContext.tsx";
import { CurrencyProvider } from "./CurrencyContext.tsx";

// Prevent Google Translate and Chrome extensions from crashing React during dynamic DOM updates
if (
  typeof window !== "undefined" &&
  typeof Node !== "undefined" &&
  Node.prototype
) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "removeChild: Node to be removed is not a child of this node. Skipping gracefully.",
          child,
          this,
        );
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "insertBefore: Reference node is not a child of this node. Appending gracefully instead.",
          referenceNode,
          this,
        );
      }
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

// Anti-copy and anti-inspect protections
if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  document.addEventListener("selectstart", (e) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
    ) {
      return;
    }
    e.preventDefault();
  });

  document.addEventListener("copy", (e) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
    ) {
      return;
    }
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData(
        "text/plain",
        "Content protected by Phuket Amazing Yacht Charter",
      );
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "F12") {
      e.preventDefault();
    }
    if (
      e.ctrlKey &&
      e.shiftKey &&
      ["I", "J", "C", "i", "j", "c"].includes(e.key)
    ) {
      e.preventDefault();
    }
    if (e.ctrlKey && ["U", "u", "S", "s"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.metaKey && e.altKey && ["I", "i", "U", "u"].includes(e.key)) {
      e.preventDefault();
    }
  });

  // Active Code Tamper Protection
  let securityLevel = 0;
  const securityCodes: string[] = [];
  let isAuthorized = false;

  const enforceSecurity = () => {
    if (isAuthorized) return;

    // Create custom overlay instead of prompt() which fails in iframes
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "black";
    overlay.style.color = "red";
    overlay.style.fontFamily = "monospace";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999999";
    overlay.style.padding = "2rem";
    overlay.style.textAlign = "center";

    const message = document.createElement("div");
    message.innerHTML = `SECURITY BREACH DETECTED<br/><br/>Unauthorized tampering or developer tools access.`;
    message.style.fontSize = "20px";
    message.style.marginBottom = "20px";

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";
    inputContainer.style.flexDirection = "column";
    inputContainer.style.gap = "10px";
    inputContainer.style.marginTop = "20px";

    const input = document.createElement("input");
    input.type = "password";
    input.placeholder = `Enter Code (${securityLevel + 1}/${securityCodes.length})`;
    input.style.padding = "10px";
    input.style.fontSize = "16px";
    input.style.color = "black";
    input.style.textAlign = "center";

    const btn = document.createElement("button");
    btn.textContent = "AUTHORIZE";
    btn.style.padding = "10px 20px";
    btn.style.backgroundColor = "red";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.fontWeight = "bold";
    btn.style.cursor = "pointer";

    inputContainer.appendChild(input);
    inputContainer.appendChild(btn);
    overlay.appendChild(message);
    overlay.appendChild(inputContainer);

    document.body.appendChild(overlay);

    btn.onclick = () => {
      if (input.value === securityCodes[securityLevel]) {
        isAuthorized = true;
        document.body.removeChild(overlay);
        // We do not alert to avoid iframe blocking, just gracefully continue
      } else {
        securityLevel++;
        if (securityLevel >= securityCodes.length) {
          inputContainer.style.display = "none";
          message.innerHTML =
            "SYSTEM LOCKED<br/><br/>Maximum attempts reached. Data wiped and system permanently locked.";
        } else {
          input.value = "";
          input.placeholder = `Invalid. Enter Code (${securityLevel + 1}/${securityCodes.length})`;
        }
      }
    };
  };

  // Only trigger on specific key combos to avoid false positives in the preview iframe
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            color: "red",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.toString()}</p>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AgentProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </LanguageProvider>
      </AgentProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Register Service Worker for PWA Offline Capabilities (Production only to avoid caching typescript source files in dev)
if ("serviceWorker" in navigator) {
  if ((import.meta as any).env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "⛵ Yacht Booking PWA Service Worker registered with scope:",
            registration.scope,
          );
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    });
  } else {
    // Proactively clean up any registered service workers in development to clear broken caches, without reloading
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log("🗑️ Legacy development Service Worker cleared.");
          }
        });
      }
    });
  }
}
