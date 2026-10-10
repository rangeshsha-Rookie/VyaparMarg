import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
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

type Language = "mr" | "hi" | "en";
type NavTab = "home" | "schemes" | "assistant" | "dashboard" | "profile";

type DocumentItem = {
  id: string;
  name: string;
  nameMr: string;
  status: "verified" | "upload" | "pending";
};

type SchemeCardData = {
  id: string;
  title: string;
  titleMr: string;
  subtitle: string;
  subtitleMr: string;
  benefit: string;
  subsidy: string;
  category: string;
  portalUrl: string;
};

const documentList: DocumentItem[] = [
  { id: "1", name: "Aadhaar Card", nameMr: "आधार कार्ड", status: "verified" },
  { id: "2", name: "MSME Registration (Udyam)", nameMr: "व्यवसाय नोंदणी (MSME)", status: "upload" },
  { id: "3", name: "Bank Statement (12 Months)", nameMr: "बँक स्टेटमेंट", status: "pending" },
];

const schemesData: SchemeCardData[] = [
  {
    id: "pm-svanidhi",
    title: "PM SVANidhi Scheme",
    titleMr: "PM स्वानिधी योजना",
    subtitle: "Collateral-free loan up to ₹50,000 for small vendors & micro-units.",
    subtitleMr: "हाथागाडी, छोटे व्यापारी आणि सूक्ष्म उद्योगांसाठी ५० हजार कर्ज, ७% व्याज सूट",
    benefit: "₹५०,००० कर्ज",
    subsidy: "७% व्याज सूट",
    category: "loan",
    portalUrl: "https://pmsvanidhi.mohua.gov.in",
  },
  {
    id: "pmegp-kvic",
    title: "PMEGP (KVIC)",
    titleMr: "PMEGP (KVIC) योजना",
    subtitle: "Udyog / Manufacturing credit up to ₹50 Lakh with 35% margin subsidy.",
    subtitleMr: "उद्योगकता विकास, ५० लाख पर्यंत कर्ज, ३५% सबसिडी",
    benefit: "₹५० लाख पर्यंत कर्ज",
    subsidy: "३५% सबसिडी",
    category: "subsidy",
    portalUrl: "https://www.kviconline.gov.in/pmegpeportal",
  },
  {
    id: "cmegp-mah",
    title: "CMEGP Maharashtra",
    titleMr: "CMEGP महाराष्ट्र योजना",
    subtitle: "Maharashtra State project subsidy for new micro enterprises.",
    subtitleMr: "महाराष्ट्र शासन विशेष प्रकल्प सबसिडी २५% ते ३५% अनुदान",
    benefit: "₹५० लाख प्रकल्प",
    subsidy: "३५% अनुदान",
    category: "subsidy",
    portalUrl: "https://mahadiscom.in/cmegp",
  },
];

