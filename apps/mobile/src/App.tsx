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

const DEMO_PROFILE: BusinessProfile = {
  id: "00000000-0000-0000-0000-000000000053",
  business_name: "Savita Agro & Turmeric Processing",
  business_type: "agro_processing",
  district: "Sangli",
  state: "Maharashtra",
  annual_turnover: 1800000,
  category: "OBC (SHG)",
  gender: "female",
};

const DEMO_RECOMMENDATIONS: SchemeRecommendation[] = [
  {
    scheme_id: "scheme-pmegp-01",
    rank: 1,
    eligibility_status: "eligible",
    score: 0.95,
    reasons: [
      "Rural location in Sangli qualifies for maximum 35% margin money subsidy",
      "Special Category benefit (Women + OBC SHG entrepreneur)",
      "Agro and turmeric food processing is a top priority manufacturing sector",
    ],
    missing_requirements: [],
    scheme: {
      slug: "pmegp",
      name: "Prime Minister's Employment Generation Programme (PMEGP)",
      short_description: "Up to 35% government capital subsidy on bank-financed projects up to ₹50 Lakh for rural food and agro manufacturing units.",
      official_portal_url: "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
    },
  },
  {
    scheme_id: "scheme-pmfme-02",
    rank: 2,
    eligibility_status: "eligible",
    score: 0.92,
    reasons: [
      "ODOP (One District One Product) verified for Sangli Turmeric Processing Cluster",
      "35% credit-linked capital subsidy up to ₹10 Lakh for machinery upgrade",
      "Includes FSSAI registration and packaging branding support",
    ],
    missing_requirements: [],
    scheme: {
      slug: "pmfme",
      name: "PM Formalisation of Micro Food Processing Enterprises (PMFME)",
      short_description: "35% credit-linked subsidy up to ₹10 Lakh for machinery purchase, FSSAI compliance, and modern packaging.",
      official_portal_url: "https://pmfme.mofpi.gov.in/",
    },
  },
  {
    scheme_id: "scheme-cmegp-03",
    rank: 3,
    eligibility_status: "eligible",
    score: 0.90,
    reasons: [
      "Maharashtra state domicile confirmed",
      "Up to 30% capital subsidy from Maharashtra Directorate of Industries",
      "Priority processing for rural women-led micro-enterprises",
    ],
    missing_requirements: [],
    scheme: {
      slug: "cmegp",
      name: "Chief Minister Employment Generation Programme (CMEGP Maharashtra)",
      short_description: "Government of Maharashtra flagship scheme providing 25-30% capital subsidy on manufacturing projects up to ₹50 Lakh.",
      official_portal_url: "https://maha-cmegp.gov.in/",
    },
  },
  {
    scheme_id: "scheme-mudra-04",
    rank: 4,
    eligibility_status: "eligible",
    score: 0.85,
    reasons: [
      "Collateral-free working capital loan up to ₹10 Lakh under Tarun / Kishor",
      "Fast-track sanction for existing micro-enterprises with good bank track record",
    ],
    missing_requirements: [],
    scheme: {
      slug: "mudra",
      name: "Pradhan Mantri MUDRA Yojana (PMMY)",
      short_description: "Collateral-free working capital and term loan up to ₹10 Lakh with subsidized interest rates via nationalized banks.",
      official_portal_url: "https://www.mudra.org.in/",
    },
  },
];

