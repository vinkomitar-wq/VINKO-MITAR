import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Eye,
  Lock,
  FileText,
  CheckCircle,
  Settings,
  X,
  ChevronRight,
  Check,
} from "lucide-react";

interface PrivacyBannerProps {
  onConsentChange?: (consent: {
    essential: boolean;
    preferences: boolean;
  }) => void;
}

export default function PrivacyBanner({ onConsentChange }: PrivacyBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "disclosure" | "controls" | "pdpa"
  >("disclosure");

  // Consent toggles
  const [prefConsent, setPrefConsent] = useState(true);

  useEffect(() => {
    // Check if user has already declared their privacy preference
    const storedConsent = localStorage.getItem("payc_privacy_consent_v1");
    if (!storedConsent) {
      // Show the banner with a slight delay for elegant editorial transition
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(storedConsent);
        setPrefConsent(parsed.preferences ?? true);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = { essential: true, preferences: true };
    localStorage.setItem("payc_privacy_consent_v1", JSON.stringify(consent));
    setPrefConsent(true);
    setIsVisible(false);
    if (onConsentChange) onConsentChange(consent);
  };

  const handleAcceptEssential = () => {
    const consent = { essential: true, preferences: false };
    localStorage.setItem("payc_privacy_consent_v1", JSON.stringify(consent));
    setPrefConsent(false);
    setIsVisible(false);
    if (onConsentChange) onConsentChange(consent);
  };

  const handleSaveCustom = () => {
    const consent = { essential: true, preferences: prefConsent };
    localStorage.setItem("payc_privacy_consent_v1", JSON.stringify(consent));
    setIsVisible(false);
    setShowModal(false);
    if (onConsentChange) onConsentChange(consent);
  };

  return (
    <>
      {/* Floating Bottom Consent Banner */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="privacy-cookie-banner"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="fixed bottom-0 left-0 right-0 z-45 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#0F172A]/15 py-5 px-4 sm:px-6 shadow-[0_-10px_25px_rgba(15,23,42,0.06)]"
          >
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 max-w-3xl text-left">
                <div className="p-2 bg-[#0F172A] text-white rounded-xs mt-0.5 shrink-0 hidden sm:block">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                    Privacy Preference & Thailand PDPA Disclosure
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans">
                    We use pristine terminal-less essential parameters to
                    remember your catamaran itinerary selection and process
                    secure inquiries directly with our Maritime Desk via
                    WhatsApp. We never load malicious third-party trackers or ad
                    syndicates. Read our{" "}
                    <button
                      id="btn-trigger-disclosure-inline"
                      onClick={() => {
                        setActiveTab("disclosure");
                        setShowModal(true);
                      }}
                      className="text-[#0F172A] font-bold underline hover:opacity-80 focus:outline-hidden"
                    >
                      Privacy Disclosure
                    </button>{" "}
                    to learn more.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                <button
                  id="btn-privacy-customize"
                  onClick={() => {
                    setActiveTab("controls");
                    setShowModal(true);
                  }}
                  type="button"
                  className="px-4 py-2.5 border border-[#0F172A]/20 hover:border-[#0F172A]/40 text-[#0F172A] font-sans font-bold text-[10px] uppercase tracking-wider bg-transparent transition-all cursor-pointer rounded-xs flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
                >
                  <Settings className="h-3.5 w-3.5 text-[#0F172A]" /> Customize
                </button>
                <button
                  id="btn-privacy-essential"
                  onClick={handleAcceptEssential}
                  type="button"
                  className="px-4 py-2.5 border border-[#0F172A]/20 hover:border-[#0F172A]/40 text-slate-500 hover:text-[#0F172A] font-sans text-[10px] uppercase tracking-wider bg-transparent transition-all cursor-pointer rounded-xs flex-1 sm:flex-initial justify-center"
                >
                  Essential Only
                </button>
                <button
                  id="btn-privacy-accept-all"
                  onClick={handleAcceptAll}
                  type="button"
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-sans font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer rounded-xs flex-1 sm:flex-initial justify-center shadow-xs"
                >
                  Accept All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exquisite Full-Screen Editorial Privacy Disclosure & settings Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            id="privacy-disclosure-modal"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-full max-w-2xl overflow-hidden rounded-xs bg-[#FAF9F6] border border-[#0F172A]/15 shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Header branding */}
                <div className="border-b border-[#0F172A]/10 bg-white p-5 pr-14 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0F172A] text-white rounded-xs">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#0F172A] tracking-wide uppercase">
                        Privacy Disclosure & Consent
                      </h3>
                      <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        PHUKET AMAZING YACHT CHARTER • THAILAND PDPA COMPLIANT
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-privacy-modal-close"
                    onClick={() => setShowModal(false)}
                    className="absolute top-5 right-5 p-2 rounded-xs hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Tabs Navigation */}
                <div className="flex border-b border-[#0F172A]/10 bg-white/50 text-xs">
                  <button
                    id="tab-privacy-disclosure"
                    onClick={() => setActiveTab("disclosure")}
                    className={`flex-1 py-3 px-4 font-sans font-bold uppercase tracking-wider text-[10px] text-center border-b-2 transition-all ${
                      activeTab === "disclosure"
                        ? "border-[#0F172A] text-[#0F172A] bg-white"
                        : "border-transparent text-slate-405 text-slate-500 hover:text-[#0F172A]"
                    }`}
                  >
                    1. Privacy Disclosures
                  </button>
                  <button
                    id="tab-privacy-controls"
                    onClick={() => setActiveTab("controls")}
                    className={`flex-1 py-3 px-4 font-sans font-bold uppercase tracking-wider text-[10px] text-center border-b-2 transition-all ${
                      activeTab === "controls"
                        ? "border-[#0F172A] text-[#0F172A] bg-white"
                        : "border-transparent text-slate-405 text-slate-500 hover:text-[#0F172A]"
                    }`}
                  >
                    2. Preferences & Settings
                  </button>
                  <button
                    id="tab-privacy-pdpa"
                    onClick={() => setActiveTab("pdpa")}
                    className={`flex-1 py-3 px-4 font-sans font-bold uppercase tracking-wider text-[10px] text-center border-b-2 transition-all ${
                      activeTab === "pdpa"
                        ? "border-[#0F172A] text-[#0F172A] bg-white"
                        : "border-transparent text-slate-405 text-slate-500 hover:text-[#0F172A]"
                    }`}
                  >
                    3. Your Rights (PDPA)
                  </button>
                </div>

                {/* Modal Scroll Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                  {activeTab === "disclosure" && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                          <Eye className="h-4 w-4 text-[#0F172A]/70" />{" "}
                          Transparent Data Collection
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Welcome to{" "}
                          <strong>Phuket Amazing Yacht Charter</strong>. When
                          you plan an exquisite custom sailing trip on our
                          catamarans, we prioritize the protection of your
                          personal information. Under the Thailand Personal Data
                          Protection Act (PDPA), we want you to know exactly how
                          we handle your metrics.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 border border-[#0F172A]/10 rounded-xs space-y-1.5 shadow-xs">
                          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block font-mono">
                            Formulated Layouts
                          </span>
                          <h5 className="text-xs font-bold text-[#0F172A]">
                            Transient Itinerary Config
                          </h5>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Your select decisions—such as chosen catamaran,
                            launch pier, tour destinations, date, and meal
                            choice—are processed on-the-fly to construct your
                            customized itinerary summary string.
                          </p>
                        </div>

                        <div className="bg-white p-4 border border-[#0F172A]/10 rounded-xs space-y-1.5 shadow-xs">
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block font-mono">
                            Encrypted Transmissions
                          </span>
                          <h5 className="text-xs font-bold text-[#0F172A]">
                            Direct Maritime Desk Dispatch
                          </h5>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            When selecting <em>"Book with WhatsApp"</em> or{" "}
                            <em>"Call Agency"</em>, your inputs are passed into
                            the native WhatsApp desktop or mobile app as text
                            parameters, ensuring no databases harvest your
                            messages.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#FAF9F6] border-l-2 border-slate-400 p-4 space-y-1.5">
                        <h5 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Zero Ad Tracking Mandate
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          We do not deploy pixel beacons, trackers, or
                          commercial profiling cookies. All local variables
                          strictly persist layout properties (like the selected
                          catamaran card template or destination helper
                          highlights) to offer a smooth, luxury browsing
                          experience.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "controls" && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Define Your Local Storage Parameters
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Check or uncheck choices to control how our code
                          processes your layout state on this device.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Essential Switch */}
                        <div className="flex items-start justify-between gap-4 p-4 bg-white border border-[#0F172A]/15 rounded-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                                Necessary Core Functions
                              </h5>
                              <span className="rounded-full bg-slate-100 border border-slate-205 py-0.5 px-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                                Required
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-505 text-slate-500 leading-relaxed">
                              Required to enable basic site structure, direct
                              call routing numbers, and basic interactive SVG
                              Phuket routing map functions.
                            </p>
                          </div>
                          <div className="text-slate-450 mt-1">
                            <CheckCircle className="h-5 w-5 text-emerald-600 fill-emerald-50" />
                          </div>
                        </div>

                        {/* Preferences Switch */}
                        <label
                          id="pref-storage-label"
                          className="flex items-start justify-between gap-4 p-4 bg-white border border-[#0F172A]/10 hover:border-[#0F172A]/20 rounded-xs transition-colors cursor-pointer select-none"
                        >
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                                Charter Experience Memory
                              </h5>
                              <span className="rounded-full bg-teal-100/60 border border-teal-205 py-0.5 px-2 text-[8px] font-bold text-teal-700 uppercase tracking-widest block">
                                Optional
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Enables us to save your selected yacht
                              configuration, customized duration choice, and
                              yacht detail slider index in your local browser
                              storage, allowing you to return and resume
                              configuring.
                            </p>
                          </div>
                          <div className="relative flex items-center shrink-0 mt-1">
                            <input
                              id="toggle-pref-consent"
                              type="checkbox"
                              checked={prefConsent}
                              onChange={(e) => setPrefConsent(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f172a]" />
                          </div>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "pdpa" && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                          <Lock className="h-4 w-4 text-[#0F172A]/70" />{" "}
                          Thailand PDPA Compliance Standards
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Under Thailand's Personal Data Protection Act B.E.
                          2562 (2019), guests on Phuket private charters are
                          legally guaranteed the following privacy rights:
                        </p>
                      </div>

                      <div className="space-y-3 font-sans">
                        <div className="p-3.5 bg-white border border-[#0F172A]/5 rounded-xs flex items-start gap-3">
                          <span className="font-mono text-[10px] font-extrabold text-[#0F172A] py-0.5">
                            01
                          </span>
                          <div className="space-y-0.5">
                            <h5 className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                              Right of Access & Consent
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              We only collect user information that you
                              explicitly submit in our customized booking form.
                              You can verify and preview your exact WhatsApp
                              transmission text in the configuration screen
                              prior to dispatch.
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 bg-white border border-[#0F172A]/5 rounded-xs flex items-start gap-3">
                          <span className="font-mono text-[10px] font-extrabold text-[#0F172A] py-0.5">
                            02
                          </span>
                          <div className="space-y-0.5">
                            <h5 className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                              Right to Erasure (To Be Forgotten)
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              Since we store no guest information on our remote
                              webservers, you own your data! Simply clearing
                              your browser cookies and site state instantly
                              erases all local metadata.
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 bg-white border border-[#0F172A]/5 rounded-xs flex items-start gap-3">
                          <span className="font-mono text-[10px] font-extrabold text-[#0F172A] py-0.5">
                            03
                          </span>
                          <div className="space-y-0.5">
                            <h5 className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                              Contact Officer
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              Have compliance concerns or wish to edit
                              reservation records? Directly address your
                              inquiries to the Desk Manager on WhatsApp
                              +66636368287 or email our regional operations.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="border-t border-[#0F172A]/10 bg-white p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Last updated: June 2026
                  </span>

                  <div className="flex items-center gap-2.5">
                    {activeTab === "controls" ? (
                      <button
                        id="btn-privacy-modal-save"
                        onClick={handleSaveCustom}
                        type="button"
                        className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-sans font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer rounded-xs"
                      >
                        Save Preferences
                      </button>
                    ) : (
                      <>
                        <button
                          id="btn-privacy-modal-essential"
                          onClick={() => {
                            handleAcceptEssential();
                            setShowModal(false);
                          }}
                          type="button"
                          className="px-4 py-2.5 border border-[#0F172A]/20 hover:border-[#0F172A]/40 text-slate-600 font-sans font-bold text-[10px] uppercase tracking-wider bg-transparent transition-all cursor-pointer rounded-xs"
                        >
                          Essential Only
                        </button>
                        <button
                          id="btn-privacy-modal-accept"
                          onClick={() => {
                            handleAcceptAll();
                            setShowModal(false);
                          }}
                          type="button"
                          className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-sans font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer rounded-xs shadow-xs"
                        >
                          Accept All Options
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Privacy Settings trigger on footer or corner of the screen */}
      <button
        id="trigger-privacy-widget-btn"
        onClick={() => {
          setActiveTab("disclosure");
          setShowModal(true);
        }}
        type="button"
        className="fixed bottom-4 right-4 z-40 p-2.5 bg-white hover:bg-slate-50 border border-[#0F172A]/15 text-[#0F172A] rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer focus:outline-hidden"
        title="Privacy & Cookie Consent Settings"
      >
        <Shield className="h-4.5 w-4.5" />
      </button>
    </>
  );
}
