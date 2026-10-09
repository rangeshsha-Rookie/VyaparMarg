import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "./src/lib/supabase";

type Profile = { business_name: string | null; business_type: string; state: string; district: string | null };
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Sign in to load your business assistant.");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void restoreSession(); }, []);
  async function restoreSession() { const { data } = await supabase.auth.getSession(); if (data.session) await loadProfile(data.session.access_token); }
  async function loadProfile(token: string) {
    const response = await fetch(`${apiBaseUrl}/business-profiles`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
    const profiles = (await response.json()) as Profile[];
    setProfile(profiles[0] ?? null);
    setMessage(profiles[0] ? "Your Maharashtra business profile is ready." : "Create your business profile from the web demo first.");
  }
  async function signIn() {
    setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) { setMessage(error?.message ?? "Could not sign in."); setBusy(false); return; }
    try { await loadProfile(data.session.access_token); } catch (loadError) { setMessage(loadError instanceof Error ? loadError.message : "Could not load your profile."); } finally { setBusy(false); }
  }
  async function signOut() { await supabase.auth.signOut(); setProfile(null); setMessage("Signed out."); }

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.container}>
      <View style={styles.brandRow}><Text style={styles.brand}>Vyapar<Text style={styles.brandAccent}>Marg</Text></Text><Text style={styles.miniLabel}>MAHARASHTRA</Text></View>
      <Text style={styles.title}>Your rural business assistant</Text>
      <Text style={styles.subtitle}>Schemes, marketplaces, and digital tools—explained simply.</Text>
      {profile ? <View style={styles.profileCard}>
        <Text style={styles.eyebrow}>BUSINESS PROFILE</Text><Text style={styles.profileName}>{profile.business_name ?? "Your business"}</Text>
        <Text style={styles.profileMeta}>{profile.business_type} · {profile.district ?? profile.state}</Text><Text style={styles.message}>{message}</Text>
        <Pressable style={styles.secondaryButton} onPress={signOut}><Text style={styles.secondaryText}>Sign out</Text></Pressable>
      </View> : <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Continue to your assistant</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#7890aa" style={styles.input} value={email} onChangeText={setEmail} />
        <TextInput secureTextEntry placeholder="Password" placeholderTextColor="#7890aa" style={styles.input} value={password} onChangeText={setPassword} />
        <Pressable style={styles.primaryButton} onPress={signIn} disabled={busy}>{busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryText}>Sign in</Text>}</Pressable>
        <Text style={styles.message}>{message}</Text>
      </View>}
      <View style={styles.featureRow}><View style={styles.feature}><Text style={styles.featureIcon}>✦</Text><Text style={styles.featureText}>Find the right scheme</Text></View><View style={styles.feature}><Text style={styles.featureIcon}>◌</Text><Text style={styles.featureText}>Get help in your language</Text></View></View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#eef5fb" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 28, maxWidth: 620, width: "100%", alignSelf: "center" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "#13498a", fontSize: 25, fontWeight: "800", letterSpacing: -1 }, brandAccent: { color: "#e78322" }, miniLabel: { color: "#5d7896", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: "#123963", fontSize: 32, fontWeight: "800", lineHeight: 38, marginTop: 52 }, subtitle: { color: "#54708d", fontSize: 16, lineHeight: 24, marginTop: 10, marginBottom: 28 },
  formCard: { backgroundColor: "#ffffff", borderRadius: 22, padding: 20, shadowColor: "#173d61", shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 }, profileCard: { backgroundColor: "#e4f4e9", borderRadius: 22, padding: 22, borderWidth: 1, borderColor: "#c6e7d0" },
  eyebrow: { color: "#327050", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, cardTitle: { color: "#183c63", fontSize: 18, fontWeight: "800", marginBottom: 14 }, profileName: { color: "#183c63", fontSize: 24, fontWeight: "800", marginTop: 10 }, profileMeta: { color: "#4d6b87", fontSize: 15, marginTop: 4 },
  input: { backgroundColor: "#f0f6fb", borderRadius: 12, color: "#183c63", fontSize: 16, paddingHorizontal: 15, paddingVertical: 14, marginBottom: 12 }, primaryButton: { alignItems: "center", backgroundColor: "#1760a8", borderRadius: 12, minHeight: 50, justifyContent: "center", marginTop: 4 }, primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "800" }, secondaryButton: { alignItems: "center", borderColor: "#7caf8b", borderRadius: 12, borderWidth: 1, marginTop: 18, paddingVertical: 12 }, secondaryText: { color: "#327050", fontWeight: "800" }, message: { color: "#5d7896", fontSize: 14, lineHeight: 20, marginTop: 14 },
  featureRow: { flexDirection: "row", gap: 12, marginTop: 24 }, feature: { backgroundColor: "#ffffff", borderRadius: 16, flex: 1, minHeight: 104, padding: 15 }, featureIcon: { color: "#e78322", fontSize: 22, fontWeight: "800" }, featureText: { color: "#355575", fontSize: 14, fontWeight: "700", lineHeight: 19, marginTop: 10 },
});
