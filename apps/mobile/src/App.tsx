import { FormEvent, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  createApplication,
  createProfile,
  getApplications,
  getProfiles,
  getRecommendations,
  getMarketplaces,
  getDigitalTools,
  getPortals,
  getLogisticsQuote,
  getGrowthDashboard,
  sendAssistantMessage,
  updateApplication,
  updateProfile,
  Application,
  BusinessProfile,
  BusinessProfileInput,
  DigitalTool,
  GrowthDashboard,
  LogisticsQuote,
  Marketplace,
  PortalGuide,
  SchemeRecommendation,
} from "./lib/api";

type Tab =
  | "assistant"
  | "schemes"
  | "marketplaces"
  | "tools"
  | "portals"
  | "logistics"
  | "dashboard"
  | "applications"
  | "profile";

export function App() {
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [digitalTools, setDigitalTools] = useState<DigitalTool[]>([]);
  const [portals, setPortals] = useState<PortalGuide[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<PortalGuide | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [language, setLanguage] = useState<"mr" | "hi" | "en">("mr");
  const [activeTab, setActiveTab] = useState<Tab>("assistant");
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Student 2: Logistics state
  const [logisticsOrigin, setLogisticsOrigin] = useState("Kolhapur");
  const [logisticsDest, setLogisticsDest] = useState("Pune");
  const [logisticsWeight, setLogisticsWeight] = useState(150);
  const [logisticsResult, setLogisticsResult] = useState<LogisticsQuote | null>(null);

  // Student 3: Growth Dashboard state
  const [growthData, setGrowthData] = useState<GrowthDashboard | null>(null);

  const [profileDraft, setProfileDraft] = useState<BusinessProfileInput>({
    business_name: "",
    business_type: "",
    state: "Maharashtra",
    district: "",
    annual_turnover: 1500000,
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession({ access_token: data.session.access_token });
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getProfiles(session.access_token)
      .then((profiles) => {
        const selected = profiles[0] ?? null;
        setProfile(selected);
        if (selected) {
          getRecommendations(session.access_token, selected.id).then(setRecommendations);
          getGrowthDashboard(session.access_token, selected.id).then(setGrowthData).catch(() => {});
        }
        return [];
      })
      .then(() => getApplications(session.access_token))
      .then(setApplications)
      .then(() => getMarketplaces(session.access_token))
      .then(setMarketplaces)
      .then(() => getDigitalTools(session.access_token))
      .then(setDigitalTools)
      .then(() => getPortals(session.access_token))
      .then((data) => {
        setPortals(data);
        if (data.length > 0) setSelectedPortal(data[0]);
      })
      .catch(() => setLoginError("Could not connect to FastAPI server. Please ensure backend is running."))
      .finally(() => setLoading(false));
  }, [session]);

  function speakText(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    if (!supabase) {
      setLoginError("Add the mobile Supabase values to apps/mobile/.env first.");
      return;
    }
    const authResult =
      authMode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    const { data, error } = authResult;
    if (authMode === "signup") {
      if (error) {
        setLoginError(error.message);
        return;
      }
      if (!data.session) {
        setLoginError("Account created. Check your email to confirm it, then sign in.");
        setAuthMode("signin");
        return;
      }
    }
    if (error || !data.session) {
      setLoginError(error?.message ?? "Could not sign in.");
      return;
    }
    setSession({ access_token: data.session.access_token });
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
    setProfile(null);
    setRecommendations([]);
    setApplications([]);
  }

  function openProfileEditor() {
    setProfileDraft({
      business_name: profile?.business_name ?? "",
      business_type: profile?.business_type ?? "",
      state: profile?.state ?? "Maharashtra",
      district: profile?.district ?? "",
      annual_turnover: profile?.annual_turnover ?? 1500000,
    });
    setProfileEditorOpen(true);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setLoading(true);
    try {
      const saved = profile
        ? await updateProfile(session.access_token, profile.id, profileDraft)
        : await createProfile(session.access_token, profileDraft);
      setProfile(saved);
      setProfileEditorOpen(false);
      const matches = await getRecommendations(session.access_token, saved.id);
      setRecommendations(matches);
    } catch {
      setLoginError("Could not save your business profile.");
    } finally {
      setLoading(false);
    }
  }

  async function askAssistant(event: FormEvent) {
    event.preventDefault();
    if (!session || !profile || !message.trim()) return;
    setLoading(true);
    try {
      const result = await sendAssistantMessage(session.access_token, profile.id, message.trim(), language);
      setAssistantReply(result.assistant_message);
      setRecommendations(result.recommendations);
      speakText(result.assistant_message);
      setMessage("");
    } catch {
      setLoginError("The assistant could not process that request.");
    } finally {
      setLoading(false);
    }
  }

  async function calculateLogistics() {
    if (!session) return;
    try {
      const quote = await getLogisticsQuote(session.access_token, logisticsOrigin, logisticsDest, logisticsWeight);
      setLogisticsResult(quote);
    } catch {
      setLoginError("Could not calculate logistics quote.");
    }
  }

  async function planApplication(schemeId: string) {
    if (!session || !profile) return;
    setLoading(true);
    try {
      const existing = applications.find((item) => item.scheme_id === schemeId && item.status !== "abandoned");
      if (!existing) {
        const created = await createApplication(session.access_token, profile.id, schemeId);
        setApplications((current) => [created, ...current]);
      }
      setActiveTab("applications");
    } catch {
      setLoginError("Could not save this application plan.");
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand"><span>Vyapar</span><strong>Marg</strong></div>
          <p className="auth-kicker">Your rural business companion</p>
          <h1>Build your rural business with confidence.</h1>
          <p className="auth-copy">AI & rule-based discovery for Maharashtra government schemes, ONDC, and digital tools.</p>
          <form onSubmit={signIn} className="auth-form">
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {loginError && <p className="error">{loginError}</p>}
            <button className="primary-button" type="submit">
              {authMode === "signup" ? "Create account" : "Continue"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setLoginError("");
                setAuthMode(authMode === "signup" ? "signin" : "signup");
              }}
            >
              {authMode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header className="topbar">
        <div className="brand"><span>Vyapar</span><strong>Marg</strong></div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            style={{ fontSize: "12px", padding: "4px", borderRadius: "4px" }}
          >
            <option value="mr">मराठी (MR)</option>
            <option value="hi">हिंदी (HI)</option>
            <option value="en">English (EN)</option>
          </select>
          <button className="icon-button" aria-label="Sign out" onClick={signOut}>↪</button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "10px 16px", background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        {[
          { key: "assistant", label: "🤖 AI Assistant" },
          { key: "schemes", label: "🏛️ Schemes" },
          { key: "marketplaces", label: "🛒 Markets" },
          { key: "tools", label: "📱 Tools" },
          { key: "portals", label: "🌐 Portals" },
          { key: "logistics", label: "🚚 Logistics" },
          { key: "dashboard", label: "📊 Growth" },
          { key: "applications", label: "📋 Applications" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as Tab)}
            style={{
              padding: "6px 12px",
              borderRadius: "16px",
              border: activeTab === t.key ? "1px solid #0f766e" : "1px solid #cbd5e1",
              background: activeTab === t.key ? "#0f766e" : "#f8fafc",
              color: activeTab === t.key ? "#ffffff" : "#334155",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        {/* TAB 1: AI ASSISTANT */}
        {activeTab === "assistant" && (
          <div>
            <section className="greeting">
              <h1>
                {language === "mr" ? "नमस्कार! मी व्यापारमार्ग सहाय्यक आहे" : "Welcome to VyaparMarg Assistant"}
              </h1>
              <p>
                {language === "mr"
                  ? "मराठी किंवा हिंदीत योजना, कर्ज, ३५% अनुदान आणि कागदपत्रांबद्दल विचारा."
                  : "Ask about PMEGP, CMEGP, 35% subsidies, or document requirements."}
              </p>
            </section>
            <form className="ask-box" onSubmit={askAssistant}>
              <button
                type="button"
                className="mic-button"
                aria-label="Voice input"
                onClick={() => {
                  setMessage("माझा कोल्हापुरात गुळाचा कारखाना आहे, वार्षिक टर्नओव्हर २५ लाख आहे, कोणती योजना मिळेल?");
                }}
              >
                🎙️
              </button>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="उदा. PMEGP ३५% अनुदान किंवा CMEGP योजना पात्रता..."
              />
              <button type="submit" className="send-button" aria-label="Send question">➤</button>
            </form>
            {assistantReply && (
              <div className="assistant-reply" style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>VyaparMarg Multilingual AI</span>
                  <button
                    onClick={() => speakText(assistantReply)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                  >
                    {isSpeaking ? "🔊 बोलत आहे..." : "🔈 ऐका (Listen)"}
                  </button>
                </div>
                <p style={{ marginTop: "6px", lineHeight: "1.5" }}>{assistantReply}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEMES */}
        {activeTab === "schemes" && (
          <section className="recommendations">
            <div className="section-heading">
              <h2>Verified Maharashtra & Central Schemes</h2>
              <span>{recommendations.length} matches</span>
            </div>
            {recommendations.map((item) => (
              <div className={`scheme-card ${item.eligibility_status}`} key={item.scheme_id} style={{ marginBottom: "12px", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "14px", color: "#0f766e" }}>{item.scheme.name}</strong>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", background: item.eligibility_status === "eligible" ? "#dcfce7" : "#fef3c7", color: item.eligibility_status === "eligible" ? "#166534" : "#92400e", borderRadius: "4px" }}>
                    {item.eligibility_status.toUpperCase()} ({Math.round((item.score || 0.8) * 100)}%)
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#475569", marginBottom: "8px" }}>{item.scheme.short_description}</p>
                <div style={{ fontSize: "11px", color: "#0f766e", marginBottom: "10px" }}>
                  {item.reasons.join(" • ")}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="primary-button"
                    onClick={() => planApplication(item.scheme_id)}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    + Add to Application Plan
                  </button>
                  <a
                    href={item.scheme.official_portal_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "6px 12px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px", textDecoration: "none", color: "#334155" }}
                  >
                    Official Portal ↗
                  </a>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* TAB 3: MARKETPLACES */}
        {activeTab === "marketplaces" && (
          <section className="recommendations">
            <div className="section-heading"><h2>Recommended Marketplaces</h2></div>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>Sell beyond your taluka with open networks and government procurement portals.</p>
            {marketplaces.map((m) => (
              <div key={m.id} style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "14px" }}>{m.name}</strong>
                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>{m.commission_model}</span>
                </div>
                <p style={{ fontSize: "12px", color: "#475569", margin: "6px 0" }}>{m.description}</p>
                <a href={m.onboarding_url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#0f766e", fontWeight: 600 }}>Start Onboarding ↗</a>
              </div>
            ))}
          </section>
        )}

        {/* TAB 4: DIGITAL TOOLS */}
        {activeTab === "tools" && (
          <section className="recommendations">
            <div className="section-heading"><h2>Digital Business Tools</h2></div>
            {digitalTools.map((t) => (
              <div key={t.id} style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: "14px" }}>{t.name}</strong>
                  <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{t.pricing_tier}</span>
                </div>
                <p style={{ fontSize: "12px", color: "#475569", margin: "6px 0" }}>{t.best_for}</p>
                <a href={t.official_url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#0f766e", fontWeight: 600 }}>Get Tool ↗</a>
              </div>
            ))}
          </section>
        )}

        {/* TAB 5: PORTALS GUIDANCE */}
        {activeTab === "portals" && (
          <section className="recommendations">
            <div className="section-heading"><h2>Government Portal Step-by-Step Guides</h2></div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {portals.map((p) => (
                <button
                  key={p.portal_slug}
                  onClick={() => setSelectedPortal(p)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: selectedPortal?.portal_slug === p.portal_slug ? "2px solid #0f766e" : "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {p.portal_name}
                </button>
              ))}
            </div>
            {selectedPortal && (
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "15px", marginBottom: "4px" }}>{selectedPortal.portal_name}</h3>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>{selectedPortal.description}</p>
                <ol style={{ paddingLeft: "18px", fontSize: "12px", lineHeight: "1.7", color: "#334155" }}>
                  {selectedPortal.steps.map((s) => (
                    <li key={s.step_number} style={{ marginBottom: "8px" }}>
                      <strong>{s.title}:</strong> {s.description}
                      {s.tip && <div style={{ color: "#0f766e", fontSize: "11px", fontWeight: 600 }}>💡 {s.tip}</div>}
                    </li>
                  ))}
                </ol>
                <a href={selectedPortal.official_url} target="_blank" rel="noreferrer" className="primary-button" style={{ display: "inline-block", marginTop: "12px", textDecoration: "none", textAlign: "center" }}>Open Official Portal ↗</a>
              </div>
            )}
          </section>
        )}

        {/* TAB 6: LOGISTICS (Student 2 Contract) */}
        {activeTab === "logistics" && (
          <section className="recommendations">
            <div className="section-heading"><h2>Rural Logistics Planner (Student 2: Shivam)</h2></div>
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Origin District</label>
                  <input value={logisticsOrigin} onChange={(e) => setLogisticsOrigin(e.target.value)} style={{ width: "100%", padding: "6px", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Destination</label>
                  <input value={logisticsDest} onChange={(e) => setLogisticsDest(e.target.value)} style={{ width: "100%", padding: "6px", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Weight (kg)</label>
                  <input type="number" value={logisticsWeight} onChange={(e) => setLogisticsWeight(Number(e.target.value))} style={{ width: "100%", padding: "6px", fontSize: "12px" }} />
                </div>
              </div>
              <button className="primary-button" onClick={calculateLogistics}>Calculate Freight Rates</button>

              {logisticsResult && (
                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontSize: "13px", marginBottom: "8px" }}>Available Rural Transport Options:</h4>
                  {logisticsResult.available_carriers.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div>
                        <strong>{c.carrier_name}</strong> ({c.vehicle_type})
                        <div style={{ fontSize: "11px", color: "#64748b" }}>~{c.estimated_delivery_hours} hrs delivery • {c.best_for}</div>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#ea580c" }}>₹{c.estimated_cost_inr}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 7: GROWTH DASHBOARD (Student 3 Contract) */}
        {activeTab === "dashboard" && (
          <section className="recommendations">
            <div className="section-heading"><h2>Rural Growth Dashboard (Student 3: Shruti)</h2></div>
            {growthData && (
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", background: "#f0fdf4", padding: "12px", borderRadius: "6px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#166534", fontWeight: 700 }}>Digital Readiness Score</div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#166534" }}>{growthData.digital_readiness_score} / 100</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#9a3412", fontWeight: 700 }}>Potential Subsidy Pipeline</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#c2410c" }}>₹{growthData.potential_subsidy_inr.toLocaleString()}</div>
                  </div>
                </div>
                <h4 style={{ fontSize: "13px", marginBottom: "6px" }}>Actionable Business Suggestions:</h4>
                <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "#334155", lineHeight: "1.6" }}>
                  {growthData.suggested_actions.map((act, i) => <li key={i}>{act}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* TAB 8: APPLICATIONS */}
        {activeTab === "applications" && (
          <section className="recommendations">
            <div className="section-heading"><h2>Saved Applications ({applications.length})</h2></div>
            {applications.map((app) => (
              <div key={app.id} style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong>{app.portal_url}</strong>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", background: "#fef3c7", borderRadius: "4px" }}>{app.status}</span>
                </div>
                <select
                  value={app.status}
                  onChange={async (e) => {
                    if (!session) return;
                    const updated = await updateApplication(session.access_token, app.id, e.target.value as any);
                    setApplications((curr) => curr.map((x) => x.id === updated.id ? updated : x));
                  }}
                  style={{ fontSize: "12px", padding: "4px", borderRadius: "4px" }}
                >
                  {["planned", "started", "in_progress", "submitted", "completed", "abandoned"].map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Profile Edit Modal */}
      {profileEditorOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setProfileEditorOpen(false);
        }}>
          <form className="profile-modal" onSubmit={saveProfile}>
            <div className="section-heading">
              <h2>{profile ? "Edit Business Profile" : "Create Business Profile"}</h2>
              <button className="text-button" type="button" onClick={() => setProfileEditorOpen(false)}>Close</button>
            </div>
            <label>Business Name<input value={profileDraft.business_name} onChange={(e) => setProfileDraft({ ...profileDraft, business_name: e.target.value })} required /></label>
            <label>Business Type
              <select value={profileDraft.business_type} onChange={(e) => setProfileDraft({ ...profileDraft, business_type: e.target.value })} required>
                <option value="">Select Type</option>
                {["manufacturing", "service", "retail", "dairy", "food_processing", "agro_processing", "textile"].map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </label>
            <label>State<input value={profileDraft.state} onChange={(e) => setProfileDraft({ ...profileDraft, state: e.target.value })} required /></label>
            <label>District<input value={profileDraft.district} onChange={(e) => setProfileDraft({ ...profileDraft, district: e.target.value })} required /></label>
            <label>Annual Turnover (INR)<input type="number" value={profileDraft.annual_turnover} onChange={(e) => setProfileDraft({ ...profileDraft, annual_turnover: Number(e.target.value) })} /></label>
            <button className="primary-button" type="submit" disabled={loading}>{loading ? "Saving..." : "Save Profile"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
