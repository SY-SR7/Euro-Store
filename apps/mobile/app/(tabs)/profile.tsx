import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';

export default function ProfileScreen() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('???', '??? ??? ????? ????? ??????');
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='px-6 py-4 border-b border-border'>
        <Text className='text-2xl font-bold text-primary'>?????</Text>
      </View>

      <View className='flex-1 p-6'>
        <View className='bg-background-secondary p-6 rounded-2xl border border-border items-center mb-6'>
          <View className='w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4 border border-primary/50'>
            <Text className='text-3xl text-primary font-bold'>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className='text-white font-bold text-lg mb-1'>{user?.email}</Text>
          <Text className='text-text-secondary text-sm'>??? ????</Text>
        </View>

        <View className='space-y-4 flex-1'>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3'>
            <Text className='text-white font-bold text-base'>??????</Text>
            <Text className='text-text-secondary'>{'<'}</Text>
          </TouchableOpacity>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-3'>
            <Text className='text-white font-bold text-base'>???????? ????????</Text>
            <Text className='text-text-secondary'>{'<'}</Text>
          </TouchableOpacity>
          <TouchableOpacity className='bg-background-secondary p-4 rounded-xl border border-border flex-row justify-between items-center mb-6'>
            <Text className='text-white font-bold text-base'>?????????</Text>
            <Text className='text-text-secondary'>{'<'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className='bg-error/10 border border-error/50 p-4 rounded-xl mb-4'
          onPress={handleSignOut}
        >
          <Text className='text-error font-bold text-center text-lg'>????? ??????</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
