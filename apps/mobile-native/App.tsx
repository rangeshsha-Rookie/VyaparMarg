import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "./src/lib/supabase";

type Language = "mr" | "hi" | "en";

type BusinessProfile = {
  id: string;
  business_name: string | null;
  business_type: string;
  state: string;
  district: string | null;
  annual_turnover_inr: number | null;
  category: string | null;
  gender: string | null;
  is_urban: boolean | null;
};

type SchemeRecommendation = {
  scheme_id: string;
  scheme_name: string;
  organization: string;
  eligibility_status: "eligible" | "ineligible" | "missing_information";
  matching_score: number;
  explanation: string;
  missing_fields: string[];
  max_benefit_amount_inr?: number;
  subsidy_percentage?: number;
  official_portal_url?: string;
  required_documents?: string[];
};

type ApplicationPlan = {
  id: string;
  scheme_id: string;
  scheme_name: string;
  status: "draft" | "document_collection" | "submitted" | "approved";
  required_documents: string[];
  completed_documents: string[];
};

type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
};

const defaultSchemes: SchemeRecommendation[] = [
  {
    scheme_id: "pmegp_2026",
    scheme_name: "Prime Minister's Employment Generation Programme (PMEGP)",
    organization: "KVIC / Khadi & Village Industries Commission",
    eligibility_status: "eligible",
    matching_score: 95,
    explanation: "Eligible for up to ₹50 Lakh loan with 25-35% capital subsidy for manufacturing & service micro-units in Maharashtra.",
    missing_fields: [],
    max_benefit_amount_inr: 5000000,
    subsidy_percentage: 35,
    official_portal_url: "https://www.kviconline.gov.in/pmegpeportal",
    required_documents: ["Udyam Registration", "Aadhaar Card", "PAN Card", "Project Report (DPR)", "Caste Certificate (if applicable)", "Bank Passbook"],
  },
  {
    scheme_name: "Chief Minister Employment Generation Programme (CMEGP Maharashtra)",
    scheme_id: "cmegp_mah_2026",
    organization: "Directorate of Industries, Govt. of Maharashtra",
    eligibility_status: "eligible",
    matching_score: 90,
    explanation: "Maharashtra state subsidy providing up to ₹50 Lakh for manufacturing and ₹10 Lakh for service micro-enterprises with 15-35% subsidy.",
    missing_fields: [],
    max_benefit_amount_inr: 5000000,
    subsidy_percentage: 35,
    official_portal_url: "https://mahadiscom.in/cmegp",
    required_documents: ["Maharashtra Domicile Certificate", "Udyam Certificate", "Aadhaar Card", "Project Proposal", "Educational Certificate"],
  },
  {
    scheme_name: "PM SVANidhi (Street Vendor Loan Scheme)",
    scheme_id: "pmsvanidhi_2026",
    organization: "Ministry of Housing and Urban Affairs",
    eligibility_status: "eligible",
    matching_score: 88,
    explanation: "Collateral-free working capital loan up to ₹50,000 with 7% interest subsidy and cashback on digital transactions.",
    missing_fields: [],
    max_benefit_amount_inr: 50000,
    subsidy_percentage: 7,
    official_portal_url: "https://pmsvanidhi.mohua.gov.in",
    required_documents: ["Vending Certificate / Urban Local Body Identity", "Aadhaar Card", "Bank Account linked to Mobile"],
  },
];

