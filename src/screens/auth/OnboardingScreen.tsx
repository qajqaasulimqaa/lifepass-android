import { useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import Kicker from '../../components/Kicker';
import PrimaryButton from '../../components/PrimaryButton';
import type { AuthStackScreenProps } from '../../navigation/types';

type Stage = 'splash' | 1 | 2 | 3;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SPLASH_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80';

const SLIDE_DATA = {
  1: {
    kicker: '01 — Forty venues',
    plain: 'Lagoons, studios,\nsaunas, gyms — ',
    italic: 'one tap away.',
    body: 'From Sky Lagoon to the basement mats at Mjölnir. Every partner, one pass.',
    image: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8?auto=format&fit=crop&w=1400&q=80',
  },
  2: {
    kicker: '02 — Credits, not chaos',
    plain: 'Pay for how\nyou ',
    italic: 'actually',
    plain2: ' show up.',
    body: 'One yoga class, one credit. A lagoon ritual, four. Pick a plan that matches your tempo. Cancel after three months.',
    image: 'https://images.unsplash.com/photo-1610552050890-fe99536c2615?auto=format&fit=crop&w=1400&q=80',
  },
  3: {
    kicker: '03 — One code, every door',
    plain: 'Scan in.\n',
    italic: 'No queue at the desk.',
    body: 'Your personal QR works at every partner. Credits deduct automatically — never fumble for cash at the lobby.',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=1400&q=80',
  },
} as const;

export default function OnboardingScreen({ navigation }: AuthStackScreenProps<'Onboarding'>) {
  const [stage, setStage] = useState<Stage>('splash');
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);

  function goToSignUp() {
    setHasSeenOnboarding(true);
    navigation.navigate('SignUp');
  }
  function goToLogin() {
    setHasSeenOnboarding(true);
    navigation.navigate('Login');
  }

  if (stage === 'splash') {
    return <SplashStage onGetStarted={() => setStage(1)} onLogin={goToLogin} />;
  }

  return (
    <SlideStage
      index={stage}
      onNext={() => {
        if (stage < 3) setStage((stage + 1) as Stage);
        else goToSignUp();
      }}
      onSkip={goToSignUp}
      onBack={() => {
        if (stage === 1) setStage('splash');
        else setStage((stage - 1) as Stage);
      }}
    />
  );
}

function SplashStage({
  onGetStarted,
  onLogin,
}: {
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={{ uri: SPLASH_IMAGE }} style={styles.fullScreen} resizeMode="cover">
      <LinearGradient
        colors={['rgba(15,23,42,0.25)', 'rgba(15,23,42,0.55)', 'rgba(15,23,42,0.95)']}
        locations={[0, 0.45, 1.0]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.splashContent,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <Kicker text="Iceland · Wellness pass" color={colors.paper2} />

        <Text style={splashStyles.headline}>
          The stillness{'\n'}of Iceland,{'\n'}
          <Text style={splashStyles.italic}>on one pass.</Text>
        </Text>

        <Text style={splashStyles.body}>
          Forty places to be still, strong, or seen. One membership. No small talk.
        </Text>

        <View style={splashStyles.actions}>
          <PrimaryButton title="Get started" onPress={onGetStarted} />
          <TouchableOpacity onPress={onLogin} style={splashStyles.linkButton}>
            <Text style={splashStyles.linkText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

function SlideStage({
  index,
  onNext,
  onSkip,
  onBack,
}: {
  index: 1 | 2 | 3;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slide = SLIDE_DATA[index];
  const isLast = index === 3;

  return (
    <ImageBackground source={{ uri: slide.image }} style={styles.fullScreen} resizeMode="cover">
      <LinearGradient
        colors={['rgba(15,23,42,0.10)', 'rgba(15,23,42,0.95)']}
        locations={[0.25, 0.95]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top chrome */}
      <View style={[slideStyles.topChrome, { paddingTop: insets.top + 12 }]}>
        <View style={slideStyles.progressRow}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                slideStyles.progressBar,
                step <= index && slideStyles.progressBarActive,
              ]}
            />
          ))}
        </View>
        <View style={slideStyles.topActions}>
          <TouchableOpacity onPress={onBack} style={slideStyles.backButton}>
            <Ionicons name="chevron-back" size={14} color={colors.paper2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip} style={slideStyles.skipButton}>
            <Text style={slideStyles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom copy */}
      <View style={[slideStyles.copy, { paddingBottom: insets.bottom + 32 }]}>
        <Kicker text={slide.kicker} color={colors.paper2} />

        <Text style={slideStyles.title}>
          {slide.plain}
          <Text style={splashStyles.italic}>{slide.italic}</Text>
          {'plain2' in slide && slide.plain2 ? <Text>{slide.plain2}</Text> : null}
        </Text>

        <Text style={slideStyles.body}>{slide.body}</Text>

        {isLast ? (
          <View style={slideStyles.lastActions}>
            <PrimaryButton title="Choose a plan" onPress={onNext} />
            <TouchableOpacity onPress={onSkip} style={splashStyles.linkButton}>
              <Text style={splashStyles.linkText}>I'll decide later</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={slideStyles.nextRow}>
            <View style={slideStyles.pageDots}>
              {[1, 2, 3].map((step) => (
                <View
                  key={step}
                  style={[
                    slideStyles.pageDot,
                    step === index && slideStyles.pageDotActive,
                  ]}
                />
              ))}
            </View>
            <PrimaryButton title="Next" onPress={onNext} block={false} />
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, width: SCREEN_W, height: SCREEN_H },
  splashContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
    gap: 18,
  },
});

const splashStyles = StyleSheet.create({
  headline: {
    fontSize: 44,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -1.6,
    lineHeight: 52,
  },
  italic: { fontStyle: 'italic' },
  body: {
    fontSize: 15,
    color: colors.paper2,
    lineHeight: 22,
  },
  actions: { gap: 4, marginTop: 8 },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: { fontSize: 14, color: colors.paper2 },
});

const slideStyles = StyleSheet.create({
  topChrome: { paddingHorizontal: 18 },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(241,245,249,0.25)',
    borderRadius: 1,
  },
  progressBarActive: { backgroundColor: colors.paper },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: { padding: 10 },
  skipButton: { padding: 10, paddingRight: 12 },
  skipText: { fontSize: 13, color: colors.paper2 },
  copy: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    gap: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -1.2,
    lineHeight: 46,
  },
  body: {
    fontSize: 14,
    color: colors.paper2,
    lineHeight: 21,
  },
  lastActions: { gap: 0, marginTop: 8 },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pageDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pageDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.paper3,
  },
  pageDotActive: {
    width: 20,
    backgroundColor: colors.paper,
  },
});
