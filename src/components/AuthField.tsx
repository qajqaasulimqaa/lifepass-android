import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type Props = TextInputProps & {
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
};

export default function AuthField({
  icon,
  placeholder,
  value,
  onChangeText,
  secure,
  ...rest
}: Props) {
  // Show/hide toggle for secure fields — eye icon like the iOS auth forms.
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      {icon && (
        <Ionicons name={icon} size={14} color={colors.paper3} style={styles.icon} />
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.paper3}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !visible}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />
      {secure && (
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={17}
            color={colors.paper3}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.ink2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.line,
    gap: 12,
  },
  icon: { width: 18 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.paper,
  },
});
