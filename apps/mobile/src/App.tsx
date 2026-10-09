import { FormEvent, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { createApplication, getApplications, getProfiles, getRecommendations, sendAssistantMessage, Application, BusinessProfile, SchemeRecommendation } from "./lib/api";

type Tab = "assistant" | "profile" | "applications";

export function App() {
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("assistant");
  const [loading, setLoading] = useState(false);

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
        if (selected) return getRecommendations(session.access_token, selected.id);
        return [];
      })
      .then(setRecommendations)
      .then(() => getApplications(session.access_token))
      .then(setApplications)
      .catch(() => setLoginError("Could not load your business profile. Is the API running?"))
      .finally(() => setLoading(false));
  }, [session]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    if (!supabase) {
      setLoginError("Add the mobile Supabase values to apps/mobile/.env first.");
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setLoginError(error?.message ?? "Could not sign in.");
      return;
    }
    setSession({ access_token: data.session.access_token });
  }

  async function askAssistant(event: FormEvent) {
    event.preventDefault();
    if (!session || !profile || !message.trim()) return;
    setLoading(true);
    try {
      const result = await sendAssistantMessage(session.access_token, profile.id, message.trim());
      setAssistantReply(result.assistant_message);
      setRecommendations(result.recommendations);
      setMessage("");
    } catch {
      setLoginError("The assistant could not process that request.");
    } finally {
      setLoading(false);
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
          <h1>Build your next step with confidence.</h1>
          <p className="auth-copy">Ask about schemes, understand eligibility, and keep your business profile in one place.</p>
          <form onSubmit={signIn} className="auth-form">
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {loginError && <p className="error">{loginError}</p>}
            <button className="primary-button" type="submit">Continue</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header className="topbar"><div className="brand"><span>Vyapar</span><strong>Marg</strong></div><button className="icon-button" aria-label="Notifications">♧</button></header>
      <section className="greeting"><h1>Good morning, Rangesh <span aria-hidden="true">☀</span></h1><p>What do you want to do today?</p></section>
      <form className="ask-box" onSubmit={askAssistant}>
        <button type="button" className="mic-button" aria-label="Voice input">●</button>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask in Marathi, Hindi, Hinglish, or English" />
        <button type="submit" className="send-button" aria-label="Send question">➤</button>
      </form>
      {assistantReply && <div className="assistant-reply"><span>VyaparMarg</span><p>{assistantReply}</p></div>}
      {profile && <button className="profile-card" onClick={() => setActiveTab("profile")}><div className="profile-icon">◒</div><div><strong>{profile.business_name ?? "Your business"}</strong><span>{profile.state} · {profile.business_type}</span></div><b>›</b></button>}
      {activeTab === "assistant" && <section className="recommendations"><div className="section-heading"><h2>Recommended for you</h2><span>{loading ? "Loading" : `${recommendations.length} matches`}</span></div>{recommendations.map((item) => <button className={`scheme-card ${item.eligibility_status}`} key={item.scheme_id} onClick={() => planApplication(item.scheme_id)}><div className="scheme-mark">{item.scheme.slug === "pmfme" ? "▣" : "✦"}</div><div className="scheme-copy"><strong>{item.scheme.slug.toUpperCase()}</strong><p>{applications.some((application) => application.scheme_id === item.scheme_id && application.status !== "abandoned") ? "Saved to applications" : item.eligibility_status === "eligible" ? "A strong match for your current profile" : item.eligibility_status === "needs_information" ? "More information needed" : "Not a current match"}</p></div><span className="status-mark">{applications.some((application) => application.scheme_id === item.scheme_id && application.status !== "abandoned") ? "✓" : "›"}</span></button>)}</section>}
      {activeTab === "profile" && <section className="recommendations"><div className="section-heading"><h2>Business profile</h2></div>{profile && <div className="assistant-reply"><strong>{profile.business_name ?? "Your business"}</strong><p>{profile.state} · {profile.business_type}</p></div>}</section>}
      {activeTab === "applications" && <section className="recommendations"><div className="section-heading"><h2>Applications</h2><span>{applications.length} saved</span></div>{applications.length === 0 ? <p className="auth-copy">Choose a recommended scheme to start an application plan.</p> : applications.map((application) => <a className="scheme-card" key={application.id} href={application.portal_url} target="_blank" rel="noreferrer"><div className="scheme-mark">▤</div><div className="scheme-copy"><strong>{recommendations.find((item) => item.scheme_id === application.scheme_id)?.scheme.slug.toUpperCase() ?? "Scheme"}</strong><p>{application.status.replace("_", " ")} · Open official portal</p></div><span className="status-mark">›</span></a>)}</section>}
      {loginError && <p className="error page-error">{loginError}</p>}
      <nav className="bottom-nav" aria-label="Primary navigation">{(["assistant", "profile", "applications"] as Tab[]).map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)}><span>{tab === "assistant" ? "●" : tab === "profile" ? "●" : "▤"}</span>{tab[0].toUpperCase() + tab.slice(1)}</button>)}</nav>
    </main>
  );
}
