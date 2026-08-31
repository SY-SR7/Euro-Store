import React from 'react';
import { Pressable, Text, View } from 'react-native';

export function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-5 flex-row items-end justify-between gap-4">
      <View className="min-w-0 flex-1">
        {eyebrow ? <Text className="mb-1 text-xs font-bold text-primary">{eyebrow}</Text> : null}
        <Text className="text-2xl font-black leading-8 text-text-primary" numberOfLines={2}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
        >
          <Text className="pb-1 text-sm font-bold text-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
