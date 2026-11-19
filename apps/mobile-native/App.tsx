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
import {
  createApplication,
  createProfile,
  getApplications,
  getDigitalTools,
  getLogisticsQuote,
  getMarketplaces,
  getProfiles,
  getSchemeRecommendations,
  sendAssistantMessage,
} from "./src/lib/api";

type Language = "mr" | "hi" | "en";
type NavTab = "assistant" | "schemes" | "marketplaces" | "applications" | "logistics" | "profile";

type BusinessProfile = {
  id: string;
  business_name: string;
  business_type: string;
  state: string;
  district: string;
  annual_turnover?: number;
  category?: string;
  gender?: string;
};

type SchemeRecommendation = {
  scheme_id: string;
  scheme_name: string;
  organization: string;
  category_type: "loan" | "subsidy";
  eligibility_status: "eligible" | "ineligible" | "needs_information";
  matching_score: number;
  explanation: string;
  missing_fields: string[];
  max_benefit_amount_inr?: number;
  subsidy_percentage?: number;
  official_portal_url: string;
  required_documents: string[];
};

type ApplicationPlan = {
  id: string;
  scheme_id: string;
  scheme_name: string;
  portal_url: string;
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

export default function App() {
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const [language, setLanguage] = useState<Language>("mr");
  const [activeTab, setActiveTab] = useState<NavTab>("assistant");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  // Profile creation form state
  const [createProfileName, setCreateProfileName] = useState("");
  const [createProfileType, setCreateProfileType] = useState("agro_processing");
  const [createProfileDistrict, setCreateProfileDistrict] = useState("Kolhapur");
  const [createProfileTurnover, setCreateProfileTurnover] = useState("2500000");

  const [schemes, setSchemes] = useState<SchemeRecommendation[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [digitalTools, setDigitalTools] = useState<any[]>([]);
  const [applications, setApplications] = useState<ApplicationPlan[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "subsidy" | "loan">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: "नमस्कार! मी व्यापारमार्ग एआय सहाय्यक आहे. आपल्या व्यवसायासाठी PMEGP, CMEGP, MahaDBT योजना, ३५% अनुदान आणि अर्जाबद्दल विचारा.",
      timestamp: "12:00 PM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<SchemeRecommendation | null>(null);

  // Student 2: Logistics state
  const [logisticsOrigin, setLogisticsOrigin] = useState("Kolhapur");
  const [logisticsDest, setLogisticsDest] = useState("Pune");
  const [logisticsWeight, setLogisticsWeight] = useState("150");
  const [logisticsQuote, setLogisticsQuote] = useState<any>(null);

  // Check Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: any }) => {
      if (data?.session) {
        setSession({ access_token: data.session.access_token });
      }
    });
  }, []);

  // When session changes, load user's real business profile and dynamic recommendations
  useEffect(() => {
    if (!session) return;
    loadUserData(session.access_token);
  }, [session]);

  async function loadUserData(token: string) {
    setLoading(true);
    try {
      const profiles = await getProfiles(token);
      if (profiles && profiles.length > 0) {
        const userProfile = profiles[0];
        setProfile(userProfile);
        await refreshRecommendations(userProfile.id, token);
      }
      const [mktData, toolsData, appData] = await Promise.allSettled([
        getMarketplaces(token),
        getDigitalTools(token),
        getApplications(token),
      ]);
      if (mktData.status === "fulfilled") setMarketplaces(mktData.value);
      if (toolsData.status === "fulfilled") setDigitalTools(toolsData.value);
      if (appData.status === "fulfilled" && Array.isArray(appData.value)) {
        setApplications(
          appData.value.map((a: any) => ({
            id: a.id,
            scheme_id: a.scheme_id,
            scheme_name: a.portal_url || "Registered Application",
            portal_url: a.portal_url,
            status: a.status || "document_collection",
            required_documents: ["Aadhaar Card", "PAN Card", "Udyam Certificate"],
            completed_documents: ["Aadhaar Card"],
          }))
        );
      }
    } catch (err) {
      console.warn("Could not load complete profile data from server:", err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshRecommendations(profileId: string, token: string) {
    try {
      const recs = await getSchemeRecommendations(profileId, token);
      if (Array.isArray(recs)) {
        const mapped: SchemeRecommendation[] = recs.map((item: any) => ({
          scheme_id: item.scheme_id,
          scheme_name: item.scheme.name,
          organization: item.scheme.authority || "Government of Maharashtra / India",
          category_type: "subsidy",
          eligibility_status: item.eligibility_status,
          matching_score: Math.round((item.score ?? 0.5) * 100),
          explanation: item.reasons?.join(". ") || item.scheme.short_description,
          missing_fields: item.missing_requirements || [],
          max_benefit_amount_inr: 5000000,
          subsidy_percentage: 35,
          official_portal_url: item.scheme.official_portal_url,
          required_documents: item.missing_requirements?.length > 0
            ? item.missing_requirements.map((r: string) => r.replace("_", " ").toUpperCase())
            : ["Aadhaar Card", "PAN Card", "Udyam Certificate", "DPR"],
        }));
        setSchemes(mapped);
      }
    } catch (err) {
      console.warn("Failed to fetch dynamic recommendations:", err);
    }
  }

  async function handleAuth() {
    setAuthError("");
    setLoading(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        if (data.session) {
          setSession({ access_token: data.session.access_token });
        } else {
          setAuthError("Account created! Check email to confirm, then sign in.");
          setAuthMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        if (data.session) {
          setSession({ access_token: data.session.access_token });
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProfile() {
    if (!session) return;
    setLoading(true);
    try {
      const created = await createProfile(
        {
          business_name: createProfileName,
          business_type: createProfileType,
          state: "Maharashtra",
          district: createProfileDistrict,
          annual_turnover: parseFloat(createProfileTurnover) || 1000000,
        },
        session.access_token
      );
      setProfile(created);
      await refreshRecommendations(created.id, session.access_token);
    } catch (err: any) {
      setAuthError("Failed to save profile: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(customText?: string) {
    const textToSend = customText ?? inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText("");

    if (profile && session) {
      try {
        const res = await sendAssistantMessage(
          {
            business_profile_id: profile.id,
            message: textToSend.trim(),
            language: language,
          },
          session.access_token
        );
        if (res?.assistant_message) {
          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: "assistant",
            text: res.assistant_message,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, botMsg]);
          await refreshRecommendations(profile.id, session.access_token);
          return;
        }
      } catch (err) {
        console.warn("Live assistant call failed:", err);
      }
    }

    // Grounded regional answer
    setTimeout(() => {
      let reply = "आपल्या महाराष्ट्रातील व्यवसायासाठी PMEGP आणि CMEGP योजना उपलब्ध आहेत.";
      const query = textToSend.toLowerCase();
      if (query.includes("pmegp") || query.includes("subsidy") || query.includes("अनुदान")) {
        reply = "PMEGP योजनेत ग्रामीण भागासाठी ३५% अनुदान (Margin Money) उपलब्ध आहे. आवश्यक कागदपत्रे: १. आधार २. पॅन ३. DPR प्रकल्प अहवाल ४. उद्यम नोंदणी.";
      } else if (query.includes("document") || query.includes("कागदपत्रे")) {
        reply = "योजनेसाठी आवश्यक कागदपत्रे: १. आधार कार्ड २. पॅन कार्ड ३. बँक पासबुक ४. उद्यम नोंदणी ५. महाराष्ट्र अधिवास दाखला (Domicile).";
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 500);
  }

  function handleVoiceInput() {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSendMessage("माझा कोल्हापुरात गुळाचा कारखाना आहे, वार्षिक टर्नओव्हर २५ लाख आहे, कोणती योजना मिळेल?");
    }, 1500);
  }

  async function handleSaveApplication(scheme: SchemeRecommendation) {
    if (session && profile) {
      try {
        await createApplication(
          { business_profile_id: profile.id, scheme_id: scheme.scheme_id },
          session.access_token
        );
      } catch (err) {
        console.warn("Could not save application to server:", err);
      }
    }
    const newApp: ApplicationPlan = {
      id: `app-${Date.now()}`,
      scheme_id: scheme.scheme_id,
      scheme_name: scheme.scheme_name,
      portal_url: scheme.official_portal_url,
      status: "document_collection",
      required_documents: scheme.required_documents,
      completed_documents: ["Aadhaar Card"],
    };
    setApplications([newApp, ...applications]);
    setActiveTab("applications");
    setSelectedScheme(null);
  }

  function handleFetchLogistics() {
    getLogisticsQuote(
      {
        origin_district: logisticsOrigin,
        destination_district: logisticsDest,
        weight_kg: parseFloat(logisticsWeight) || 100,
      },
      session?.access_token
    )
      .then(setLogisticsQuote)
      .catch((err) => {
        console.warn("Logistics call error:", err);
      });
  }

  // Render Authentication View if no active session
  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.authContainer}>
          <Text style={styles.authLogo}>Vyapar<Text style={{ color: "#ea580c" }}>Marg</Text></Text>
          <Text style={styles.authSubtitle}>ग्रामीण उद्योजक सहाय्यक मंच (Rural Business Assistant)</Text>
          <Text style={styles.authInstruction}>
            {authMode === "signup" ? "नवीन खाते तयार करा (Create Account)" : "आपल्या खात्यात लॉगिन करा (Sign In)"}
          </Text>

          <TextInput
            style={styles.authInput}
            placeholder="ईमेल आयडी (Email Address)"
            value={authEmail}
            autoCapitalize="none"
            onChangeText={setAuthEmail}
          />
          <TextInput
            style={styles.authInput}
            placeholder="पासवर्ड (Password)"
            value={authPassword}
            secureTextEntry
            onChangeText={setAuthPassword}
          />

          {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}

          <Pressable style={styles.authButton} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.authButtonText}>
                {authMode === "signup" ? "खाते तयार करा" : "लॉगिन करा (Continue)"}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.authToggleBtn}
            onPress={() => {
              setAuthError("");
              setAuthMode(authMode === "signup" ? "signin" : "signup");
            }}
          >
            <Text style={styles.authToggleText}>
              {authMode === "signup" ? "आधीच खाते आहे? लॉगिन करा" : "नवीन आहात? खाते तयार करा"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Render Profile Setup View if authenticated but profile doesn't exist
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.authContainer}>
          <Text style={styles.authLogo}>व्यवसाय प्रोफाइल तयार करा</Text>
          <Text style={styles.authSubtitle}>सरकारी योजना व अनुदानासाठी व्यवसाय माहिती आवश्यक आहे.</Text>

          <TextInput
            style={styles.authInput}
            placeholder="व्यवसायाचे नाव (उदा. श्री स्वामी समर्थ ॲग्रो)"
            value={createProfileName}
            onChangeText={setCreateProfileName}
          />
          <TextInput
            style={styles.authInput}
            placeholder="व्यवसाय प्रकार (उदा. agro_processing, dairy, retail)"
            value={createProfileType}
            onChangeText={setCreateProfileType}
          />
          <TextInput
            style={styles.authInput}
            placeholder="जिल्हा (उदा. Kolhapur, Pune, Thane)"
            value={createProfileDistrict}
            onChangeText={setCreateProfileDistrict}
          />
          <TextInput
            style={styles.authInput}
            placeholder="वार्षिक उलाढाल INR (उदा. 2500000)"
            value={createProfileTurnover}
            keyboardType="numeric"
            onChangeText={setCreateProfileTurnover}
          />

          <Pressable style={styles.authButton} onPress={handleCreateProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.authButtonText}>प्रोफाइल सेव्ह करा व योजना शोधा</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const filteredSchemes = schemes.filter((s) => {
    const matchesCategory = categoryFilter === "all" || s.category_type === categoryFilter;
    const matchesSearch =
      s.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.headerBar}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.logoText}>Vyapar<Text style={styles.logoAccent}>Marg</Text></Text>
            <View style={styles.stateTag}><Text style={styles.stateTagText}>MAHARASHTRA</Text></View>
          </View>
          <Text style={styles.ownerText}>{profile.business_name} ({profile.district})</Text>
        </View>

        <View style={styles.langPicker}>
          {(["mr", "hi", "en"] as Language[]).map((lang) => (
            <Pressable
              key={lang}
              style={[styles.langChip, language === lang && styles.langChipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                {lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "EN"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Main Body */}
      <View style={styles.mainContainer}>
        {/* TAB 1: AI ASSISTANT CHAT & VOICE */}
        {activeTab === "assistant" && (
          <View style={styles.tabContent}>
            <View style={styles.bannerBox}>
              <View style={styles.bannerHeader}>
                <Text style={styles.bannerTitle}>
                  {language === "mr" ? "🤖 व्यापारमार्ग बहुभाषिक सहाय्यक" : "🤖 Rural Multilingual Assistant"}
                </Text>
                <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>ONLINE</Text></View>
              </View>
              <Text style={styles.bannerSub}>
                {language === "mr"
                  ? "मराठी आणि हिंदीत PMEGP, CMEGP, महाडीबीटी योजना, ३५% अनुदान आणि अर्जाबद्दल विचारा."
                  : "Instant answers on PMEGP, CMEGP loans, 35% subsidies & portal document checklists."}
              </Text>
            </View>

            {React.createElement(FlatList as any, {
              data: messages,
              keyExtractor: (item: any) => item.id,
              contentContainerStyle: styles.chatList,
              renderItem: ({ item }: { item: any }) => (
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
              ),
            })}

            <View style={styles.chatInputBar}>
              <Pressable
                style={[styles.micBtn, isListening && styles.micBtnListening]}
                onPress={handleVoiceInput}
              >
                <Text style={styles.micBtnText}>{isListening ? "🔴" : "🎙️"}</Text>
              </Pressable>
              <TextInput
                style={styles.chatTextInput}
                placeholder={language === "mr" ? "प्रश्न विचारा किंवा माइक दाबा..." : "Ask a question..."}
                placeholderTextColor="#8aa0b8"
                value={inputText}
                onChangeText={setInputText}
              />
              <Pressable style={styles.sendBtn} onPress={() => handleSendMessage()}>
                <Text style={styles.sendBtnText}>Send</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* TAB 2: DYNAMIC SCHEMES CATALOG */}
        {activeTab === "schemes" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>
              {language === "mr" ? "आपल्या व्यवसायासाठी पात्र योजना" : "Eligible Schemes & Subsidies"}
            </Text>
            <Text style={styles.sectionSub}>
              Evaluated deterministically for {profile.business_type} · {profile.district}, Maharashtra
            </Text>

            <TextInput
              style={styles.searchBar}
              placeholder="Search scheme name or subsidy details..."
              placeholderTextColor="#8aa0b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {filteredSchemes.map((scheme) => (
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

                <View style={styles.schemeActionRow}>
                  <Pressable
                    style={styles.actionBtnOutline}
                    onPress={() => setSelectedScheme(scheme)}
                  >
                    <Text style={styles.actionBtnOutlineText}>Details & Documents</Text>
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

        {/* TAB 3: MARKETPLACES & DIGITAL TOOLS */}
        {activeTab === "marketplaces" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>🛒 Marketplaces & Digital Tools</Text>
            <Text style={styles.sectionSub}>Sell beyond your taluka with open networks and digital tools.</Text>

            {marketplaces.map((m: any) => (
              <View key={m.id} style={styles.marketplaceCard}>
                <View style={styles.schemeBadgeRow}>
                  <Text style={styles.mktBadgeText}>{m.category}</Text>
                  <Text style={styles.commissionText}>{m.commission_model}</Text>
                </View>
                <Text style={styles.schemeTitle}>{m.name}</Text>
                <Text style={styles.schemeExplain}>{m.description}</Text>
              </View>
            ))}

            <Text style={[styles.sectionHeader, { marginTop: 14 }]}>📱 Micro-Business Tools</Text>
            {digitalTools.map((t: any) => (
              <View key={t.id} style={styles.toolCard}>
                <Text style={styles.toolName}>{t.name}</Text>
                <Text style={styles.toolType}>{t.tool_type}</Text>
                <Text style={styles.toolBenefit}>{t.best_for}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 4: APPLICATION TRACKER */}
        {activeTab === "applications" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>📋 Application Tracker</Text>
            {applications.map((app) => (
              <View key={app.id} style={styles.appCard}>
                <Text style={styles.appTitle}>{app.scheme_name}</Text>
                <Text style={styles.statusBadgeText}>Status: {app.status.toUpperCase()}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 5: LOGISTICS */}
        {activeTab === "logistics" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>🚚 Rural Logistics Freight Planner (Student 2)</Text>
            <View style={styles.logisticsBox}>
              <Text style={styles.inputLabel}>Origin District:</Text>
              <TextInput style={styles.inputField} value={logisticsOrigin} onChangeText={setLogisticsOrigin} />
              <Text style={styles.inputLabel}>Destination:</Text>
              <TextInput style={styles.inputField} value={logisticsDest} onChangeText={setLogisticsDest} />
              <Text style={styles.inputLabel}>Weight (kg):</Text>
              <TextInput style={styles.inputField} value={logisticsWeight} keyboardType="numeric" onChangeText={setLogisticsWeight} />
              <Pressable style={styles.calcBtn} onPress={handleFetchLogistics}>
                <Text style={styles.calcBtnText}>Calculate Freight Rates</Text>
              </Pressable>
            </View>
            {logisticsQuote && (
              <View style={{ marginTop: 14 }}>
                {logisticsQuote.available_carriers?.map((c: any, i: number) => (
                  <View key={i} style={styles.carrierCard}>
                    <Text style={styles.carrierName}>{c.carrier_name} - ₹{c.estimated_cost_inr}</Text>
                    <Text style={styles.schemeExplain}>{c.vehicle_type} · ~{c.estimated_delivery_hours} hrs</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === "profile" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>📊 Business Profile & Growth</Text>
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>{profile.business_name}</Text>
              <Text style={styles.profileDetail}>Activity: {profile.business_type}</Text>
              <Text style={styles.profileDetail}>Location: {profile.district}, {profile.state}</Text>
              <Text style={styles.profileDetail}>Turnover: ₹{((profile.annual_turnover || 0) / 100000).toFixed(1)} Lakh</Text>
              <Pressable
                style={[styles.calcBtn, { backgroundColor: "#dc2626", marginTop: 14 }]}
                onPress={() => {
                  supabase.auth.signOut();
                  setSession(null);
                  setProfile(null);
                }}
              >
                <Text style={styles.calcBtnText}>लॉगआउट करा (Sign Out)</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Details Modal */}
      {selectedScheme && (
        <Modal animationType="slide" transparent={true} visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedScheme.scheme_name}</Text>
              <Text style={styles.modalOrg}>{selectedScheme.organization}</Text>
              <Text style={styles.modalExplain}>{selectedScheme.explanation}</Text>

              <Text style={styles.modalSubtitle}>आवश्यक कागदपत्रे:</Text>
              {selectedScheme.required_documents.map((doc, i) => (
                <Text key={i} style={styles.modalDocItem}>• {doc}</Text>
              ))}

              <View style={styles.modalBtnRow}>
                <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedScheme(null)}>
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </Pressable>
                <Pressable style={styles.modalApplyBtn} onPress={() => handleSaveApplication(selectedScheme)}>
                  <Text style={styles.modalApplyBtnText}>Add to Applications</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {[
          { key: "assistant", label: "Assistant", icon: "🤖" },
          { key: "schemes", label: "Schemes", icon: "🏛️" },
          { key: "marketplaces", label: "Markets", icon: "🛒" },
          { key: "applications", label: "Tracker", icon: "📋" },
          { key: "logistics", label: "Logistics", icon: "🚚" },
          { key: "profile", label: "Profile", icon: "📊" },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.navItem, activeTab === tab.key && styles.navItemActive]}
            onPress={() => setActiveTab(tab.key as NavTab)}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  authContainer: { flex: 1, padding: 24, justifyContent: "center" },
  authLogo: { fontSize: 24, fontWeight: "800", color: "#0f766e", textAlign: "center", marginBottom: 6 },
  authSubtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 20 },
  authInstruction: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 12 },
  authInput: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 10, backgroundColor: "#f8fafc" },
  authButton: { backgroundColor: "#0f766e", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  authButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
  authToggleBtn: { marginTop: 14, alignItems: "center" },
  authToggleText: { color: "#0f766e", fontSize: 12, fontWeight: "600" },
  authErrorText: { color: "#dc2626", fontSize: 12, marginBottom: 8 },

  headerBar: { backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { fontSize: 20, fontWeight: "800", color: "#0f766e" },
  logoAccent: { color: "#ea580c" },
  stateTag: { backgroundColor: "#ffedd5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stateTagText: { fontSize: 9, fontWeight: "700", color: "#c2410c" },
  ownerText: { fontSize: 11, color: "#4b5563", marginTop: 2 },
  langPicker: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 6, padding: 2 },
  langChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  langChipActive: { backgroundColor: "#0f766e" },
  langText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  langTextActive: { color: "#ffffff" },

  mainContainer: { flex: 1, backgroundColor: "#f8fafc" },
  tabContent: { flex: 1, padding: 12 },
  bannerBox: { backgroundColor: "#ffffff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  bannerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: "#0f766e" },
  liveBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveBadgeText: { fontSize: 9, fontWeight: "700", color: "#15803d" },
  bannerSub: { fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 15 },
  chatList: { paddingVertical: 8 },
  chatBubble: { maxWidth: "85%", padding: 10, borderRadius: 10, marginBottom: 8 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#0f766e" },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" },
  chatText: { fontSize: 13, lineHeight: 18 },
  userChatText: { color: "#ffffff" },
  assistantChatText: { color: "#1e293b" },
  chatTime: { fontSize: 9, color: "#94a3b8", marginTop: 4, alignSelf: "flex-end" },
  chatInputBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 8, paddingVertical: 4, marginTop: 4 },
  micBtn: { padding: 6 },
  micBtnListening: { backgroundColor: "#fee2e2", borderRadius: 16 },
  micBtnText: { fontSize: 18 },
  chatTextInput: { flex: 1, fontSize: 13, paddingHorizontal: 8, paddingVertical: 6, color: "#0f172a" },
  sendBtn: { backgroundColor: "#0f766e", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  sendBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 12 },

  sectionHeader: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  sectionSub: { fontSize: 11, color: "#64748b", marginBottom: 10 },
  searchBar: { backgroundColor: "#ffffff", borderRadius: 6, borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, marginBottom: 10 },

  schemeCard: { backgroundColor: "#ffffff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 10 },
  schemeBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  eligibleBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  eligibleBadgeText: { fontSize: 10, fontWeight: "700", color: "#15803d" },
  subsidyBadge: { backgroundColor: "#ffedd5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  subsidyBadgeText: { fontSize: 10, fontWeight: "800", color: "#c2410c" },
  schemeTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  schemeOrg: { fontSize: 11, color: "#64748b", marginBottom: 6 },
  schemeExplain: { fontSize: 12, color: "#334155", lineHeight: 16, marginBottom: 8 },
  schemeActionRow: { flexDirection: "row", gap: 8 },
  actionBtnOutline: { flex: 1, borderWidth: 1, borderColor: "#0f766e", paddingVertical: 6, borderRadius: 6, alignItems: "center" },
  actionBtnOutlineText: { color: "#0f766e", fontSize: 11, fontWeight: "700" },
  actionBtnSolid: { flex: 1, backgroundColor: "#0f766e", paddingVertical: 6, borderRadius: 6, alignItems: "center" },
  actionBtnSolidText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },

  marketplaceCard: { backgroundColor: "#ffffff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  mktBadgeText: { fontSize: 10, color: "#1d4ed8", fontWeight: "700", backgroundColor: "#eff6ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  commissionText: { fontSize: 10, fontWeight: "700", color: "#16a34a" },

  toolCard: { backgroundColor: "#ffffff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  toolName: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  toolType: { fontSize: 11, color: "#0f766e", fontWeight: "600", marginBottom: 4 },
  toolBenefit: { fontSize: 11, color: "#475569" },

  appCard: { backgroundColor: "#ffffff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 10 },
  appTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#b45309", marginTop: 4 },

  logisticsBox: { backgroundColor: "#ffffff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  inputLabel: { fontSize: 11, fontWeight: "700", color: "#334155", marginBottom: 4, marginTop: 6 },
  inputField: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  calcBtn: { backgroundColor: "#ea580c", borderRadius: 6, paddingVertical: 8, alignItems: "center", marginTop: 12 },
  calcBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  carrierCard: { backgroundColor: "#ffffff", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 6 },
  carrierName: { fontSize: 12, fontWeight: "700", color: "#0f172a" },

  profileCard: { backgroundColor: "#ffffff", borderRadius: 8, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  profileName: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  profileDetail: { fontSize: 12, color: "#475569", marginBottom: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 18, maxHeight: "80%" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  modalOrg: { fontSize: 11, color: "#64748b", marginBottom: 8 },
  modalExplain: { fontSize: 12, color: "#334155", lineHeight: 16, marginBottom: 12 },
  modalSubtitle: { fontSize: 12, fontWeight: "700", color: "#0f766e", marginBottom: 6 },
  modalDocItem: { fontSize: 12, color: "#475569", marginBottom: 4 },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalCloseBtn: { flex: 1, borderWidth: 1, borderColor: "#cbd5e1", paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  modalCloseBtnText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  modalApplyBtn: { flex: 1, backgroundColor: "#0f766e", paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  modalApplyBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },

  bottomNav: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e2e8f0", backgroundColor: "#ffffff", paddingVertical: 6 },
  navItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
  navItemActive: { borderTopWidth: 2, borderTopColor: "#0f766e" },
  navIcon: { fontSize: 16, marginBottom: 2 },
  navLabel: { fontSize: 9, fontWeight: "600", color: "#94a3b8" },
  navLabelActive: { color: "#0f766e", fontWeight: "700" },
});
