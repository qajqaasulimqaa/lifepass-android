//Dropdown Menu just fo Coach Page

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import type { RecentChat } from '../../data/mockCoach';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.78, 300);

type Props = {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  recentChats: RecentChat[];
};

export default function ChatDrawer({ visible, onClose, onNewChat, recentChats }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          damping: 22,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted && !visible) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateX: slideX }],
          },
        ]}
      >
        {/* LifePass logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoLife}>Life</Text>
          <Text style={styles.logoPass}>Pass</Text>
        </View>

        {/* Primary nav */}
        <View style={styles.navSection}>
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => {
              onNewChat();
              onClose();
            }}
          >
            <Ionicons name="add" size={18} color={colors.paper} />
            <Text style={styles.navText}>Add chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.paper} />
            <Text style={styles.navText}>Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={16} color={colors.paper} />
            <Text style={styles.navText}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Recents */}
        <Text style={styles.sectionLabel}>Recents</Text>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {recentChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.recentItem}
              activeOpacity={0.6}
              onPress={onClose}
            >
              <Text style={styles.recentText} numberOfLines={1}>
                {chat.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* New chat button at bottom */}
        <TouchableOpacity
          style={styles.newChatButton}
          activeOpacity={0.8}
          onPress={() => {
            onNewChat();
            onClose();
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.paper} />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0E1E38',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 36,
  },
  logoLife: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.paper,
    letterSpacing: -0.5,
  },
  logoPass: {
    fontSize: 26,
    fontWeight: '300',
    fontStyle: 'italic',
    color: colors.paper,
    letterSpacing: -0.5,
  },
  navSection: {
    gap: 2,
    marginBottom: 32,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
  },
  navText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: 0.1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.paper3,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  recentItem: {
    paddingVertical: 10,
  },
  recentText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.paper2,
    lineHeight: 20,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.paper,
  },
});