type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [language, setLanguage] = useState<Language>("mr");
  const [searchQuery, setSearchQuery] = useState("");
  const [docs, setDocs] = useState<DocumentItem[]>(documentList);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: "नमस्कार संगीता शेठ! मी व्यापारमार्ग सहाय्यक आहे. PM स्वानिधी किंवा PMEGP योजनेबद्दल काय विचारू इच्छिता?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<SchemeCardData | null>(null);

  function handleSendMessage(customText?: string) {
    const text = customText ?? inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText("");

    setTimeout(() => {
      let reply = "PMEGP योजनेत ३५% अनुदान मिळते. लागणारी कागदपत्रे: १. आधार कार्ड २. उद्यम प्रमाणपत्र ३. प्रकल्प रिपोर्ट (DPR).";
      if (text.includes("स्वानिधी") || text.includes("SVANidhi")) {
        reply = "PM स्वानिधी योजनेत ५०,००० ₹ बिनतारण कर्ज मिळून ७% व्याज परतावा सबसिडी मिळते!";
      }
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: "assistant", text: reply }]);
    }, 500);
  }

  function handleVoiceMicPress() {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSendMessage("PMEGP योजनेची माहिती सांगा");
    }, 1200);
  }

  function toggleDocStatus(id: string) {
    setDocs(
      docs.map((d) => {
        if (d.id !== id) return d;
        const next = d.status === "pending" ? "upload" : d.status === "upload" ? "verified" : "pending";
        return { ...d, status: next };
      })
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Deep Forest Green Header */}
      <View style={styles.headerContainer}>
        <View style={styles.topHeaderRow}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🌾</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>व्यापारमार्ग</Text>
              <Text style={styles.brandSubtitle}>मोफत बिझनेस असिस्टंट</Text>
            </View>
          </View>

          {/* User Profile Info */}
          <View style={styles.userProfileBox}>
            <Text style={styles.userGreeting}>नमस्ते, संगीत शेठ</Text>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>👤</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="योजना, दस्तऐवज शोधा..."
            placeholderTextColor="#86b29d"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Main Screen Body */}
      <View style={styles.bodyContainer}>
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Featured Banner Card: PM SVANidhi */}
            <View style={styles.featuredBanner}>
              <Text style={styles.bannerKicker}>कृषी आणि योजना के केंद्र</Text>
              <Text style={styles.bannerTitle}>PM स्वानिधी योजना</Text>
              <Text style={styles.bannerDesc}>
                रेडीवाले, छोटे व्यापाऱ्यांसाठी ५० हजार कर्ज, ७% व्याज सूट
              </Text>

              <Pressable
                style={styles.bannerBtn}
                onPress={() => setSelectedScheme(schemesData[0])}
              >
                <Text style={styles.bannerBtnText}>अर्ज करा / आवेदन करें</Text>
              </Pressable>
            </View>

            {/* Scheme Item Card: PMEGP */}
            <Pressable
              style={styles.schemeCard}
              onPress={() => setSelectedScheme(schemesData[1])}
            >
              <View style={styles.schemeCardLeft}>
                <View style={styles.schemeIconBox}>
                  <Text style={styles.schemeIcon}>💰</Text>
                </View>
                <View style={styles.schemeTextGroup}>
                  <Text style={styles.schemeCardTitle}>PMEGP (KVIC)</Text>
                  <Text style={styles.schemeCardSub}>उद्योगकता विकास, ५० लाख पर्यंत कर्ज, ३५% सबसिडी</Text>
                </View>
              </View>
            </Pressable>

            {/* Two Column Grid: Documents + Financial Analysis */}
            <View style={styles.gridRow}>
              {/* Document Checklist Widget */}
              <View style={[styles.gridCard, { flex: 1.2 }]}>
                <Text style={styles.widgetHeader}>डेटा आणि दस्तऐवज चेकलिस्ट</Text>
                {docs.map((doc, idx) => (
                  <Pressable
                    key={doc.id}
                    style={styles.docItemRow}
                    onPress={() => toggleDocStatus(doc.id)}
                  >
                    <Text style={styles.docIndex}>{idx + 1}</Text>
                    <View style={styles.docTextGroup}>
                      <Text style={styles.docName}>{doc.nameMr}</Text>
                      <Text
                        style={[
                          styles.docStatusText,
                          doc.status === "verified" && styles.statusVerified,
                          doc.status === "upload" && styles.statusUpload,
                          doc.status === "pending" && styles.statusPending,
                        ]}
                      >
                        {doc.status === "verified"
                          ? "✓ Verified"
                          : doc.status === "upload"
                          ? "📎 अपलोड करा"
                          : "⌛ पेंडिंग"}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Financial Analysis Widget */}
              <View style={[styles.gridCard, { flex: 1 }]}>
                <Text style={styles.widgetHeader}>आर्थिक विश्लेषण</Text>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Income</Text>
                  <Text style={styles.statValIncome}>६२,००० ₹</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Expense</Text>
                  <Text style={styles.statValExpense}>२४,५०० ₹</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Balance</Text>
                  <Text style={styles.statValBalance}>३७,५०० ₹</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* TAB 2: SCHEMES */}
        {activeTab === "schemes" && (
          <ScrollView style={styles.scrollContent}>
            <Text style={styles.pageTitle}>सरकारी योजना आणि अनुदान</Text>
            {schemesData.map((scheme) => (
              <View key={scheme.id} style={styles.fullSchemeCard}>
                <View style={styles.badgeRow}>
                  <View style={styles.tagGreen}><Text style={styles.tagGreenText}>{scheme.subsidy}</Text></View>
                  <View style={styles.tagBlue}><Text style={styles.tagBlueText}>{scheme.benefit}</Text></View>
                </View>
                <Text style={styles.fullSchemeTitle}>{scheme.titleMr}</Text>
                <Text style={styles.fullSchemeSub}>{scheme.subtitleMr}</Text>
                <Pressable
                  style={styles.schemeApplyBtn}
                  onPress={() => setSelectedScheme(scheme)}
                >
                  <Text style={styles.schemeApplyBtnText}>माहिती आणि कागदपत्रे पहा ➔</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 3: ASSISTANT CHAT */}
        {activeTab === "assistant" && (
          <View style={{ flex: 1 }}>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.chatBubble,
                    item.sender === "user" ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text style={item.sender === "user" ? styles.userChatText : styles.assistantChatText}>
                    {item.text}
                  </Text>
                </View>
              )}
            />
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="प्रश्न टाका..."
                value={inputText}
                onChangeText={setInputText}
              />
              <Pressable style={styles.chatSendBtn} onPress={() => handleSendMessage()}>
                <Text style={styles.chatSendText}>पाठवा</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* TAB 4: DASHBOARD */}
        {activeTab === "dashboard" && (
          <ScrollView style={styles.scrollContent}>
            <Text style={styles.pageTitle}>व्यवसाय डॅशबोर्ड</Text>
            <View style={styles.dashCard}>
              <Text style={styles.dashCardTitle}>महिना उत्पन्न: ६२,००० ₹</Text>
              <Text style={styles.dashCardSub}>एकूण जमा: ३७,५०० ₹ | प्रलंबित कागदपत्रे: १</Text>
            </View>
          </ScrollView>
        )}

        {/* TAB 5: PROFILE */}
        {activeTab === "profile" && (
          <ScrollView style={styles.scrollContent}>
            <Text style={styles.pageTitle}>व्यापारी प्रोफाईल</Text>
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>संगीत शेठ</Text>
              <Text style={styles.profileRole}>किराणा व कृषी व्यापारी · ठाणे, महाराष्ट्र</Text>
              <Text style={styles.profileMeta}>वार्षिक उलाढाल: १२ लाख ₹</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Floating Voice Assistant Bar above Bottom Nav */}
      <View style={styles.floatingVoiceContainer}>
        <View style={styles.voiceCallout}>
          <Text style={styles.voiceCalloutText}>नमस्कार! काय मदत करू?</Text>
        </View>

        <Pressable
          style={[styles.bigMicButton, isListening && styles.bigMicActive]}
          onPress={handleVoiceMicPress}
        >
          <Text style={styles.bigMicIcon}>🎙️</Text>
        </Pressable>
      </View>

      {/* 5-Item Bottom Navigation Bar */}
      <View style={styles.bottomNavBar}>
        <Pressable style={styles.navTabItem} onPress={() => setActiveTab("home")}>
          <Text style={[styles.navTabIcon, activeTab === "home" && styles.navTabIconActive]}>🏠</Text>
          <Text style={[styles.navTabLabel, activeTab === "home" && styles.navTabLabelActive]}>होम</Text>
        </Pressable>

        <Pressable style={styles.navTabItem} onPress={() => setActiveTab("schemes")}>
          <Text style={[styles.navTabIcon, activeTab === "schemes" && styles.navTabIconActive]}>📋</Text>
          <Text style={[styles.navTabLabel, activeTab === "schemes" && styles.navTabLabelActive]}>योजना</Text>
        </Pressable>

        <Pressable style={styles.navTabItem} onPress={() => setActiveTab("assistant")}>
          <Text style={[styles.navTabIcon, activeTab === "assistant" && styles.navTabIconActive]}>🎙️</Text>
          <Text style={[styles.navTabLabel, activeTab === "assistant" && styles.navTabLabelActive]}>असिस्टंट</Text>
        </Pressable>

        <Pressable style={styles.navTabItem} onPress={() => setActiveTab("dashboard")}>
          <Text style={[styles.navTabIcon, activeTab === "dashboard" && styles.navTabIconActive]}>🔲</Text>
          <Text style={[styles.navTabLabel, activeTab === "dashboard" && styles.navTabLabelActive]}>डॅशबोर्ड</Text>
        </Pressable>

        <Pressable style={styles.navTabItem} onPress={() => setActiveTab("profile")}>
          <Text style={[styles.navTabIcon, activeTab === "profile" && styles.navTabIconActive]}>👤</Text>
          <Text style={[styles.navTabLabel, activeTab === "profile" && styles.navTabLabelActive]}>प्रोफाईल</Text>
        </Pressable>
      </View>

      {/* Detail Modal */}
      <Modal visible={!!selectedScheme} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedScheme && (
              <>
                <Text style={styles.modalTitle}>{selectedScheme.titleMr}</Text>
                <Text style={styles.modalSub}>{selectedScheme.subtitleMr}</Text>
                <View style={styles.modalBadges}>
                  <Text style={styles.modalBadgeText}>फायदा: {selectedScheme.benefit}</Text>
                  <Text style={styles.modalBadgeText}>सबसिडी: {selectedScheme.subsidy}</Text>
                </View>
                <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedScheme(null)}>
                  <Text style={styles.modalCloseText}>बंद करा (Close)</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F7F5" },
  headerContainer: {
    backgroundColor: "#0D6246",
    paddingHorizontal: 18,
    paddingTop: 44,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  logoIcon: { fontSize: 20 },
  brandTitle: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  brandSubtitle: { color: "#A8E0C8", fontSize: 11, fontWeight: "700" },
  userProfileBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  userGreeting: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  userAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#177A5A", justifyContent: "center", alignItems: "center" },
  userAvatarText: { fontSize: 16 },

  searchBarBox: { flexDirection: "row", backgroundColor: "#084C35", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14, alignItems: "center", gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: "#ffffff", fontSize: 14 },

  bodyContainer: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 120 },

  featuredBanner: { backgroundColor: "#0F6D4C", borderRadius: 20, padding: 18, marginBottom: 14 },
  bannerKicker: { color: "#A8E0C8", fontSize: 12, fontWeight: "700" },
  bannerTitle: { color: "#ffffff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  bannerDesc: { color: "#E0F2EA", fontSize: 13, marginTop: 4, lineHeight: 18 },
  bannerBtn: { backgroundColor: "#ffffff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, alignSelf: "flex-start", marginTop: 14 },
  bannerBtnText: { color: "#0F6D4C", fontSize: 13, fontWeight: "900" },

  schemeCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 14, marginBottom: 14, elevation: 2 },
  schemeCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  schemeIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#E8F6F0", justifyContent: "center", alignItems: "center" },
  schemeIcon: { fontSize: 22 },
  schemeTextGroup: { flex: 1 },
  schemeCardTitle: { color: "#0B4230", fontSize: 16, fontWeight: "900" },
  schemeCardSub: { color: "#547568", fontSize: 12, marginTop: 2 },

  gridRow: { flexDirection: "row", gap: 10 },
  gridCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 14, elevation: 2 },
  widgetHeader: { color: "#0B4230", fontSize: 13, fontWeight: "900", marginBottom: 10 },

  docItemRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#F0F5F2" },
  docIndex: { color: "#0F6D4C", fontSize: 12, fontWeight: "900" },
  docTextGroup: { flex: 1 },
  docName: { color: "#1D382E", fontSize: 12, fontWeight: "700" },
  docStatusText: { fontSize: 10, fontWeight: "800", marginTop: 2 },
  statusVerified: { color: "#1B8A5A" },
  statusUpload: { color: "#2980B9" },
  statusPending: { color: "#E67E22" },

  statBox: { marginBottom: 8 },
  statLabel: { color: "#7B968B", fontSize: 10, fontWeight: "700" },
  statValIncome: { color: "#1B8A5A", fontSize: 14, fontWeight: "900" },
  statValExpense: { color: "#C0392B", fontSize: 14, fontWeight: "900" },
  statValBalance: { color: "#0F6D4C", fontSize: 15, fontWeight: "900" },

  pageTitle: { color: "#0B4230", fontSize: 20, fontWeight: "900", marginBottom: 14 },
  fullSchemeCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 16, marginBottom: 12 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tagGreen: { backgroundColor: "#E8F6F0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagGreenText: { color: "#1B8A5A", fontSize: 11, fontWeight: "800" },
  tagBlue: { backgroundColor: "#EBF5FB", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagBlueText: { color: "#2980B9", fontSize: 11, fontWeight: "800" },
  fullSchemeTitle: { color: "#0B4230", fontSize: 18, fontWeight: "900" },
  fullSchemeSub: { color: "#547568", fontSize: 13, marginTop: 4 },
  schemeApplyBtn: { marginTop: 12, alignSelf: "flex-end" },
  schemeApplyBtnText: { color: "#0F6D4C", fontSize: 13, fontWeight: "900" },

  chatBubble: { padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: "80%" },
  userBubble: { backgroundColor: "#0F6D4C", alignSelf: "flex-end" },
  assistantBubble: { backgroundColor: "#ffffff", alignSelf: "flex-start" },
  userChatText: { color: "#ffffff", fontSize: 14 },
  assistantChatText: { color: "#0B4230", fontSize: 14 },
  chatInputRow: { flexDirection: "row", padding: 12, gap: 8, backgroundColor: "#ffffff" },
  chatInput: { flex: 1, backgroundColor: "#F3F7F5", borderRadius: 12, paddingHorizontal: 14, color: "#0B4230" },
  chatSendBtn: { backgroundColor: "#0F6D4C", paddingHorizontal: 16, borderRadius: 12, justifyContent: "center" },
  chatSendText: { color: "#ffffff", fontWeight: "900" },

  dashCard: { backgroundColor: "#ffffff", padding: 16, borderRadius: 18 },
  dashCardTitle: { color: "#0B4230", fontSize: 16, fontWeight: "900" },
  dashCardSub: { color: "#547568", fontSize: 13, marginTop: 4 },

  profileCard: { backgroundColor: "#ffffff", padding: 18, borderRadius: 18 },
  profileName: { color: "#0B4230", fontSize: 20, fontWeight: "900" },
  profileRole: { color: "#547568", fontSize: 14, marginTop: 4 },
  profileMeta: { color: "#0F6D4C", fontSize: 14, fontWeight: "800", marginTop: 8 },

  floatingVoiceContainer: { position: "absolute", bottom: 65, left: 0, right: 0, alignItems: "center", zIndex: 10 },
  voiceCallout: { backgroundColor: "#0F6D4C", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 6 },
  voiceCalloutText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  bigMicButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#0D6246", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#ffffff", elevation: 6 },
  bigMicActive: { backgroundColor: "#E67E22" },
  bigMicIcon: { fontSize: 24 },

  bottomNavBar: { flexDirection: "row", backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#E1ECE6", paddingVertical: 8, paddingBottom: 12 },
  navTabItem: { flex: 1, alignItems: "center" },
  navTabIcon: { fontSize: 18, color: "#8BB0A0" },
  navTabIconActive: { color: "#0F6D4C" },
  navTabLabel: { fontSize: 10, fontWeight: "700", color: "#8BB0A0", marginTop: 2 },
  navTabLabelActive: { color: "#0F6D4C" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: "#0B4230", fontSize: 20, fontWeight: "900" },
  modalSub: { color: "#547568", fontSize: 14, marginTop: 4 },
  modalBadges: { marginTop: 12, gap: 4 },
  modalBadgeText: { color: "#0F6D4C", fontSize: 14, fontWeight: "800" },
  modalCloseBtn: { marginTop: 20, backgroundColor: "#F3F7F5", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalCloseText: { color: "#0B4230", fontWeight: "900" },
});
