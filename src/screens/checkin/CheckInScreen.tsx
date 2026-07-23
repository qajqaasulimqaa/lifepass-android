import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../theme';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useSubscription } from '../../supabase/hooks/useSubscription';
import { walkInCheckIn, CheckInError } from '../../supabase/services/checkin';
import {
  createWalkInPaymentSession,
  confirmBookingPaymentSession,
} from '../../supabase/services/bookings';
import { fetchVenueById } from '../../supabase/services/venues';
import { PAYMENT_SUCCESS_URL } from '../../supabase/services/payments';
import { ApiError, type ChargeOffer } from '../../api/client';
import { gateRefusalFor } from '../../api/gateRefusal';
import { venueIdFromScan } from '../../checkin/walkInQrParser';
import type { CheckInStackParamList } from '../../navigation/types';
import BrandedTopBar from '../../components/BrandedTopBar';
import PrimaryButton from '../../components/PrimaryButton';
import Kicker from '../../components/Kicker';

type Mode = 'idle' | 'scanning' | 'processing' | 'success';

function dateReceipt(date: Date): string {
  const day = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} · ${time}`;
}

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { refetch: refetchSubscription } = useSubscription();
  const route = useRoute<RouteProp<CheckInStackParamList, 'CheckInMain'>>();
  const navigation = useNavigation();

  const [mode, setMode] = useState<Mode>('idle');
  const [scannedVenueName, setScannedVenueName] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const scannedRef = useRef(false);
  // One idempotency key per check-in attempt, reused across the charge-consent
  // re-POST so consenting can't double check-in.
  const checkInKey = useRef<string | null>(null);

  // A scanned venue-QR App Link routes here with the venue id parked as a
  // param (App.tsx → routeToCheckIn). Run the walk-in straight away and
  // consume the param so a repeat scan of the same venue re-triggers.
  const autoVenueId = route.params?.autoCheckInVenueId;
  useEffect(() => {
    if (!autoVenueId) return;
    navigation.setParams({ autoCheckInVenueId: undefined } as never);
    runCheckIn(autoVenueId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVenueId]);

  function handleStartScan() {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    scannedRef.current = false;
    setMode('scanning');
  }

  // Run the check-in for a resolved venue id (from the camera scanner or a
  // deep link) and drive the processing → success UI. A charge-bearing (à-la-
  // carte) venue returns 402 charge_consent_required — disclose the price and
  // re-run with consent via the `offer` argument.
  async function runCheckIn(venueId: string, offer?: ChargeOffer) {
    if (scannedRef.current && !offer) return; // camera repeat / re-entry
    scannedRef.current = true;
    setMode('processing');
    try {
      // Fresh attempt gets a new key; the consent re-POST reuses it.
      if (!offer) checkInKey.current = Crypto.randomUUID();
      const key = checkInKey.current ?? Crypto.randomUUID();
      checkInKey.current = key;
      const r = await walkInCheckIn(venueId, {
        idempotencyKey: key,
        ...(offer ? { acceptCharge: true, acceptedChargeAmountIsk: offer.amountIsk } : {}),
      });
      checkInKey.current = null;
      setScannedVenueName(r.venueName);
      setReceipt(dateReceipt(new Date()));
      setMode('success');
      refetchSubscription();   // refresh the global credits/plan pill
    } catch (e) {
      if (e instanceof ApiError && e.status === 402 && e.offer) {
        const off = e.offer;
        const price = `${off.amountIsk.toLocaleString('is-IS')} kr`;
        scannedRef.current = false;
        setMode('idle');
        Alert.alert('Payment required', `This venue costs ${price} per visit. Pay and check in?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: `Pay ${price}`, onPress: () => void runCheckIn(venueId, off) },
        ]);
        return;
      }
      if (e instanceof ApiError && e.code === 'no_payment_method_on_file' && offer) {
        // No vaulted card — pay the surcharge on Kling's hosted page (which
        // also saves the card), then the walk-in completes with those funds.
        await startWalkInPayAndSaveCard(venueId, offer);
        return;
      }
      // Reset to idle so the user can try again, then surface the error.
      scannedRef.current = false;
      setMode('idle');
      // Gate refusals (no plan, boutique membership, caps) get friendly copy
      // + a "View plans" CTA instead of the raw code.
      const refusal = e instanceof ApiError ? gateRefusalFor(e.code) : null;
      if (refusal) {
        Alert.alert(
          refusal.title,
          refusal.message,
          refusal.needsMembership
            ? [
                { text: 'Not now', style: 'cancel' },
                {
                  text: 'View plans',
                  onPress: () =>
                    (navigation.navigate as (name: string, params?: object) => void)('Home', {
                      screen: 'TopUp',
                    }),
                },
              ]
            : [{ text: 'OK' }],
        );
        return;
      }
      const message =
        e instanceof CheckInError ? e.message
        : e instanceof Error ? e.message
        : 'Check-in failed.';
      Alert.alert('Check-in failed', message);
    }
  }

  // Pay-and-save-card rail for a no-saved-card surcharge walk-in. Creates the
  // amount-only Kling session (SAME idempotency key as the walk-in), opens the
  // hosted page, then confirms on return. Mirrors the booking rail.
  async function startWalkInPayAndSaveCard(venueId: string, offer: ChargeOffer) {
    const key = checkInKey.current ?? Crypto.randomUUID();
    checkInKey.current = key;
    try {
      const session = await createWalkInPaymentSession(
        { venueId, acceptedChargeAmountIsk: offer.amountIsk },
        key,
      );
      if (session.hasCard) {
        // A card exists now — check in directly with consent (reuses the key).
        await runCheckIn(venueId, offer);
        return;
      }
      const web = await WebBrowser.openAuthSessionAsync(session.url, PAYMENT_SUCCESS_URL);
      const cancelLeg =
        web.type !== 'success' || !web.url || web.url.includes('payment-canceled');
      await settleWalkInPayment(venueId, key, cancelLeg);
    } catch (e) {
      scannedRef.current = false;
      setMode('idle');
      if (e instanceof ApiError && e.status === 402 && e.offer) {
        const off = e.offer;
        const price = `${off.amountIsk.toLocaleString('is-IS')} kr`;
        Alert.alert('Price updated', `The price is now ${price}. Continue?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: `Pay ${price}`, onPress: () => void runCheckIn(venueId, off) },
        ]);
      } else {
        Alert.alert('Payment failed', e instanceof Error ? e.message : 'Payment could not be started.');
      }
    }
  }

  // Verify the walk-in payment: the confirm vaults the card and records the
  // check-in. Success leg polls (capture can lag the redirect); cancel leg
  // checks once. Idempotent, so "Check again" is safe.
  async function settleWalkInPayment(venueId: string, key: string, cancelLeg: boolean) {
    const maxAttempts = cancelLeg ? 1 : 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 2500));
      let conf;
      try {
        conf = await confirmBookingPaymentSession(key);
      } catch {
        continue; // transient — keep trying within the attempt budget
      }
      if (conf.status === 'fulfilled') {
        checkInKey.current = null;
        // Confirm carries no venue name — resolve it for the success screen.
        const venue = await fetchVenueById(venueId).catch(() => null);
        setScannedVenueName(venue?.name ?? 'Venue');
        setReceipt(dateReceipt(new Date()));
        setMode('success');
        refetchSubscription();
        return;
      }
      if (conf.status === 'processing') {
        if (attempt < maxAttempts - 1) continue; // keep polling, stay in processing
        scannedRef.current = false;
        setMode('idle');
        Alert.alert('Still processing', 'Your payment is still processing.', [
          { text: 'Later', style: 'cancel' },
          { text: 'Check again', onPress: () => void settleWalkInPayment(venueId, key, false) },
        ]);
        return;
      }
      // Terminal non-success outcomes.
      scannedRef.current = false;
      setMode('idle');
      if (conf.status === 'refunded') {
        Alert.alert('Payment refunded', 'You were refunded in full. Please try again.');
      } else if (conf.status === 'expired') {
        Alert.alert('Payment expired', 'The payment window expired and you were not charged. Please try again.');
      } else {
        Alert.alert(
          'Payment received',
          "We're finalizing your check-in. If it doesn't complete shortly, contact support@lifepass.is.",
        );
      }
      return;
    }
    scannedRef.current = false;
    setMode('idle');
    Alert.alert("Couldn't confirm payment", 'Please check your connection and try again.', [
      { text: 'Later', style: 'cancel' },
      { text: 'Check again', onPress: () => void settleWalkInPayment(venueId, key, false) },
    ]);
  }

  function handleBarcode(result?: { data?: string }) {
    if (scannedRef.current) return;
    // Accept exactly what the printed posters use — canonical /scan?v= URL,
    // legacy JSON, or a bare UUID — via the shared parser (matches iOS).
    const venueId = venueIdFromScan(result?.data ?? '');
    if (!venueId) {
      Alert.alert(
        'Unrecognized code',
        "That doesn't look like a LifePass venue code. Please scan the QR at the front desk.",
      );
      return; // stay in scanning mode so they can try again
    }
    runCheckIn(venueId);
  }

  function reset() {
    scannedRef.current = false; // allow a fresh scan / deep link after Done
    setMode('idle');
    setScannedVenueName(null);
    setReceipt(null);
  }

  if (mode === 'scanning') {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcode}
        />

        <View pointerEvents="none" style={styles.frameOverlay}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.frameLabel}>Point at the venue's QR code</Text>
        </View>

        <View style={[styles.scannerTop, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setMode('idle')}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'processing') {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.processingCard}>
          <Text style={styles.processingText}>Processing…</Text>
        </View>
      </View>
    );
  }

  if (mode === 'success' && scannedVenueName) {
    return (
      <View style={styles.container}>
        <BrandedTopBar
          title="Studio check-in"
          subtitle="For your classes"
        />
        <View style={successStyles.container}>
          <View style={successStyles.checkCircle}>
            <View style={successStyles.checkRing} />
            <Ionicons name="checkmark" size={56} color={colors.ink} />
          </View>
          <Text style={successStyles.title}>Checked in</Text>
          <Text style={successStyles.venue}>{scannedVenueName}</Text>
          {receipt && <Kicker text={receipt} color={colors.paper3} />}
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <PrimaryButton title="Done" onPress={reset} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BrandedTopBar
        title="Studio check-in"
        subtitle="For your classes"
      />

      <View style={idleStyles.container}>
        <LinearGradient
          colors={[colors.ink2, colors.ink3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={idleStyles.heroCard}
        >
          <View style={idleStyles.qrCircle}>
            <Ionicons name="qr-code" size={56} color={colors.blue} />
          </View>
          <Text style={idleStyles.heroTitle}>Scan to check in</Text>
          <Text style={idleStyles.heroBody}>
            Point your camera at the venue's QR code at the front desk to check in and walk
            straight in.
          </Text>
        </LinearGradient>

        {permission?.status === 'denied' && (
          <View style={idleStyles.permissionCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.destructive} />
            <Text style={idleStyles.permissionText}>
              Camera access was denied. Enable it in Settings to scan.
            </Text>
          </View>
        )}

        <View>
          <PrimaryButton
            title={permission?.granted ? 'Open scanner' : 'Allow camera & scan'}
            onPress={handleStartScan}
            icon="qr-code-outline"
          />
        </View>

        <View style={idleStyles.todaysList}>
          <Kicker text="Today's bookings" color={colors.paper3} />
          <View style={idleStyles.emptyBookings}>
            <Ionicons name="calendar-outline" size={20} color={colors.paper3} />
            <Text style={idleStyles.emptyText}>No bookings to check into today.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center' },
  scannerTop: { paddingHorizontal: 16 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  frame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#FFFFFF' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  frameLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  processingCard: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  processingText: { color: colors.paper, fontSize: 14, fontWeight: '500' },
});

const idleStyles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 20 },
  heroCard: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 16,
  },
  qrCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.blueWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  heroBody: { fontSize: 13, color: colors.paper3, textAlign: 'center', lineHeight: 19 },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.ink2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  permissionText: { flex: 1, fontSize: 12, color: colors.paper2 },
  todaysList: { gap: 10 },
  emptyBookings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.ink2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  emptyText: { fontSize: 13, color: colors.paper3 },
});

const successStyles = StyleSheet.create({
  container: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 12 },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(168,216,240,0.4)',
  },
  title: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '400', color: colors.paper, letterSpacing: -0.6 },
  venue: { fontSize: 16, color: colors.paper2, textAlign: 'center', marginBottom: 4 },
  divider: { height: 0.5, alignSelf: 'stretch', backgroundColor: colors.line, marginVertical: 16 },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  creditsLabel: { fontSize: 13, color: colors.paper3 },
  creditsValue: { fontSize: 24, fontWeight: '700', color: colors.blue },
});
