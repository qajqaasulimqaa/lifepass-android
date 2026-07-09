import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { signUp, signIn } from '../../supabase/services/auth';
import AuthField from '../../components/AuthField';
import PrimaryButton from '../../components/PrimaryButton';
import {
  COUNTRY_OPTIONS,
  nationalityFromEmail,
  nationalityLabel,
  normalizeNationality,
} from '../../utils/nationality';
import type { AuthStackScreenProps } from '../../navigation/types';

export default function SignUpScreen({ navigation }: AuthStackScreenProps<'SignUp'>) {
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // ISO alpha-2 nationality code, or '' when unset. Prefilled from the email
  // TLD until the user picks one (mirrors iOS + the website).
  const [nationality, setNationality] = useState('');
  const [nationalityTouched, setNationalityTouched] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Mirror the web/iOS signup: prefill nationality from the email TLD until
  // the user picks one. Generic TLDs (gmail.com, …) leave it blank.
  function handleEmailChange(v: string) {
    setEmail(v);
    setError(null);
    if (!nationalityTouched) setNationality(nationalityFromEmail(v) ?? '');
  }

  function selectNationality(code: string) {
    setNationalityTouched(true);
    setNationality(code);
    setPickerOpen(false);
  }

  async function handleCreate() {
    setError(null);
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      const result = await signUp(
        email.trim(),
        password,
        fullName.trim(),
        normalizeNationality(nationality) ?? undefined,
        marketingOptIn,
      );

      if (!result.session) {
        // Supabase requires email confirmation before a session is issued
        setEmailSent(true);
      }
      // If session exists, RootNavigator reacts automatically via onAuthStateChange
    } catch (e: any) {
      setError(friendlySignUpError(e.message));
    } finally {
      setLoading(false);
    }
  }

  // Tapping the email link confirms the account server-side and lands the
  // browser on lifepass.is (not the app — Android can't deep-link back). So
  // once the user has tapped it, they come back here and this signs them in
  // with the credentials they just entered — no retyping.
  async function handleConfirmedSignIn() {
    setConfirmError(null);
    setConfirming(true);
    try {
      await signIn(email.trim(), password);
      // Session established → RootNavigator switches to the app automatically.
    } catch (e: any) {
      setConfirmError(
        /email not confirmed/i.test(e?.message ?? '')
          ? "Looks like the link hasn't been tapped yet. Open the confirmation link in your email first, then try again."
          : friendlySignUpError(e?.message ?? 'Could not sign in. Please try again.'),
      );
    } finally {
      setConfirming(false);
    }
  }

  // ── Email confirmation pending state ──────────────────────────────────────
  if (emailSent) {
    return (
      <View style={[styles.container, styles.confirmCenter]}>
        <Ionicons name="mail-outline" size={48} color={colors.skyBlue} />
        <Text style={styles.confirmTitle}>Check your email</Text>
        <Text style={styles.confirmBody}>
          We sent a confirmation link to{'\n'}
          <Text style={{ color: colors.paper }}>{email}</Text>.{'\n\n'}
          Tap it to confirm — it opens lifepass.is in your browser. Then come
          back here and tap the button below.
        </Text>

        {confirmError && <Text style={styles.confirmErrorText}>{confirmError}</Text>}

        <View style={styles.confirmActions}>
          <PrimaryButton
            title={confirming ? 'Signing in…' : "I've confirmed — sign me in"}
            onPress={handleConfirmedSignIn}
            loading={confirming}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.confirmSecondary}>
            <Text style={styles.confirmSecondaryText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const nationalityText = nationality
    ? nationalityLabel(nationality) ?? 'Nationality (optional)'
    : 'Nationality (optional)';

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.paper} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your wellness journey in Iceland</Text>
          </View>

          <View style={styles.fields}>
            <AuthField
              placeholder="Full name"
              value={fullName}
              onChangeText={(v) => { setFullName(v); setError(null); }}
              autoCapitalize="words"
              autoComplete="name"
            />
            <AuthField
              placeholder="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthField
              placeholder="Password (min 8 characters)"
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
              secure
              autoComplete="new-password"
            />

            {/* Nationality picker — optional, prefilled from the email TLD */}
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectText, !nationality && styles.selectPlaceholder]}>
                {nationalityText}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.paper3} />
            </TouchableOpacity>

            {/* Marketing opt-in */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                Send me news and offers from LifePass
              </Text>
              <Switch
                value={marketingOptIn}
                onValueChange={setMarketingOptIn}
                trackColor={{ false: colors.ink4, true: colors.blue }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.cta}>
            <PrimaryButton
              title={loading ? 'Creating…' : 'Create account'}
              onPress={handleCreate}
              loading={loading}
            />
          </View>

          <View style={styles.signinRow}>
            <Text style={styles.signinHint}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signinLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Nationality picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nationality</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => selectNationality('')}
              >
                <Text style={[styles.optionText, styles.selectPlaceholder]}>
                  Prefer not to say
                </Text>
                {!nationality && (
                  <Ionicons name="checkmark" size={18} color={colors.blueMid} />
                )}
              </TouchableOpacity>
              {COUNTRY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.code}
                  style={styles.optionRow}
                  onPress={() => selectNationality(opt.code)}
                >
                  <Text style={styles.optionText}>{opt.label}</Text>
                  {nationality === opt.code && (
                    <Ionicons name="checkmark" size={18} color={colors.blueMid} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function friendlySignUpError(message: string): string {
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists.';
  }
  if (message.includes('Password should be')) return 'Password must be at least 8 characters.';
  if (message.includes('valid email')) return 'Please enter a valid email address.';
  return message;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  topBar: { paddingHorizontal: 12, paddingBottom: 8 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 24, gap: 24, paddingTop: 16 },
  header: { gap: 8, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '400', color: colors.paper, letterSpacing: -0.6 },
  subtitle: { fontSize: 14, color: colors.paper3 },
  fields: { gap: 14 },
  error: { fontSize: 13, color: colors.destructive, textAlign: 'center' },
  cta: {},
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signinHint: { fontSize: 13, color: colors.paper3 },
  signinLink: { fontSize: 13, color: colors.blueMid, fontWeight: '600' },
  terms: { fontSize: 11, color: colors.paper3, textAlign: 'center', marginTop: 4 },

  // Nationality select field (matches AuthField metrics)
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.ink2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  selectText: { fontSize: 15, color: colors.paper },
  selectPlaceholder: { color: colors.paper3 },

  // Marketing toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  toggleLabel: { flex: 1, fontSize: 13, color: colors.paper2, lineHeight: 18 },

  // Picker modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    maxHeight: '70%',
    backgroundColor: colors.ink2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line2,
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.paper, marginBottom: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
  },
  optionText: { fontSize: 15, color: colors.paper },

  // Email confirmation screen
  confirmCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  confirmTitle: { fontSize: 24, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  confirmBody: { fontSize: 15, color: colors.paper3, textAlign: 'center', lineHeight: 22 },
  confirmErrorText: { fontSize: 13, color: colors.destructive, textAlign: 'center' },
  confirmActions: { alignSelf: 'stretch', gap: 8, marginTop: 8 },
  confirmSecondary: { alignItems: 'center', paddingVertical: 10 },
  confirmSecondaryText: { fontSize: 14, color: colors.blueMid, fontWeight: '600' },
});
