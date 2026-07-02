import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useNotificationStore } from '../store/notificationStore';

export default function NotificationsScreen() {
  const { items, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();

  useEffect(() => {
    // Automatically mark all as read when opening the screen
    markAllAsRead();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return '??';
      case 'promo': return '??';
      case 'system': return '??';
      default: return '??';
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='px-6 py-4 border-b border-border flex-row justify-between items-center'>
        <View className='flex-row items-center'>
          <TouchableOpacity onPress={() => router.back()} className='mr-4'>
            <Text className='text-primary text-xl font-bold'>{'<'}</Text>
          </TouchableOpacity>
          <Text className='text-xl font-bold text-primary'>?????????</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearNotifications}>
            <Text className='text-error text-sm font-bold'>??? ????</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className='flex-1 p-6'>
        {items.length === 0 ? (
          <View className='items-center justify-center py-20'>
            <Text className='text-text-secondary text-lg font-bold'>?? ???? ??????? ?????</Text>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              className={\g-background-secondary p-4 rounded-xl border \ mb-4 flex-row\}
              onPress={() => markAsRead(item.id)}
            >
              <View className='w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4'>
                <Text className='text-2xl'>{getIcon(item.type)}</Text>
              </View>
              
              <View className='flex-1 justify-center'>
                <Text className={\	ext-base mb-1 \\}>
                  {item.title}
                </Text>
                <Text className='text-text-secondary text-sm mb-2 leading-5'>
                  {item.message}
                </Text>
                <Text className='text-text-muted text-xs'>
                  {item.date.toLocaleDateString('ar-SY')}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

