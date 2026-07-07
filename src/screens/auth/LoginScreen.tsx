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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { signIn, signInWithGoogle, resetPassword } from '../../supabase/services/auth';
import Wordmark from '../../components/Wordmark';
import AuthField from '../../components/AuthField';
import PrimaryButton from '../../components/PrimaryButton';
import type { AuthStackScreenProps } from '../../navigation/types';

export default function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation happens automatically — RootNavigator reacts to onAuthStateChange
    } catch (e: any) {
      setError(friendlyAuthError(e.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      // Returns null if the user closed the browser sheet — not an error.
      await signInWithGoogle();
      // Navigation happens automatically — RootNavigator reacts to onAuthStateChange
    } catch (e: any) {
      setError(e.message ?? 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email above first.');
      return;
    }
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,136,255,0.25)', 'transparent']}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Wordmark height={30} />
            <Text style={styles.tagline}>The everyday wellness pass.</Text>
          </View>

          <View style={styles.fields}>
            <AuthField
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); setResetSent(false); }}
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
              secure
              autoComplete="current-password"
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          {resetSent && (
            <Text style={styles.success}>Password reset email sent — check your inbox.</Text>
          )}

          <View style={styles.cta}>
            <PrimaryButton
              title={loading ? 'Signing in…' : 'Sign in'}
              onPress={handleSignIn}
              loading={loading}
            />
          </View>

          {/* ── Social sign-in ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={16} color={colors.paper} />
            <Text style={styles.googleText}>
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <View style={styles.links}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgot}>Forgot your password?</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupHint}>No account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Map raw Supabase error messages to user-friendly strings */
function friendlyAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (message.includes('Email not confirmed')) return 'Please confirm your email first.';
  if (message.includes('Too many requests')) return 'Too many attempts — wait a moment and try again.';
  return message;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingHorizontal: 24, gap: 0 },
  brand: { alignItems: 'center', gap: 10, marginBottom: 48 },
  tagline: { fontSize: 16, fontStyle: 'italic', color: colors.paper2 },
  fields: { gap: 12 },
  error: {
    fontSize: 13,
    color: colors.destructive,
    textAlign: 'center',
    marginTop: 10,
  },
  success: {
    fontSize: 13,
    color: colors.moss,
    textAlign: 'center',
    marginTop: 10,
  },
  cta: { marginTop: 22 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line2 },
  dividerText: { fontSize: 12, color: colors.paper3 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: colors.ink2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  googleText: { fontSize: 15, fontWeight: '600', color: colors.paper },
  links: { marginTop: 20, alignItems: 'center', gap: 16 },
  forgot: { fontSize: 13, color: colors.paper2 },
  signupRow: { flexDirection: 'row', alignItems: 'center' },
  signupHint: { fontSize: 13, color: colors.paper3 },
  signupLink: { fontSize: 13, color: colors.blueMid, fontWeight: '600' },
});
