import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '@/theme';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'solid' | 'ghost';
  accessibilityLabel?: string;
}

function ActionButton({
  label,
  onPress,
  icon,
  variant = 'solid',
  accessibilityLabel,
}: ActionButtonProps) {
  if (variant === 'ghost') {
    return (
      <Pressable
        style={[styles.button, styles.ghostButton]}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? label}>
        {icon}
        <Text style={[styles.label, styles.ghostLabel]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}>
      <LinearGradient
        colors={[colors.purple, colors.pink]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 26,
    overflow: 'hidden',
    minHeight: 54,
  },
  gradient: {
    flex: 1,
    borderRadius: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ghostLabel: {
    color: colors.white,
  },
});

export default memo(ActionButton);
