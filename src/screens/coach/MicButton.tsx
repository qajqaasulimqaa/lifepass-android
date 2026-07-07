// Coach voice dictation — tap to talk, tap again to stop; live transcript
// streams into the input. Mirrors the iOS Coach mic (SFSpeechRecognizer).
//
// IMPORTANT: this file statically imports `expo-speech-recognition`, whose
// native module is ABSENT in Expo Go — the import throws there. So this
// component must only ever be loaded when that module exists. CoachScreen
// guards it behind a try/catch require; never import this from Expo Go paths.
import { useState, useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { colors } from '../../theme';

type Props = {
  /** Called with the (growing) transcript as the user speaks. */
  onTranscript: (text: string) => void;
};

export default function MicButton({ onTranscript }: Props) {
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (transcript) onTranscript(transcript);
  });
  useSpeechRecognitionEvent('error', () => setListening(false));

  const toggle = useCallback(async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Microphone access needed',
        'Enable microphone and speech recognition in Settings to talk to your coach.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      Alert.alert('Voice input unavailable', "Speech recognition isn't available on this device.");
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true, // stream partial text as you speak (live dictation)
      continuous: false, // stop on a natural pause
    });
  }, [listening, onTranscript]);

  return (
    <TouchableOpacity
      style={[styles.mic, listening && styles.micActive]}
      onPress={toggle}
      activeOpacity={0.7}
    >
      <Ionicons
        name={listening ? 'mic' : 'mic-outline'}
        size={22}
        color={listening ? colors.skyBlue : 'rgba(255,255,255,0.55)'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mic: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  micActive: {
    backgroundColor: 'rgba(168,216,240,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.35)',
  },
});
