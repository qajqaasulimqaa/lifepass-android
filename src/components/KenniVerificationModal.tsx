import { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import PrimaryButton from './PrimaryButton';
import { runKenniVerification } from '../supabase/services/kenni';

type Props = {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
};

/**
 * Identity-verification sheet — mirrors iOS KenniVerificationView. Shown before
 * a monthly-plan checkout (subscriptions require a verified kennitala; passes
 * don't). Runs the native Kenni flow, then hands control back via onVerified.
 */
export default function KenniVerificationModal({ visible, onClose, onVerified }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      const outcome = await runKenniVerification();
      if (outcome === 'verified') {
        setVerified(true);
      }
      // 'cancelled' → user closed the browser; leave the sheet as-is to retry.
    } catch (e: any) {
      setError(e?.message ?? 'Verification was not completed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    // Reset so a re-open starts clean.
    setVerified(false);
    setError(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={30} color={colors.blueMid} />
          </View>

          <Text style={styles.title}>Identity verification</Text>
          <Text style={styles.body}>
            To subscribe to a monthly plan, we need to verify your Icelandic
            national ID (kennitala) through Kenni.is.
          </Text>

          {verified && (
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.moss} />
              <Text style={styles.verifiedText}>Identity verified</Text>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            {verified ? (
              <PrimaryButton title="Continue" onPress={onVerified} />
            ) : (
              <PrimaryButton
                title={loading ? 'Verifying…' : 'Verify with Kenni.is'}
                onPress={handleVerify}
                loading={loading}
              />
            )}
            <TouchableOpacity onPress={handleClose} style={styles.cancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>Visitor passes do not require identity verification.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.ink2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
    gap: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line2,
    marginBottom: 6,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blueWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  body: {
    fontSize: 15,
    color: colors.paper3,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedText: { fontSize: 16, fontWeight: '600', color: colors.moss },
  error: { fontSize: 13, color: colors.destructive, textAlign: 'center', paddingHorizontal: 8 },
  actions: { alignSelf: 'stretch', gap: 6, marginTop: 4 },
  cancel: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 14, color: colors.paper3, fontWeight: '600' },
  note: { fontSize: 12, color: colors.paper3, textAlign: 'center', marginTop: 2 },
});
