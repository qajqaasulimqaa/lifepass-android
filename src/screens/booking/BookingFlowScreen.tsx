import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { mockVenues } from '../../data/mockVenues';
import { mockSlotsForDate } from '../../data/mockAccount';
import PrimaryButton from '../../components/PrimaryButton';
import Kicker from '../../components/Kicker';
import type { Activity, Venue } from '../../types/venue';
import type { TimeSlot } from '../../types/subscription';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'BookingFlow'>;

const STEPS = ['Date', 'Time', 'Confirm'] as const;

export default function BookingFlowScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { venueId, activityId } = route.params;
  const venue = mockVenues.find((v) => v.id === venueId);
  const activity = venue?.activities.find((a) => a.id === activityId);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const dates = useMemo(() => {
    const today = new Date();
    const days: Date[] = [];
    for (let i = 0; i < 30; i++) {
      days.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
    }
    return days;
  }, []);

  const slots = useMemo(() => mockSlotsForDate(selectedDate), [selectedDate]);

  if (!venue || !activity) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Activity not found</Text>
      </View>
    );
  }

  function handleConfirm() {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setConfirmed(true);
    }, 600);
  }

  if (confirmed) {
    return <SuccessScreen onDone={() => navigation.popToTop()} venue={venue} activity={activity} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title={STEPS[step]}
        onBack={() => (step === 0 ? navigation.goBack() : setStep((step - 1) as 0 | 1 | 2))}
      />

      <StepIndicator step={step} />

      {step === 0 && (
        <DateStep
          dates={dates}
          selected={selectedDate}
          onSelect={setSelectedDate}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <TimeStep
          slots={slots}
          selected={selectedSlot}
          onSelect={setSelectedSlot}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ConfirmStep
          venue={venue}
          activity={activity}
          date={selectedDate}
          slot={selectedSlot}
          confirming={confirming}
          onConfirm={handleConfirm}
        />
      )}
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={20} color={colors.paper} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backButton} />
    </View>
  );
}