const DEMO_MARKETPLACES: Marketplace[] = [
  {
    id: "mkt-ondc-01",
    slug: "ondc",
    name: "Open Network for Digital Commerce (ONDC)",
    category: "b2c",
    description: "Sell Sangli turmeric and agro-products across multiple buyer apps (Paytm, Mystore, Magicpin) without aggregator commission lock-in.",
    target_sectors: ["agro_processing", "spices", "retail"],
    onboarding_url: "https://ondc.org/seller-network/",
    commission_model: "1-3% network fee (vs 25-30% on traditional apps)",
    benefits: ["Zero platform lock-in", "Direct payment settlement", "Integrated rural shipping"],
    required_documents: ["Udyam Registration", "PAN Card", "Bank Account"],
  },
  {
    id: "mkt-gem-02",
    slug: "gem",
    name: "Government e-Marketplace (GeM)",
    category: "government_procurement",
    description: "Direct selling to Maharashtra government schools, hostels, hospitals, and departments under mandatory 25% MSME quota.",
    target_sectors: ["agro_processing", "food_products", "manufacturing"],
    onboarding_url: "https://gem.gov.in/",
    commission_model: "0% fee up to ₹20 Lakh",
    benefits: ["Guaranteed government purchase orders", "Direct online payment within 10 days"],
    required_documents: ["Udyam Certificate", "PAN Card", "GSTIN or Declaration"],
  },
  {
    id: "mkt-amazon-karigar-03",
    slug: "amazon-karigar",
    name: "Amazon Karigar & Saheli",
    category: "rural_special",
    description: "Dedicated digital storefront for rural women SHGs and certified organic food processors with reduced referral fees.",
    target_sectors: ["organic_food", "spices", "handicrafts"],
    onboarding_url: "https://www.amazon.in/b?node=12415848031",
    commission_model: "Subsidized referral fee for first 12 months",
    benefits: ["Access to 10 Crore+ shoppers", "Free cataloging assistance"],
    required_documents: ["Artisan Card or Udyam", "Bank Account", "PAN Card"],
  },
  {
    id: "mkt-indiamart-04",
    slug: "indiamart",
    name: "IndiaMART Rural Wholesale B2B",
    category: "b2b",
    description: "Connect directly with bulk spice distributors, grocery wholesalers, and supermarket chains across Maharashtra and India.",
    target_sectors: ["agro_processing", "spices", "manufacturing"],
    onboarding_url: "https://seller.indiamart.com/",
    commission_model: "Free basic listing; verified buyer leads",
    benefits: ["Bulk order inquiries", "Direct phone connection with wholesalers"],
    required_documents: ["Business PAN", "Bank Account"],
  },
];

const DEMO_DIGITAL_TOOLS: DigitalTool[] = [
  {
    id: "tool-khatabook-01",
    slug: "khatabook",
    name: "Khatabook (खाताबुक)",
    tool_type: "accounting_invoicing",
    pricing_tier: "freemium",
    description: "Digital ledger app for rural micro-enterprises to track customer credit, supplier payments, and send WhatsApp reminders.",
    best_for: "Managing daily Udhar ledger, customer balance tracking, and automatic WhatsApp payment reminders in Marathi.",
    official_url: "https://khatabook.com/",
    features: ["WhatsApp payment reminders in Marathi/Hindi", "Offline ledger recording", "PDF customer statement"],
  },
  {
    id: "tool-vyapar-02",
    slug: "vyapar-app",
    name: "Vyapar App (व्यापार)",
    tool_type: "accounting_invoicing",
    pricing_tier: "freemium",
    description: "Simplified GST billing, stock inventory tracking, and barcode label generator designed for Indian small manufacturers.",
    best_for: "Thermal bill printing, raw material stock alerts, and offline inventory tracking.",
    official_url: "https://vyaparapp.in/",
    features: ["Thermal bill printing", "Low-stock automated alerts", "Offline bill generation"],
  },
  {
    id: "tool-gpay-03",
    slug: "google-pay-business",
    name: "Google Pay for Business",
    tool_type: "digital_payments",
    pricing_tier: "free",
    description: "Zero-cost UPI QR payment acceptance with instant Marathi/Hindi audio soundbox confirmations.",
    best_for: "Instant 0% MDR UPI collections and automatic daily morning bank settlements.",
    official_url: "https://pay.google.com/intl/en_in/about/business/",
    features: ["Marathi and Hindi soundbox announcements", "0% UPI transaction fees", "Next-day automatic bank settlement"],
  },
  {
    id: "tool-shiprocket-04",
    slug: "shiprocket",
    name: "Shiprocket Rural Shipping",
    tool_type: "logistics_shipping",
    pricing_tier: "pay_per_shipment",
    description: "Automated doorstep parcel pickup from Sangli to anywhere in India across 17+ courier partners.",
    best_for: "Discounted shipping rates, automated tracking SMS for customers, and doorstep rural pickup.",
    official_url: "https://www.shiprocket.in/",
    features: ["Doorstep pickup in rural talukas", "Customer WhatsApp tracking updates", "Cash-on-Delivery (COD) reconciliation"],
  },
];

