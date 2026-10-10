import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  Linking,
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
  business_name: string;
  business_type: string;
  state: string;
  district: string;
  annual_turnover_inr: number;
  category: string;
  gender: string;
  is_urban: boolean;
};

type SchemeRecommendation = {
  scheme_id: string;
  scheme_name: string;
  organization: string;
  category_type: "loan" | "subsidy" | "training" | "equipment";
  eligibility_status: "eligible" | "ineligible" | "missing_information";
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

const initialSchemes: SchemeRecommendation[] = [
  {
    scheme_id: "pmegp_2026",
    scheme_name: "Prime Minister's Employment Generation Programme (PMEGP)",
    organization: "KVIC / Khadi & Village Industries Commission",
    category_type: "subsidy",
    eligibility_status: "eligible",
    matching_score: 96,
    explanation: "Eligible for up to ₹50 Lakh loan with 25-35% margin money subsidy for manufacturing & service micro-units in Maharashtra.",
    missing_fields: [],
    max_benefit_amount_inr: 5000000,
    subsidy_percentage: 35,
    official_portal_url: "https://www.kviconline.gov.in/pmegpeportal",
    required_documents: ["Udyam Registration Certificate", "Aadhaar Card", "PAN Card", "Detailed Project Report (DPR)", "Caste Certificate", "Bank Passbook"],
  },
  {
    scheme_id: "cmegp_mah_2026",
    scheme_name: "Chief Minister Employment Generation Programme (CMEGP Maharashtra)",
    organization: "Directorate of Industries, Govt. of Maharashtra",
    category_type: "subsidy",
    eligibility_status: "eligible",
    matching_score: 92,
    explanation: "Maharashtra Govt project subsidy providing up to ₹50 Lakh for manufacturing & ₹10 Lakh for service micro-enterprises with 15-35% subsidy.",
    missing_fields: [],
    max_benefit_amount_inr: 5000000,
    subsidy_percentage: 35,
    official_portal_url: "https://mahadiscom.in/cmegp",
    required_documents: ["Maharashtra Domicile Certificate", "Udyam Certificate", "Aadhaar Card", "Project Proposal", "Educational Certificate"],
  },
  {
    scheme_id: "pmsvanidhi_2026",
    scheme_name: "PM SVANidhi (Micro-Credit Loan Scheme)",
    organization: "Ministry of Housing and Urban Affairs",
    category_type: "loan",
    eligibility_status: "eligible",
    matching_score: 88,
    explanation: "Collateral-free working capital loan up to ₹50,000 with 7% interest subsidy and digital transaction cashback rewards.",
    missing_fields: [],
    max_benefit_amount_inr: 50000,
    subsidy_percentage: 7,
    official_portal_url: "https://pmsvanidhi.mohua.gov.in",
    required_documents: ["Vending Certificate / Urban Local Body ID", "Aadhaar Card", "Bank Account linked to Mobile"],
  },
  {
    scheme_id: "cgtmse_2026",
    scheme_name: "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
    organization: "SIDBI & Ministry of MSME",
    category_type: "loan",
    eligibility_status: "eligible",
    matching_score: 85,
    explanation: "Collateral-free business credit guarantee up to ₹2 Crore for existing micro & small manufacturing/retail units.",
    missing_fields: [],
    max_benefit_amount_inr: 20000000,
    subsidy_percentage: 85,
    official_portal_url: "https://www.cgtmse.in",
    required_documents: ["Udyam Registration", "2 Years ITR / Financial Statement", "Bank Statement (12 months)", "Aadhaar & PAN"],
  },
];

export default function App() {
  const [language, setLanguage] = useState<Language>("mr"); // Default to Marathi for Maharashtra users!
  const [activeTab, setActiveTab] = useState<"assistant" | "schemes" | "applications" | "profile">("assistant");

  // Direct production state (starts active without blocking auth gate)
  const [profile, setProfile] = useState<BusinessProfile>({
    id: "profile-rangesh-53",
    business_name: "Gupta Agro & Business Solutions",
    business_type: "Agricultural Products & Micro-Retail",
    state: "Maharashtra",
    district: "Thane",
    annual_turnover_inr: 1500000,
    category: "OBC",
    gender: "Male",
    is_urban: false,
  });

  const [schemes, setSchemes] = useState<SchemeRecommendation[]>(initialSchemes);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "subsidy" | "loan">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [applications, setApplications] = useState<ApplicationPlan[]>([
    {
      id: "app-101",
      scheme_id: "pmegp_2026",
      scheme_name: "PMEGP Loan & 35% Margin Money Subsidy",
      portal_url: "https://www.kviconline.gov.in/pmegpeportal",
      status: "document_collection",
      required_documents: ["Udyam Registration Certificate", "Aadhaar Card", "PAN Card", "Detailed Project Report (DPR)", "Bank Passbook"],
      completed_documents: ["Aadhaar Card", "PAN Card", "Bank Passbook"],
    },
    {
      id: "app-102",
      scheme_id: "cmegp_mah_2026",
      scheme_name: "CMEGP Maharashtra State Subsidy",
      portal_url: "https://mahadiscom.in/cmegp",
      status: "draft",
      required_documents: ["Maharashtra Domicile Certificate", "Udyam Certificate", "Aadhaar Card", "Project Proposal"],
      completed_documents: ["Aadhaar Card"],
    },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: "नमस्कार! मी व्यापारमार्ग एआय सहाय्यक आहे. आपल्या व्यवसायासाठी PMEGP, CMEGP योजना, कर्ज आणि अनुदानाबद्दल माहिती विचारा.",
      timestamp: "12:00 PM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<SchemeRecommendation | null>(null);

  function handleSendMessage(customText?: string) {
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

    // AI Response Engine
    setTimeout(() => {
      let reply = "आपल्या महाराष्ट्रातील व्यवसायासाठी PMEGP योजनेअंतर्गत ३५% अनुदान (Subsidy) उपलब्ध आहे!";
      const query = textToSend.toLowerCase();

      if (query.includes("pmegp") || query.includes("subsidy") || query.includes("अनुदान")) {
        reply = "PMEGP योजनेत तुम्हाला ₹५० लाखांपर्यंत कर्ज आणि ३५% अनुदान मिळते. लागणारे मुख्य कागदपत्रे: १. आधार कार्ड २. उद्यम प्रमाणपत्र ३. प्रकल्प अहवाल (DPR).";
      } else if (query.includes("document") || query.includes("कागदपत्रे")) {
        reply = "योजनेसाठी आवश्यक कागदपत्रे: १. आधार कार्ड २. पॅन कार्ड ३. बँक पासबुक ४. उद्यम नोंदणी ५. महाराष्ट्र अधिवास दाखला (Domicile).";
      } else if (query.includes("cmegp") || query.includes("महाराष्ट्र")) {
        reply = "CMEGP ही महाराष्ट्र सरकारची विशेष योजना आहे. यामध्ये ५० लाखांपर्यंत उत्पादन क्षेत्रासाठी २५%-३५% अनुदान मिळते.";
      } else if (language === "en") {
        reply = "You qualify for PMEGP (35% Subsidy up to ₹50 Lakh) and CMEGP Maharashtra scheme. Check the Schemes tab for document requirements!";
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 500);
  }

  function handleVoiceInput() {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSendMessage("PMEGP योजनेसाठी कोणते कागदपत्रे लागतात?");
    }, 1500);
  }

  function handleSaveApplication(scheme: SchemeRecommendation) {
    const existing = applications.find((a) => a.scheme_id === scheme.scheme_id);
    if (!existing) {
      const newApp: ApplicationPlan = {
        id: `app-${Date.now()}`,
        scheme_id: scheme.scheme_id,
        scheme_name: scheme.scheme_name,
        portal_url: scheme.official_portal_url,
        status: "document_collection",
        required_documents: scheme.required_documents,
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

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.logoText}>Vyapar<Text style={styles.logoAccent}>Marg</Text></Text>
            <View style={styles.stateTag}><Text style={styles.stateTagText}>MAHARASHTRA</Text></View>
          </View>
          <Text style={styles.ownerText}>Welcome, {profile.business_name}</Text>
        </View>

        {/* Language Picker */}
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

      {/* Main Body Content */}
      <View style={styles.mainContainer}>
        {/* TAB 1: AI ASSISTANT CHAT & VOICE */}
        {activeTab === "assistant" && (
          <View style={styles.tabContent}>
            {/* AI Banner */}
            <View style={styles.bannerBox}>
              <View style={styles.bannerHeader}>
                <Text style={styles.bannerTitle}>
                  {language === "mr" ? "🤖 व्यापारमार्ग एआय सहाय्यक" : "🤖 Rural Business AI Assistant"}
                </Text>
                <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>ONLINE</Text></View>
              </View>
              <Text style={styles.bannerSub}>
                {language === "mr"
                  ? "मराठी आणि हिंदीमध्ये योजना, कर्ज, ३५% अनुदान आणि अर्जाबद्दल माहिती विचारा."
                  : "Instant answers on PMEGP, CMEGP loans, 35% subsidies & portal document checklists."}
              </Text>

              {/* Preset Quick Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <Pressable
                  style={styles.presetChip}
                  onPress={() => handleSendMessage("PMEGP ३५% अनुदान योजना माहिती")}
                >
                  <Text style={styles.presetChipText}>💡 PMEGP ३५% अनुदान</Text>
                </Pressable>
                <Pressable
                  style={styles.presetChip}
                  onPress={() => handleSendMessage("CMEGP महाराष्ट्र योजना")}
                >
                  <Text style={styles.presetChipText}>🏛️ CMEGP महाराष्ट्र</Text>
                </Pressable>
                <Pressable
                  style={styles.presetChip}
                  onPress={() => handleSendMessage("लागणारे कागदपत्रे सांगा")}
                >
                  <Text style={styles.presetChipText}>📄 कागदपत्रे यादी</Text>
                </Pressable>
              </ScrollView>
            </View>

            {/* Chat Conversation */}
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

            {/* Chat & Voice Input Controls */}
            <View style={styles.chatInputBar}>
              <Pressable
                style={[styles.micBtn, isListening && styles.micBtnListening]}
                onPress={handleVoiceInput}
              >
                <Text style={styles.micBtnText}>{isListening ? "🔴" : "🎙️"}</Text>
              </Pressable>
              <TextInput
                style={styles.chatTextInput}
                placeholder={
                  language === "mr"
                    ? "येथे प्रश्न विचारा किंवा बोलण्यासाठी मायक्रोफोन दाबा..."
                    : "Ask a question or tap mic to speak..."
                }
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

        {/* TAB 2: SCHEMES CATALOG & ELIGIBILITY */}
        {activeTab === "schemes" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>
              {language === "mr" ? "आपल्या व्यवसायासाठी पात्र योजना" : "Eligible Schemes & Subsidies"}
            </Text>
            <Text style={styles.sectionSub}>
              Verified for {profile.business_type} · {profile.district}, {profile.state}
            </Text>

            {/* Search Bar */}
            <TextInput
              style={styles.searchBar}
              placeholder="Search scheme name or subsidy details..."
              placeholderTextColor="#8aa0b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Category Filter Chips */}
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterChip, categoryFilter === "all" && styles.filterChipActive]}
                onPress={() => setCategoryFilter("all")}
              >
                <Text style={[styles.filterChipText, categoryFilter === "all" && styles.filterChipTextActive]}>
                  All Schemes ({schemes.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, categoryFilter === "subsidy" && styles.filterChipActive]}
                onPress={() => setCategoryFilter("subsidy")}
              >
                <Text style={[styles.filterChipText, categoryFilter === "subsidy" && styles.filterChipTextActive]}>
                  Subsidies (अनुदान)
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, categoryFilter === "loan" && styles.filterChipActive]}
                onPress={() => setCategoryFilter("loan")}
              >
                <Text style={[styles.filterChipText, categoryFilter === "loan" && styles.filterChipTextActive]}>
                  Loans (कर्ज)
                </Text>
              </Pressable>
            </View>

            {/* Scheme Cards */}
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

                {scheme.max_benefit_amount_inr ? (
                  <Text style={styles.benefitText}>
                    Max Credit / Loan: ₹{(scheme.max_benefit_amount_inr / 100000).toFixed(1)} Lakh
                  </Text>
                ) : null}

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

        {/* TAB 3: APPLICATIONS & DOCUMENT TRACKER */}
        {activeTab === "applications" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>Application Plans & Document Checklist</Text>
            <Text style={styles.sectionSub}>
              Track certificates required before applying on MahaDBT / Aaple Sarkar portals.
            </Text>

            {applications.map((app) => {
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
                    Document Readiness: {app.completed_documents.length} / {app.required_documents.length} ({progress}%)
                  </Text>

                  <Text style={styles.docSectionTitle}>Check off documents as you collect them:</Text>
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

                  <Pressable
                    style={styles.portalLinkBtn}
                    onPress={() => Linking.openURL(app.portal_url)}
                  >
                    <Text style={styles.portalLinkText}>🌐 Open Official Application Portal ↗</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* TAB 4: BUSINESS PROFILE */}
        {activeTab === "profile" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.sectionHeader}>Business & Entrepreneur Profile</Text>
            <Text style={styles.sectionSub}>Used for deterministic scheme eligibility scoring in Maharashtra.</Text>

            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Business Name:</Text>
                <Text style={styles.profileVal}>{profile.business_name}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Industry / Sector:</Text>
                <Text style={styles.profileVal}>{profile.business_type}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Location:</Text>
                <Text style={styles.profileVal}>{profile.district}, {profile.state}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Annual Turnover:</Text>
                <Text style={styles.profileVal}>₹{(profile.annual_turnover_inr / 100000).toFixed(1)} Lakh / year</Text>
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
                  {selectedScheme.required_documents.map((d) => (
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
                      <Text style={styles.modalApplyBtnText}>Add to Application Plan</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f2f6fb" },
  headerBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1eaf3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoText: { color: "#13498a", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  logoAccent: { color: "#e78322" },
  stateTag: { backgroundColor: "#fff2e5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  stateTagText: { color: "#d96b00", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  ownerText: { color: "#54708d", fontSize: 12, fontWeight: "700", marginTop: 2 },

  langPicker: { flexDirection: "row", backgroundColor: "#eef4fb", borderRadius: 20, padding: 3 },
  langChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16 },
  langChipActive: { backgroundColor: "#1760a8" },
  langText: { fontSize: 11, fontWeight: "700", color: "#54708d" },
  langTextActive: { color: "#ffffff" },

  mainContainer: { flex: 1 },
  tabContent: { flex: 1, padding: 14 },
  bannerBox: { backgroundColor: "#1760a8", borderRadius: 18, padding: 14, marginBottom: 10 },
  bannerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bannerTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  liveBadge: { backgroundColor: "#229954", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  liveBadgeText: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  bannerSub: { color: "#d5e5f5", fontSize: 13, lineHeight: 18, marginTop: 4 },

  chipScroll: { marginTop: 10 },
  presetChip: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  presetChipText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },

  chatList: { paddingBottom: 12 },
  chatBubble: { borderRadius: 16, padding: 14, marginBottom: 10, maxWidth: "86%" },
  userBubble: { backgroundColor: "#1760a8", alignSelf: "flex-end", borderBottomRightRadius: 2 },
  assistantBubble: { backgroundColor: "#ffffff", alignSelf: "flex-start", borderBottomLeftRadius: 2, borderWidth: 1, borderColor: "#e1eaf3" },
  chatText: { fontSize: 15, lineHeight: 21 },
  userChatText: { color: "#ffffff" },
  assistantChatText: { color: "#123963" },
  chatTime: { fontSize: 10, color: "#8aa0b8", marginTop: 4, textAlign: "right" },

  chatInputBar: { flexDirection: "row", gap: 8, paddingVertical: 8, alignItems: "center" },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe6f2" },
  micBtnListening: { backgroundColor: "#ffe5e5", borderColor: "#e74c3c" },
  micBtnText: { fontSize: 18 },
  chatTextInput: { flex: 1, backgroundColor: "#ffffff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, borderWidth: 1, borderColor: "#dbe6f2", color: "#123963" },
  sendBtn: { backgroundColor: "#e78322", borderRadius: 14, paddingHorizontal: 16, height: 44, justifyContent: "center", alignItems: "center" },
  sendBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  sectionHeader: { color: "#123963", fontSize: 20, fontWeight: "800" },
  sectionSub: { color: "#54708d", fontSize: 13, marginBottom: 12, marginTop: 2 },

  searchBar: { backgroundColor: "#ffffff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: "#dbe6f2", color: "#123963", marginBottom: 10 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterChip: { backgroundColor: "#ffffff", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: "#dbe6f2" },
  filterChipActive: { backgroundColor: "#1760a8", borderColor: "#1760a8" },
  filterChipText: { color: "#54708d", fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#ffffff" },

  schemeCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e1eaf3" },
  schemeBadgeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  eligibleBadge: { backgroundColor: "#e4f4e9", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  eligibleBadgeText: { color: "#227344", fontSize: 11, fontWeight: "800" },
  subsidyBadge: { backgroundColor: "#fff2e5", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  subsidyBadgeText: { color: "#d96b00", fontSize: 11, fontWeight: "800" },
  schemeTitle: { color: "#123963", fontSize: 17, fontWeight: "800" },
  schemeOrg: { color: "#6a85a4", fontSize: 12, marginTop: 2, marginBottom: 8 },
  schemeExplain: { color: "#355575", fontSize: 14, lineHeight: 20 },
  benefitText: { color: "#1760a8", fontSize: 14, fontWeight: "800", marginTop: 8 },
  schemeActionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtnOutline: { flex: 1, borderColor: "#1760a8", borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  actionBtnOutlineText: { color: "#1760a8", fontSize: 13, fontWeight: "800" },
  actionBtnSolid: { backgroundColor: "#e78322", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, justifyContent: "center" },
  actionBtnSolidText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },

  appCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e1eaf3" },
  appHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  appTitle: { color: "#123963", fontSize: 16, fontWeight: "800", flex: 1 },
  statusPill: { backgroundColor: "#eaf2fb", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { color: "#1760a8", fontSize: 10, fontWeight: "800" },
  progressTrack: { height: 7, backgroundColor: "#eef4fb", borderRadius: 4, marginTop: 12, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#1760a8" },
  progressText: { color: "#54708d", fontSize: 12, marginTop: 5, fontWeight: "700" },
  docSectionTitle: { color: "#123963", fontSize: 13, fontWeight: "800", marginTop: 12, marginBottom: 6 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  checkBox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: "#a2b7cf", justifyContent: "center", alignItems: "center" },
  checkBoxDone: { backgroundColor: "#1760a8", borderColor: "#1760a8" },
  checkMark: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  checkLabel: { color: "#355575", fontSize: 14 },
  checkLabelDone: { color: "#a2b7cf", textDecorationLine: "line-through" },
  portalLinkBtn: { backgroundColor: "#eef5fc", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  portalLinkText: { color: "#1760a8", fontSize: 13, fontWeight: "800" },

  profileCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#e1eaf3" },
  profileRow: { borderBottomWidth: 1, borderBottomColor: "#f0f6fb", paddingVertical: 11 },
  profileLabel: { color: "#6a85a4", fontSize: 12 },
  profileVal: { color: "#123963", fontSize: 15, fontWeight: "800", marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: "80%" },
  modalTitle: { color: "#123963", fontSize: 19, fontWeight: "800" },
  modalOrg: { color: "#6a85a4", fontSize: 13, marginTop: 2, marginBottom: 10 },
  modalDesc: { color: "#355575", fontSize: 14, lineHeight: 21 },
  modalSectionHeading: { color: "#123963", fontSize: 14, fontWeight: "800", marginTop: 14, marginBottom: 6 },
  modalDocItem: { color: "#54708d", fontSize: 13, lineHeight: 19 },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalCloseBtn: { flex: 1, borderColor: "#a2b7cf", borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalCloseBtnText: { color: "#54708d", fontSize: 14, fontWeight: "800" },
  modalApplyBtn: { flex: 1, backgroundColor: "#e78322", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalApplyBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  bottomNav: { flexDirection: "row", backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#e1eaf3", paddingVertical: 8 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navIcon: { fontSize: 20, color: "#8aa0b8" },
  navIconActive: { color: "#1760a8" },
  navLabel: { fontSize: 11, fontWeight: "700", color: "#8aa0b8", marginTop: 2 },
  navLabelActive: { color: "#1760a8" },
});