export default function App() {
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [email, setEmail] = useState("rangeshsha@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [language, setLanguage] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<"assistant" | "schemes" | "applications" | "profile">("assistant");

  const [profile, setProfile] = useState<BusinessProfile | null>({
    id: "demo-profile-1",
    business_name: "Gupta Agro & Retail Services",
    business_type: "Retail & Service Micro-Unit",
    state: "Maharashtra",
    district: "Thane",
    annual_turnover_inr: 1200000,
    category: "OBC",
    gender: "Male",
    is_urban: false,
  });

  const [schemes, setSchemes] = useState<SchemeRecommendation[]>(defaultSchemes);
  const [applications, setApplications] = useState<ApplicationPlan[]>([
    {
      id: "app-1",
      scheme_id: "pmegp_2026",
      scheme_name: "PMEGP Loan & Subsidy",
      status: "document_collection",
      required_documents: ["Udyam Registration", "Aadhaar Card", "Project Report (DPR)", "Bank Passbook"],
      completed_documents: ["Aadhaar Card", "Bank Passbook"],
    },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: "नमस्कार! I am VyaparMarg AI Assistant. Ask me about government loans, subsidies, or business growth in Maharashtra!",
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedScheme, setSelectedScheme] = useState<SchemeRecommendation | null>(null);

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.0.102:8000/api/v1";

  useEffect(() => {
    void checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSession({ access_token: data.session.access_token });
      await fetchProfile(data.session.access_token);
    }
  }

  async function fetchProfile(token: string) {
    try {
      const res = await fetch(`${apiBaseUrl}/business-profiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const list = await res.json();
        if (list.length > 0) setProfile(list[0]);
      }
    } catch {
      // Use local demo state if server offline
    }
  }

  async function handleSignIn() {
    setBusy(true);
    setStatusMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setStatusMessage(error?.message ?? "Sign in failed.");
        return;
      }
      setSession({ access_token: data.session.access_token });
      await fetchProfile(data.session.access_token);
    } catch {
      setStatusMessage("Could not connect to authentication server.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendMessage() {
    if (!inputText.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    const query = inputText.trim();
    setInputText("");

    // Simulate AI response & Backend API call
    setTimeout(() => {
      let reply = "Based on your Maharashtra micro-enterprise profile, you qualify for PMEGP (up to 35% subsidy) and CMEGP!";
      if (query.toLowerCase().includes("marathi") || language === "mr") {
        reply = "आपल्या व्यवसायासाठी PMEGP आणि CMEGP योजना उपलब्ध आहेत. तुम्हाला ३५% पर्यंत अनुदान (Subsidy) मिळू शकते!";
      } else if (query.toLowerCase().includes("document") || query.toLowerCase().includes("कागदपत्रੇ")) {
        reply = "Required documents: 1. Aadhaar Card 2. Udyam Registration 3. Project Report (DPR) 4. Bank Passbook.";
      }
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  }

  function handleSaveApplication(scheme: SchemeRecommendation) {
    const existing = applications.find((a) => a.scheme_id === scheme.scheme_id);
    if (!existing) {
      const newApp: ApplicationPlan = {
        id: `app-${Date.now()}`,
        scheme_id: scheme.scheme_id,
        scheme_name: scheme.scheme_name,
        status: "document_collection",
        required_documents: scheme.required_documents || ["Aadhaar", "Udyam Certificate", "Bank Passbook"],
        completed_documents: [],
      };
      setApplications([newApp, ...applications]);
    }
    setActiveTab("applications");
    setSelectedScheme(null);
  }

  function toggleDocument(appId: string, docName: string) {
    setApplications(
      applications.map((app) => {
        if (app.id !== appId) return app;
        const exists = app.completed_documents.includes(docName);
        const updated = exists
          ? app.completed_documents.filter((d) => d !== docName)
          : [...app.completed_documents, docName];
        return {
          ...app,
          completed_documents: updated,
          status: updated.length === app.required_documents.length ? "submitted" : "document_collection",
        };
      })
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <Text style={styles.logoText}>Vyapar<Text style={styles.logoAccent}>Marg</Text></Text>
          <Text style={styles.subText}>व्यापारमार्ग · MH</Text>
        </View>

        {/* Language Selector */}
        <View style={styles.langPicker}>
          {(["en", "mr", "hi"] as Language[]).map((lang) => (
            <Pressable
              key={lang}
              style={[styles.langChip, language === lang && styles.langChipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                {lang === "en" ? "EN" : lang === "mr" ? "मराठी" : "हिंदी"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Auth Screen (if not signed in) */}
      {!session && !profile ? (
        <ScrollView contentContainerStyle={styles.authContainer}>
          <View style={styles.heroBox}>
            <Text style={styles.heroBadge}>TECH4STARTUP · MAHARASHTRA</Text>
            <Text style={styles.heroTitle}>Rural Business Assistant</Text>
            <Text style={styles.heroSubtitle}>
              Discover government schemes, loan subsidies, and step-by-step document guidance in Marathi & Hindi.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Sign in to your Business Account</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Email address"
              placeholderTextColor="#89a0b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#89a0b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {statusMessage ? <Text style={styles.errorText}>{statusMessage}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={handleSignIn} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In & Continue</Text>}
            </Pressable>
            <Pressable
              style={styles.guestBtn}
              onPress={() =>
                setProfile({
                  id: "demo-guest",
                  business_name: "Gupta Agro & Retail Services",
                  business_type: "Micro Retail & Services",
                  state: "Maharashtra",
                  district: "Thane",
                  annual_turnover_inr: 1200000,
                  category: "OBC",
                  gender: "Male",
                  is_urban: false,
                })
              }
            >
              <Text style={styles.guestBtnText}>Try Demo Mode (Instant Access)</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        /* Main App Tabs */
        <View style={styles.mainContainer}>
          {/* TAB 1: AI ASSISTANT CHAT */}
          {activeTab === "assistant" && (
            <View style={styles.tabContent}>
              <View style={styles.bannerBox}>
                <Text style={styles.bannerTitle}>
                  {language === "mr" ? "🤖 एआय सहाय्यक (Marathi Voice & Chat)" : "🤖 Multilingual AI Assistant"}
                </Text>
                <Text style={styles.bannerSub}>
                  {language === "mr"
                    ? "तुमच्या व्यवसायासाठी सरकारी योजना, कर्ज आणि अनुदानाविषयी विचारा."
                    : "Ask about PMEGP, CMEGP loans, eligibility rules & document requirements."}
                </Text>
              </View>

              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatList}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.chatBubble,
                      item.sender === "user" ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chatText,
                        item.sender === "user" ? styles.userChatText : styles.assistantChatText,
                      ]}
                    >
                      {item.text}
                    </Text>
                    <Text style={styles.chatTime}>{item.timestamp}</Text>
                  </View>
                )}
              />

              {/* Chat Input Bar */}
              <View style={styles.chatInputBar}>
                <TextInput
                  style={styles.chatTextInput}
                  placeholder={
                    language === "mr"
                      ? "येथे प्रश्न विचारा (उदा. PMEGP कर्ज किती मिळेल?)"
                      : "Ask a question (e.g., What documents for PMEGP?)"
                  }
                  placeholderTextColor="#8aa0b8"
                  value={inputText}
                  onChangeText={setInputText}
                />
                <Pressable style={styles.sendBtn} onPress={handleSendMessage}>
                  <Text style={styles.sendBtnText}>Send</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* TAB 2: SCHEMES CATALOG */}
          {activeTab === "schemes" && (
            <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.sectionHeader}>Eligible Schemes for {profile?.business_name}</Text>
              <Text style={styles.sectionSub}>
                Verified against Maharashtra & Central Government eligibility rules.
              </Text>

              {schemes.map((scheme) => (
                <View key={scheme.scheme_id} style={styles.schemeCard}>
                  <View style={styles.schemeBadgeRow}>
                    <View style={styles.eligibleBadge}>
                      <Text style={styles.eligibleBadgeText}>
                        {scheme.matching_score}% MATCH · {scheme.eligibility_status.toUpperCase()}
                      </Text>
                    </View>
                    {scheme.subsidy_percentage ? (
                      <View style={styles.subsidyBadge}>
                        <Text style={styles.subsidyBadgeText}>{scheme.subsidy_percentage}% SUBSIDY</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.schemeTitle}>{scheme.scheme_name}</Text>
                  <Text style={styles.schemeOrg}>{scheme.organization}</Text>
                  <Text style={styles.schemeExplain}>{scheme.explanation}</Text>

                  {scheme.max_benefit_amount_inr ? (
                    <Text style={styles.benefitText}>
                      Maximum Loan / Benefit: ₹{(scheme.max_benefit_amount_inr / 100000).toFixed(1)} Lakh
                    </Text>
                  ) : null}

                  <View style={styles.schemeActionRow}>
                    <Pressable
                      style={styles.actionBtnOutline}
                      onPress={() => setSelectedScheme(scheme)}
                    >
                      <Text style={styles.actionBtnOutlineText}>View Details & Documents</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionBtnSolid}
                      onPress={() => handleSaveApplication(scheme)}
                    >
                      <Text style={styles.actionBtnSolidText}>Apply Plan</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* TAB 3: APPLICATIONS & DOCUMENT CHECKLIST */}
          {activeTab === "applications" && (
            <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.sectionHeader}>Saved Application Plans & Documents</Text>
              <Text style={styles.sectionSub}>
                Track required certificates and documents for official portals (MahaDBT / Aaple Sarkar).
              </Text>

              {applications.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No Active Application Plans</Text>
                  <Text style={styles.emptyText}>Go to Schemes tab and click "Apply Plan" to track your document checklist.</Text>
                </View>
              ) : (
                applications.map((app) => {
                  const progress = Math.round(
                    (app.completed_documents.length / app.required_documents.length) * 100
                  );
                  return (
                    <View key={app.id} style={styles.appCard}>
                      <View style={styles.appHeaderRow}>
                        <Text style={styles.appTitle}>{app.scheme_name}</Text>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>{app.status.replace("_", " ").toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>
                        Document Progress: {app.completed_documents.length} / {app.required_documents.length} ({progress}%)
                      </Text>

                      <Text style={styles.docSectionTitle}>Required Document Checklist:</Text>
                      {app.required_documents.map((doc) => {
                        const isDone = app.completed_documents.includes(doc);
                        return (
                          <Pressable
                            key={doc}
                            style={styles.checkRow}
                            onPress={() => toggleDocument(app.id, doc)}
                          >
                            <View style={[styles.checkBox, isDone && styles.checkBoxDone]}>
                              {isDone ? <Text style={styles.checkMark}>✓</Text> : null}
                            </View>
                            <Text style={[styles.checkLabel, isDone && styles.checkLabelDone]}>
                              {doc}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* TAB 4: BUSINESS PROFILE */}
          {activeTab === "profile" && (
            <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.sectionHeader}>Business & Entrepreneur Profile</Text>
              <Text style={styles.sectionSub}>Used for deterministic scheme eligibility scoring in Maharashtra.</Text>

              {profile ? (
                <View style={styles.profileCard}>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Business Name:</Text>
                    <Text style={styles.profileVal}>{profile.business_name}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Type / Industry:</Text>
                    <Text style={styles.profileVal}>{profile.business_type}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Location:</Text>
                    <Text style={styles.profileVal}>{profile.district}, {profile.state}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Annual Turnover:</Text>
                    <Text style={styles.profileVal}>₹{(profile.annual_turnover_inr! / 100000).toFixed(1)} Lakh / year</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Category / Gender:</Text>
                    <Text style={styles.profileVal}>{profile.category} · {profile.gender}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Region Classification:</Text>
                    <Text style={styles.profileVal}>{profile.is_urban ? "Urban" : "Rural / Semi-Urban"}</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}

          {/* Scheme Details Modal */}
          <Modal visible={!!selectedScheme} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {selectedScheme ? (
                  <>
                    <Text style={styles.modalTitle}>{selectedScheme.scheme_name}</Text>
                    <Text style={styles.modalOrg}>{selectedScheme.organization}</Text>
                    <Text style={styles.modalDesc}>{selectedScheme.explanation}</Text>

                    <Text style={styles.modalSectionHeading}>Required Documents:</Text>
                    {selectedScheme.required_documents?.map((d) => (
                      <Text key={d} style={styles.modalDocItem}>• {d}</Text>
                    ))}

                    <View style={styles.modalBtnRow}>
                      <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedScheme(null)}>
                        <Text style={styles.modalCloseBtnText}>Close</Text>
                      </Pressable>
                      <Pressable
                        style={styles.modalApplyBtn}
                        onPress={() => handleSaveApplication(selectedScheme)}
                      >
                        <Text style={styles.modalApplyBtnText}>Start Application Plan</Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          </Modal>

          {/* Bottom Navigation Bar */}
          <View style={styles.bottomNav}>
            <Pressable style={styles.navItem} onPress={() => setActiveTab("assistant")}>
              <Text style={[styles.navIcon, activeTab === "assistant" && styles.navIconActive]}>💬</Text>
              <Text style={[styles.navLabel, activeTab === "assistant" && styles.navLabelActive]}>Assistant</Text>
            </Pressable>
            <Pressable style={styles.navItem} onPress={() => setActiveTab("schemes")}>
              <Text style={[styles.navIcon, activeTab === "schemes" && styles.navIconActive]}>🎯</Text>
              <Text style={[styles.navLabel, activeTab === "schemes" && styles.navLabelActive]}>Schemes</Text>
            </Pressable>
            <Pressable style={styles.navItem} onPress={() => setActiveTab("applications")}>
              <Text style={[styles.navIcon, activeTab === "applications" && styles.navIconActive]}>📄</Text>
              <Text style={[styles.navLabel, activeTab === "applications" && styles.navLabelActive]}>Plans</Text>
            </Pressable>
            <Pressable style={styles.navItem} onPress={() => setActiveTab("profile")}>
              <Text style={[styles.navIcon, activeTab === "profile" && styles.navIconActive]}>👤</Text>
              <Text style={[styles.navLabel, activeTab === "profile" && styles.navLabelActive]}>Profile</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f2f6fb" },
  headerBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1eaf3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  logoText: { color: "#13498a", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  logoAccent: { color: "#e78322" },
  subText: { color: "#6a85a4", fontSize: 11, fontWeight: "700" },
  langPicker: { flexDirection: "row", backgroundColor: "#eef4fb", borderRadius: 20, padding: 3 },
  langChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16 },
  langChipActive: { backgroundColor: "#1760a8" },
  langText: { fontSize: 11, fontWeight: "700", color: "#54708d" },
  langTextActive: { color: "#ffffff" },

  authContainer: { padding: 24, justifyContent: "center", minHeight: "100%" },
  heroBox: { marginBottom: 24 },
  heroBadge: { color: "#e78322", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  heroTitle: { color: "#123963", fontSize: 30, fontWeight: "900", marginTop: 6, lineHeight: 36 },
  heroSubtitle: { color: "#54708d", fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: { backgroundColor: "#ffffff", borderRadius: 20, padding: 20, elevation: 3 },
  cardHeader: { color: "#123963", fontSize: 18, fontWeight: "800", marginBottom: 14 },
  textInput: { backgroundColor: "#f0f6fb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: "#123963", marginBottom: 12 },
  primaryBtn: { backgroundColor: "#1760a8", borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center", marginTop: 6 },
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  guestBtn: { alignItems: "center", marginTop: 14, paddingVertical: 10 },
  guestBtnText: { color: "#e78322", fontSize: 14, fontWeight: "700" },
  errorText: { color: "#d93838", fontSize: 13, marginBottom: 10 },

  mainContainer: { flex: 1 },
  tabContent: { flex: 1, padding: 16 },
  bannerBox: { backgroundColor: "#1760a8", borderRadius: 18, padding: 16, marginBottom: 14 },
  bannerTitle: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  bannerSub: { color: "#d5e5f5", fontSize: 13, lineHeight: 18, marginTop: 4 },

  chatList: { paddingBottom: 16 },
  chatBubble: { borderRadius: 16, padding: 14, marginBottom: 10, maxWidth: "84%" },
  userBubble: { backgroundColor: "#1760a8", alignSelf: "flex-end", borderBottomRightRadius: 2 },
  assistantBubble: { backgroundColor: "#ffffff", alignSelf: "flex-start", borderBottomLeftRadius: 2, borderWidth: 1, borderColor: "#e1eaf3" },
  chatText: { fontSize: 15, lineHeight: 21 },
  userChatText: { color: "#ffffff" },
  assistantChatText: { color: "#123963" },
  chatTime: { fontSize: 10, color: "#8aa0b8", marginTop: 4, textAlign: "right" },

  chatInputBar: { flexDirection: "row", gap: 10, paddingVertical: 10 },
  chatTextInput: { flex: 1, backgroundColor: "#ffffff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: "#dbe6f2", color: "#123963" },
  sendBtn: { backgroundColor: "#e78322", borderRadius: 14, paddingHorizontal: 20, justifyContent: "center", alignItems: "center" },
  sendBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },

  sectionHeader: { color: "#123963", fontSize: 20, fontWeight: "800" },
  sectionSub: { color: "#54708d", fontSize: 13, marginBottom: 14, marginTop: 2 },
  schemeCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#e1eaf3" },
  schemeBadgeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  eligibleBadge: { backgroundColor: "#e4f4e9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  eligibleBadgeText: { color: "#227344", fontSize: 11, fontWeight: "800" },
  subsidyBadge: { backgroundColor: "#fff2e5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subsidyBadgeText: { color: "#d96b00", fontSize: 11, fontWeight: "800" },
  schemeTitle: { color: "#123963", fontSize: 18, fontWeight: "800" },
  schemeOrg: { color: "#6a85a4", fontSize: 13, marginTop: 2, marginBottom: 8 },
  schemeExplain: { color: "#3a5675", fontSize: 14, lineHeight: 20 },
  benefitText: { color: "#1760a8", fontSize: 14, fontWeight: "800", marginTop: 10 },
  schemeActionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtnOutline: { flex: 1, borderColor: "#1760a8", borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  actionBtnOutlineText: { color: "#1760a8", fontSize: 13, fontWeight: "800" },
  actionBtnSolid: { backgroundColor: "#e78322", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, justifyContent: "center" },
  actionBtnSolidText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },

  appCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#e1eaf3" },
  appHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  appTitle: { color: "#123963", fontSize: 17, fontWeight: "800", flex: 1 },
  statusPill: { backgroundColor: "#eaf2fb", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { color: "#1760a8", fontSize: 11, fontWeight: "800" },
  progressTrack: { height: 8, backgroundColor: "#eef4fb", borderRadius: 4, marginTop: 14, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#1760a8" },
  progressText: { color: "#54708d", fontSize: 12, marginTop: 6, fontWeight: "700" },
  docSectionTitle: { color: "#123963", fontSize: 14, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#a2b7cf", justifyContent: "center", alignItems: "center" },
  checkBoxDone: { backgroundColor: "#1760a8", borderColor: "#1760a8" },
  checkMark: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  checkLabel: { color: "#355575", fontSize: 14 },
  checkLabelDone: { color: "#a2b7cf", textDecorationLine: "line-through" },

  emptyCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 24, alignItems: "center" },
  emptyTitle: { color: "#123963", fontSize: 18, fontWeight: "800" },
  emptyText: { color: "#54708d", fontSize: 14, textAlign: "center", marginTop: 6 },

  profileCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "#e1eaf3" },
  profileRow: { borderBottomWidth: 1, borderBottomColor: "#f0f6fb", paddingVertical: 12 },
  profileLabel: { color: "#6a85a4", fontSize: 13 },
  profileVal: { color: "#123963", fontSize: 16, fontWeight: "800", marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalTitle: { color: "#123963", fontSize: 20, fontWeight: "800" },
  modalOrg: { color: "#6a85a4", fontSize: 14, marginTop: 2, marginBottom: 12 },
  modalDesc: { color: "#355575", fontSize: 15, lineHeight: 22 },
  modalSectionHeading: { color: "#123963", fontSize: 15, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  modalDocItem: { color: "#54708d", fontSize: 14, lineHeight: 20 },
  modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalCloseBtn: { flex: 1, borderColor: "#a2b7cf", borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  modalCloseBtnText: { color: "#54708d", fontSize: 15, fontWeight: "800" },
  modalApplyBtn: { flex: 1, backgroundColor: "#e78322", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  modalApplyBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },

  bottomNav: { flexDirection: "row", backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#e1eaf3", paddingVertical: 8 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navIcon: { fontSize: 20, color: "#8aa0b8" },
  navIconActive: { color: "#1760a8" },
  navLabel: { fontSize: 11, fontWeight: "700", color: "#8aa0b8", marginTop: 2 },
  navLabelActive: { color: "#1760a8" },
});