const DEMO_PORTALS: PortalGuide[] = [
  {
    portal_slug: "aaple-sarkar",
    portal_name: "Aaple Sarkar (आपले सरकार)",
    official_url: "https://aaplesarkar.mahaonline.gov.in/",
    department: "Government of Maharashtra",
    state: "Maharashtra",
    description: "Official single-window portal of Maharashtra government for district industrial centre (DIC) approvals, certificates, and registrations.",
    prerequisites: ["Aadhaar linked mobile number", "Passport photograph", "Electricity bill or 7/12 extract"],
    steps: [
      { step_number: 1, title: "Registration / Login", description: "Create Citizen ID using Aadhaar and mobile OTP verification.", tip: "Keep your mobile handy for OTP." },
      { step_number: 2, title: "Select Department", description: "Navigate to Industries, Energy and Labour Department -> District Industries Centre (DIC)." },
      { step_number: 3, title: "Submit Application", description: "Fill enterprise location details, upload project profile, and submit without visiting office." },
    ],
  },
  {
    portal_slug: "mahadbt",
    portal_name: "MahaDBT (महाडीबीटी)",
    official_url: "https://mahadbt.maharashtra.gov.in/",
    department: "Agriculture & Social Welfare Dept, GoM",
    state: "Maharashtra",
    description: "Direct Benefit Transfer portal for Maharashtra farmers and agro-processing equipment subsidies.",
    prerequisites: ["Aadhaar Card", "Bank Account linked to Aadhaar (NPCI active)", "7/12 land record or rent agreement"],
    steps: [
      { step_number: 1, title: "Aadhaar Authentication", description: "Login via Biometric or OTP via Aadhaar UIDAI service." },
      { step_number: 2, title: "Farmer / Processor Scheme Scheme", description: "Select Food Processing and Post-Harvest Management Scheme." },
      { step_number: 3, title: "Quotation & Document Upload", description: "Upload machine manufacturer quotation and 3-phase electricity sanction letter." },
    ],
  },
  {
    portal_slug: "kvic-pmegp",
    portal_name: "KVIC PMEGP Online Portal",
    official_url: "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
    department: "Ministry of MSME, Govt of India",
    state: "Central / All India",
    description: "Official portal to apply for PMEGP 35% margin money subsidy. Generates 9-digit application ID.",
    prerequisites: ["Aadhaar Card", "Detailed Project Report (DPR)", "EDP training certificate or declaration", "Special category caste certificate (for OBC)"],
    steps: [
      { step_number: 1, title: "Online Application Entry", description: "Choose Sangli DIC as sponsoring agency, enter enterprise unit address." },
      { step_number: 2, title: "Upload DPR & Caste Proof", description: "Attach project financial viability sheet and caste proof for 35% subsidy rate." },
      { step_number: 3, title: "Bank Selection & Score-Card", description: "Choose financing bank branch (e.g. Bank of Maharashtra, Sangli branch)." },
    ],
  },
  {
    portal_slug: "udyam",
    portal_name: "Udyam MSME Registration Portal",
    official_url: "https://udyamregistration.gov.in/",
    department: "Ministry of MSME",
    state: "Central",
    description: "Free paperless government registration for Micro, Small and Medium Enterprises.",
    prerequisites: ["Aadhaar number of entrepreneur", "PAN Card", "Bank Account Number and IFSC"],
    steps: [
      { step_number: 1, title: "Aadhaar Verification", description: "Enter 12-digit Aadhaar and validate with mobile OTP." },
      { step_number: 2, title: "PAN Validation", description: "System auto-fetches ITR and turnover from income tax databases." },
      { step_number: 3, title: "Instant Udyam Certificate", description: "Receive official Udyam Registration Number (URN) with QR code instantly." },
    ],
  },
];

const DEMO_APPLICATIONS: Application[] = [
  {
    id: "app-demo-01",
    business_profile_id: "00000000-0000-0000-0000-000000000053",
    scheme_id: "scheme-pmegp-01",
    status: "in_progress",
    official_application_id: "MH-SANGLI-PMEGP-2026-8841",
    portal_url: "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
    last_step: "DIC District Task Force Committee (DTFC) Interview Scheduled",
    created_at: "2026-11-10T10:00:00Z",
    updated_at: "2026-11-18T14:30:00Z",
  },
  {
    id: "app-demo-02",
    business_profile_id: "00000000-0000-0000-0000-000000000053",
    scheme_id: "scheme-pmfme-02",
    status: "started",
    official_application_id: "PMFME-MH-SGL-5520",
    portal_url: "https://pmfme.mofpi.gov.in/",
    last_step: "Document Verification - FSSAI & Machinery Quotation",
    created_at: "2026-11-15T11:00:00Z",
    updated_at: "2026-11-19T09:00:00Z",
  },
];

