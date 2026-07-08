import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { signUp } from '../../supabase/services/auth';
import AuthField from '../../components/AuthField';
import PrimaryButton from '../../components/PrimaryButton';
import type { AuthStackScreenProps } from '../../navigation/types';

export default function SignUpScreen({ navigation }: AuthStackScreenProps<'SignUp'>) {
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kennitala, setKennitala] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
        kennitala.trim() || undefined,
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

  // ── Email confirmation pending state ──────────────────────────────────────
  if (emailSent) {
    return (
      <View style={[styles.container, styles.confirmCenter]}>
        <Ionicons name="mail-outline" size={48} color={colors.skyBlue} />
        <Text style={styles.confirmTitle}>Check your email</Text>
        <Text style={styles.confirmBody}>
          We sent a confirmation link to{'\n'}
          <Text style={{ color: colors.paper }}>{email}</Text>.{'\n\n'}
          Tap the link in your inbox to activate your account, then come back and sign in.
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.confirmCta}>
          <Text style={styles.confirmCtaText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              onChangeText={(v) => { setEmail(v); setError(null); }}
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
            <AuthField
              placeholder="Kennitala (optional)"
              value={kennitala}
              onChangeText={setKennitala}
              keyboardType="number-pad"
            />
            <AuthField
              placeholder="Company code (optional)"
              value={companyCode}
              onChangeText={setCompanyCode}
            />
          </View>

          <Text style={styles.kennitalaHint}>
            Kennitala is optional. If you add it now, we'll walk you through identity
            verification after you confirm your email.
          </Text>

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
  kennitalaHint: { fontSize: 11, color: colors.paper3, marginTop: -8 },
  error: { fontSize: 13, color: colors.destructive, textAlign: 'center' },
  cta: {},
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signinHint: { fontSize: 13, color: colors.paper3 },
  signinLink: { fontSize: 13, color: colors.blueMid, fontWeight: '600' },
  terms: { fontSize: 11, color: colors.paper3, textAlign: 'center', marginTop: 4 },

  // Email confirmation screen
  confirmCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  confirmTitle: { fontSize: 24, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  confirmBody: { fontSize: 15, color: colors.paper3, textAlign: 'center', lineHeight: 22 },
  confirmCta: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 32,
    backgroundColor: colors.blue, borderRadius: 14 },
  confirmCtaText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