function StepIndicator({ step }: { step: 0 | 1 | 2 }) {
  return (
    <View style={styles.steps}>
      {STEPS.map((label, i) => (
        <View key={label} style={styles.stepWrap}>
          <View style={styles.stepCol}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]} />
            <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{label}</Text>
          </View>
          {i < 2 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );
}

function DateStep({
  dates,
  selected,
  onSelect,
  onNext,
}: {
  dates: Date[];
  selected: Date;
  onSelect: (d: Date) => void;
  onNext: () => void;
}) {
  function isSameDay(a: Date, b: Date) {
    return a.toDateString() === b.toDateString();
  }
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.heading}>Select a date</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={stepStyles.list}>
        {dates.map((d) => {
          const active = isSameDay(d, selected);
          const today = isSameDay(d, new Date());
          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[stepStyles.dateRow, active && stepStyles.dateRowActive]}
              onPress={() => onSelect(d)}
              activeOpacity={0.85}
            >
              <View>
                <Text style={[stepStyles.dateWeekday, active && stepStyles.dateActiveText]}>
                  {today ? 'Today' : d.toLocaleDateString([], { weekday: 'long' })}
                </Text>
                <Text style={[stepStyles.dateSub, active && stepStyles.dateActiveSubText]}>
                  {d.toLocaleDateString([], { day: 'numeric', month: 'long' })}
                </Text>
              </View>
              {active && <Ionicons name="checkmark" size={20} color={colors.ink} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={stepStyles.footer}>
        <PrimaryButton title="Next" onPress={onNext} />
      </View>
    </View>
  );
}

function TimeStep({
  slots,
  selected,
  onSelect,
  onNext,
}: {
  slots: TimeSlot[];
  selected: TimeSlot | null;
  onSelect: (s: TimeSlot) => void;
  onNext: () => void;
}) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.heading}>Select a time</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={timeStyles.grid}>
        {slots.map((slot) => {
          const active = selected?.id === slot.id;
          return (
            <TouchableOpacity
              key={slot.id}
              style={[timeStyles.tile, active && timeStyles.tileActive]}
              onPress={() => onSelect(slot)}
              activeOpacity={0.85}
            >
              <Text style={[timeStyles.timeText, active && timeStyles.timeTextActive]}>
                {slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
              {slot.spotsRemaining !== undefined && (
                <Text style={[timeStyles.spots, active && timeStyles.spotsActive]}>
                  {slot.spotsRemaining} left
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={stepStyles.footer}>
        <PrimaryButton title="Next" onPress={onNext} disabled={!selected} />
      </View>
    </View>
  );
}

function ConfirmStep({
  venue,
  activity,
  date,
  slot,
  confirming,
  onConfirm,
}: {
  venue: Venue;
  activity: Activity;
  date: Date;
  slot: TimeSlot | null;
  confirming: boolean;
  onConfirm: () => void;
}) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.heading}>Confirm booking</Text>

      <View style={confirmStyles.card}>
        <ConfirmRow label="Venue" value={venue.name} />
        <ConfirmRow label="Activity" value={activity.name} />
        <ConfirmRow
          label="Date"
          value={date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
        />
        {slot && (
          <ConfirmRow
            label="Time"
            value={slot.startTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          />
        )}
        <ConfirmRow label="Duration" value={`${activity.durationMinutes} min`} />
        <ConfirmRow label="Credits" value={`${activity.creditCost} cr`} highlight />
      </View>

      <View style={stepStyles.footer}>
        <PrimaryButton
          title={confirming ? 'Confirming…' : 'Confirm booking'}
          onPress={onConfirm}
          loading={confirming}
        />
      </View>
    </View>
  );
}

function ConfirmRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={confirmStyles.row}>
      <Text style={confirmStyles.label}>{label.toUpperCase()}</Text>
      <Text style={[confirmStyles.value, highlight && confirmStyles.valueHighlight]}>{value}</Text>
    </View>
  );
}

function SuccessScreen({
  venue,
  activity,
  onDone,
}: {
  venue: Venue;
  activity: Activity;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center' }]}>
      <View style={successStyles.container}>
        <View style={successStyles.checkCircle}>
          <Ionicons name="checkmark" size={48} color={colors.ink} />
        </View>
        <Text style={successStyles.title}>You're booked</Text>
        <Text style={successStyles.subtitle}>
          {activity.name} at {venue.name}
        </Text>
        <Kicker text={`${activity.creditCost} credit${activity.creditCost === 1 ? '' : 's'} spent`} color={colors.skyBlue} />
        <View style={successStyles.button}>
          <PrimaryButton title="Done" onPress={onDone} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  errorText: { color: colors.paper3, textAlign: 'center', marginTop: 80 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.paper },

  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
  },
  stepWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line2 },
  stepDotActive: { backgroundColor: colors.blue },
  stepLabel: { fontSize: 11, fontWeight: '500', color: colors.paper3 },
  stepLabelActive: { color: colors.paper },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.line2, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: colors.blue },
});

const stepStyles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  heading: { fontSize: 22, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  list: { gap: 8, paddingBottom: 20 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  dateRowActive: { backgroundColor: colors.paper, borderColor: colors.paper },
  dateWeekday: { fontSize: 15, fontWeight: '600', color: colors.paper },
  dateSub: { fontSize: 12, color: colors.paper3, marginTop: 2 },
  dateActiveText: { color: colors.ink },
  dateActiveSubText: { color: colors.ink, opacity: 0.6 },
  footer: { paddingVertical: 8 },
});

const timeStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  tile: {
    width: '31%',
    paddingVertical: 14,
    backgroundColor: colors.ink2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 3,
  },
  tileActive: {
    backgroundColor: colors.blueWash,
    borderColor: colors.blue,
  },
  timeText: { fontSize: 14, fontWeight: '600', color: colors.paper },
  timeTextActive: { color: colors.paper },
  spots: { fontSize: 10, color: colors.paper3 },
  spotsActive: { color: colors.paper2 },
});

const confirmStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    gap: 12,
  },
  label: {
    width: 80,
    fontSize: 11,
    fontWeight: '600',
    color: colors.paper3,
    letterSpacing: 0.4,
  },
  value: { flex: 1, fontSize: 14, color: colors.paper, fontWeight: '500' },
  valueHighlight: { color: colors.skyBlue },
});

const successStyles = StyleSheet.create({
  container: { padding: 40, alignItems: 'center', gap: 16 },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '400', color: colors.paper, letterSpacing: -0.6 },
  subtitle: { fontSize: 15, color: colors.paper2, textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: 24 },
});
