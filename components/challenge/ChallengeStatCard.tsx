import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/constants/ThemeContext';

type IconComponentProps = {
  size?: number;
  color?: string;
};

interface ChallengeStatCardProps {
  icon: React.ComponentType<IconComponentProps>;
  label: string;
  value: string;
}

export const ChallengeStatCard: React.FC<ChallengeStatCardProps> = ({
  icon: Icon,
  label,
  value,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={styles.container}
    >
      <View style={styles.valueRow}>
        <Icon size={16} color={colors.text.secondary} />
        <Text style={[styles.value, { color: colors.text.primary }]}>
          {value}
        </Text>
      </View>
      <Text style={[styles.label, { color: colors.text.secondary }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 4,
    paddingVertical: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ChallengeStatCard;
