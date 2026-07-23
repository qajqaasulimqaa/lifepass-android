import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WaveIcon from '../../components/WaveIcon';
import { colors } from './coachTheme';
import type { QuestionOption } from '../../types/coach';

type Props = {
  question: string;
  options: QuestionOption[];
  answered: boolean;
  selectedAnswer?: string;           // label of the chosen option
  onSelect: (value: string, label: string) => void;
};

export default function QuestionBubbleMessage({
  question,
  options,
  answered,
  selectedAnswer,
  onSelect,
}: Props) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  function submitOther() {
    const text = otherText.trim();
    if (!text) return;
    onSelect(text, text);
  }

  return (
    <View style={styles.root}>
      {/* Question bubble */}
      <View style={styles.row}>
        <View style={styles.avatar}>
          <WaveIcon size={12} color={colors.paper} />
        </View>
        <View style={styles.bubble}>
          <Text style={styles.questionText}>{question}</Text>
        </View>
      </View>

      {/* Option chips */}
      <View style={styles.chips}>
        {options.map((opt) => {
          const isSelected = answered && selectedAnswer === opt.label;
          const isOtherChip = opt.isOther;

          if (isOtherChip && !answered) {
            // "Other" chip — toggles inline text input
            return (
              <View key="other" style={styles.otherWrap}>
                {!showOtherInput ? (
                  <TouchableOpacity
                    style={styles.chip}
                    onPress={() => setShowOtherInput(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.chipText}>Other</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.otherInputRow}>
                    <TextInput
                      style={styles.otherInput}
                      value={otherText}
                      onChangeText={setOtherText}
                      placeholder="Type here…"
                      placeholderTextColor={colors.paper4}
                      autoFocus
                      returnKeyType="send"
                      onSubmitEditing={submitOther}
                    />
                    <TouchableOpacity
                      style={styles.otherSendBtn}
                      onPress={submitOther}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="arrow-forward" size={14} color={colors.ink} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={opt.label}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                answered && !isSelected && styles.chipDimmed,
              ]}
              onPress={() => !answered && onSelect(opt.value, opt.label)}
              activeOpacity={answered ? 1 : 0.75}
              disabled={answered}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  answered && !isSelected && styles.chipTextDimmed,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { gap: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    // Opaque near-white so the AI's (dark) question text stays readable.
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  questionText: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.ink4,
    borderWidth: 0.8,
    borderColor: colors.line2,
  },
  chipSelected: {
    backgroundColor: colors.paper,
    borderColor: colors.paper,
  },
  chipDimmed: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.paper,
  },
  chipTextSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
  chipTextDimmed: {
    color: colors.paper3,
  },

  // "Other" inline input
  otherWrap: { flexDirection: 'row' },
  otherInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink4,
    borderRadius: 999,
    borderWidth: 0.8,
    borderColor: colors.line2,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 6,
  },
  otherInput: {
    minWidth: 120,
    fontSize: 13,
    color: colors.paper,
  },
  otherSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