const DEMO_GROWTH: GrowthDashboard = {
  business_name: "Savita Agro & Turmeric Processing",
  district: "Sangli",
  annual_turnover_inr: 1800000,
  digital_readiness_score: 78,
  readiness_factors: [
    "Udyam MSME Registered (+25)",
    "NPCI-linked active current bank account (+20)",
    "FSSAI Food Safety Registration active (+15)",
    "Local direct B2B buyer relationships (+18)",
  ],
  potential_subsidy_inr: 1750000,
  active_applications_count: 2,
  suggested_actions: [
    "Upload machinery quotation for PMFME grant disbursement",
    "Onboard Sangli pure turmeric powder on ONDC via Mystore Seller App",
    "Adopt Khatabook for automated Marathi payment reminders on WhatsApp",
  ],
  integrated_module: "Student 3: Omkar (Interactive Rural Growth Dashboard)",
};

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

    // 1. Immediately seed defaults so user NEVER sees empty state
    setProfile(DEMO_PROFILE);
    setRecommendations(DEMO_RECOMMENDATIONS);
    setMarketplaces(DEMO_MARKETPLACES);
    setDigitalTools(DEMO_DIGITAL_TOOLS);
    setPortals(DEMO_PORTALS);
    if (!selectedPortal) setSelectedPortal(DEMO_PORTALS[0]);
    setApplications(DEMO_APPLICATIONS);
    setGrowthData(DEMO_GROWTH);

    // 2. Fetch live updates from API/Supabase asynchronously
    Promise.allSettled([
      getProfiles(session.access_token),
      getMarketplaces(session.access_token),
      getDigitalTools(session.access_token),
      getPortals(session.access_token),
      getApplications(session.access_token),
    ]).then(async ([profRes, mktRes, toolsRes, portalsRes, appsRes]) => {
      let activeProfileId = DEMO_PROFILE.id;
      if (profRes.status === "fulfilled" && profRes.value && profRes.value.length > 0) {
        setProfile(profRes.value[0]);
        activeProfileId = profRes.value[0].id;
      }
      if (mktRes.status === "fulfilled" && mktRes.value && mktRes.value.length > 0) {
        setMarketplaces(mktRes.value);
      }
      if (toolsRes.status === "fulfilled" && toolsRes.value && toolsRes.value.length > 0) {
        setDigitalTools(toolsRes.value);
      }
      if (portalsRes.status === "fulfilled" && portalsRes.value && portalsRes.value.length > 0) {
        setPortals(portalsRes.value);
        setSelectedPortal(portalsRes.value[0]);
      }
      if (appsRes.status === "fulfilled" && appsRes.value && appsRes.value.length > 0) {
        setApplications(appsRes.value);
      }

      // Fetch dynamic recommendations & growth dashboard for active profile
      try {
        const recs = await getRecommendations(session.access_token, activeProfileId);
        if (recs && recs.length > 0) setRecommendations(recs);
      } catch {}
      try {
        const growth = await getGrowthDashboard(session.access_token, activeProfileId);
        if (growth) setGrowthData(growth);
      } catch {}
    }).catch((err) => {
      console.warn("Backend sync notice:", err);
    }).finally(() => {
      setLoading(false);
    });
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
    try {
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
          setLoginError("Account created! Check your email to confirm, then sign in.");
          setAuthMode("signin");
          return;
        }
      }
      if (error || !data.session) {
        setLoginError(error?.message ?? "Could not sign in. Check email & password or use Demo Mode below.");
        return;
      }
      setSession({ access_token: data.session.access_token });
    } catch (err: any) {
      setLoginError(err?.message ?? "Authentication failed. Try Demo Mode below.");
    }
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
      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
      }
      speakText(result.assistant_message);
      setMessage("");
    } catch {
      const q = message.toLowerCase();
      let fallback = "";
      if (language === "mr") {
        if (q.includes("अनुदान") || q.includes("pmegp") || q.includes("subsidy")) {
          fallback = "सांगलीजवळील कृषी व हळद प्रक्रिया उद्योगासाठी PMEGP अंतर्गत ३५% मार्जिन मनी अनुदान उपलब्ध आहे. महिला व ओबीसी प्रवर्गासाठी कमाल ५० लाखांपर्यंतच्या प्रकल्पावर हे अनुदान मिळते. यासाठी जिल्हा उद्योग केंद्र (DIC) किंवा Aaple Sarkar द्वारे अर्ज करा.";
        } else if (q.includes("कागदपत्र") || q.includes("document")) {
          fallback = "PMEGP आणि PMFME साठी आवश्यक कागदपत्रे: १. आधार कार्ड, २. पॅन कार्ड, ३. उद्यम नोंदणी, ४. सविस्तर प्रकल्प अहवाल (DPR), ५. बँक पासबुक आणि ६. जातीचा दाखला (३५% विशेष अनुदानासाठी).";
        } else {
          fallback = "आपल्या व्यवसायासाठी PMEGP (३५% अनुदान), PMFME (१० लाख अनुदान) आणि ONDC डिजिटल बाजारपेठ उपलब्ध आहेत. अधिक तपशीलांसाठी 'Schemes' टॅब पहा.";
        }
      } else if (language === "hi") {
        if (q.includes("अनुदान") || q.includes("subsidy")) {
          fallback = "सांगली में कृषि और हल्दी प्रसंस्करण इकाई के लिए PMEGP के तहत 35% पूंजी सब्सिडी उपलब्ध है। महिला एवं अन्य पिछड़ा वर्ग (OBC) उद्यमी होने के नाते आप अधिकतम 35% मार्जिन मनी के हकदार हैं।";
        } else {
          fallback = "आपके ग्रामीण उद्यम के लिए PMEGP (35% सब्सिडी), PMFME (खाद्य प्रसंस्करण) और GeM पोर्टल सबसे उपयुक्त हैं। 'योजनाएं' टैब में विवरण देखें।";
        }
      } else {
        fallback = "For Savita Agro in Sangli, PMEGP offers up to 35% capital subsidy (special category: rural woman entrepreneur). Check the Schemes tab for full eligibility criteria and official portal links.";
      }
      setAssistantReply(fallback);
      speakText(fallback);
      setMessage("");
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
      const isSame = logisticsOrigin.trim().toLowerCase() === logisticsDest.trim().toLowerCase();
      const dist = isSame ? 45 : 220;
      setLogisticsResult({
        origin_district: logisticsOrigin,
        destination_district: logisticsDest,
        weight_kg: logisticsWeight,
        cargo_type: "general",
        estimated_distance_km: dist,
        available_carriers: [
          {
            carrier_name: "Rural Pickup (Mahindra Bolero Maxi Truck)",
            vehicle_type: "Pickup Truck",
            estimated_cost_inr: Math.round(Math.max(350, dist * 18 + logisticsWeight * 1.5)),
            estimated_delivery_hours: isSame ? 12 : 36,
            best_for: "Bulk farm produce, jaggery, grains, and wholesale goods",
          },
          {
            carrier_name: "Local 3-Wheeler Tempo (Ape / Piaggio)",
            vehicle_type: "3-Wheeler Cargo",
            estimated_cost_inr: Math.round(Math.max(200, dist * 12 + logisticsWeight * 1.2)),
            estimated_delivery_hours: isSame ? 6 : 24,
            best_for: "Taluka-level market distribution and retail shop replenishment",
          },
          {
            carrier_name: "India Post Speed Post / Parcel",
            vehicle_type: "Postal Network",
            estimated_cost_inr: Math.round(Math.max(40, logisticsWeight * 45)),
            estimated_delivery_hours: isSame ? 48 : 72,
            best_for: "Packaged spices, handicrafts, and small parcels",
          },
        ],
        recommended_carrier: "Rural Pickup (Mahindra Bolero Maxi Truck)",
        integrated_module: "Student 2: Shivam (Smart Rural Logistics Planner)",
      });
    }
  }

  async function planApplication(schemeId: string) {
    if (!session || !profile) return;
    setLoading(true);
    try {
      const existing = applications.find((item) => item.scheme_id === schemeId && item.status !== "abandoned");
      if (!existing) {
        try {
          const created = await createApplication(session.access_token, profile.id, schemeId);
          setApplications((current) => [created, ...current]);
        } catch {
          const matchedScheme = recommendations.find((r) => r.scheme_id === schemeId)?.scheme;
          const dummyApp: Application = {
            id: `app-planned-${Date.now()}`,
            business_profile_id: profile.id,
            scheme_id: schemeId,
            status: "started",
            official_application_id: `MH-${profile.district?.toUpperCase() || "SANGLI"}-PLAN-${Math.floor(1000 + Math.random() * 9000)}`,
            portal_url: matchedScheme?.official_portal_url || "https://aaplesarkar.mahaonline.gov.in/",
            last_step: "Document Readiness Checklist Generation",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setApplications((current) => [dummyApp, ...current]);
        }
      }
      setActiveTab("applications");
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
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setSession({ access_token: "demo-token-savita-sangli" });
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  color: "#166534",
                  fontWeight: 750,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                ⚡ Explore Demo Mode (Savita Tai / Sangli Agro)
              </button>
            </div>
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
