import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { checkInConfirmationCode, type RecentCheckIn } from '../supabase/types/profile';

// Staff proof for a recent check-in — mirrors lifepass-ios HomeView
// checkInProofBanner / checkInProofScreen. A member checks in on the app, walks
// to reception, and holds this up. There is no countdown: the server owns the
// window and drops `recentCheckIn` when it lapses, so the banner just disappears
// on the next profile refresh.

// "Tue 23 Apr · 14:32" — matches the scanner's own success receipt.
function formatProofDate(d: Date): string {
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${wd} ${d.getDate()} ${mon} · ${hh}:${mm}`;
}

export default function CheckInProofBanner({ checkIn }: { checkIn: RecentCheckIn }) {
  const insets = useSafeAreaInsets();
  const [showProof, setShowProof] = useState(false);

  return (
    <>
      {/* Banner — takes the top slot above the hero, carries its own notch pad. */}
      <View style={[styles.banner, { paddingTop: insets.top + 12 }]}>
        <Ionicons name="checkmark-circle" size={22} color={colors.blue} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle} numberOfLines={1}>You&apos;re checked in</Text>
          <Text style={styles.bannerVenue} numberOfLines={1}>{checkIn.venue.name}</Text>
        </View>
        <TouchableOpacity style={styles.showBtn} onPress={() => setShowProof(true)} activeOpacity={0.85}>
          <Text style={styles.showBtnText}>Show to staff</Text>
        </TouchableOpacity>
      </View>

      {/* Proof — read at arm's length by staff. Who → where → what → when. */}
      <Modal
        visible={showProof}
        animationType="slide"
        onRequestClose={() => setShowProof(false)}
        presentationStyle="fullScreen"
      >
        <View style={[styles.proof, { paddingTop: insets.top }]}>
          <View style={styles.proofBody}>
            <Ionicons name="checkmark-circle" size={56} color={colors.blue} />
            <Text style={styles.proofTitle}>Checked in</Text>
            <Text style={styles.proofCode}>CONFIRMATION · {checkInConfirmationCode(checkIn)}</Text>

            <View style={styles.card}>
              {!!checkIn.memberName && <ProofRow label="Member" value={checkIn.memberName} />}
              <ProofRow label="Venue" value={checkIn.venue.name} />
              <ProofRow label="Activity" value={checkIn.activity?.name ?? 'Walk-in'} />
              <ProofRow label="Time" value={formatProofDate(checkIn.checkedInAt)} last />
            </View>

            <Text style={styles.hint}>Show this screen to the staff at reception.</Text>
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, { marginBottom: insets.bottom + 24 }]}
            onPress={() => setShowProof(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

function ProofRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Banner ──
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.ink2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
  },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: colors.paper },
  bannerVenue: { fontSize: 12, color: colors.paper2 },
  showBtn: {
    backgroundColor: colors.blue,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  showBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  // ── Proof screen ──
  proof: { flex: 1, backgroundColor: colors.ink, justifyContent: 'space-between' },
  proofBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 },
  proofTitle: {
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -0.6,
  },
  proofCode: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: colors.paper3,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.ink2,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.line,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  hint: { fontSize: 13, color: colors.paper3, textAlign: 'center', paddingHorizontal: 12 },

  // ── Rows ──
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14, color: colors.paper3 },
  rowValue: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.paper, textAlign: 'right' },

  // ── Done ──
  doneBtn: {
    marginHorizontal: 24,
    backgroundColor: colors.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
