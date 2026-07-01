import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('???', error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('???', error.message);
    } else {
      Alert.alert('????', '???? ?????? ?? ????? ?????????? ?????? ??????');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className='flex-1 justify-center px-6'
      >
        <Text className='text-3xl font-bold text-primary mb-2 text-center'>????? ??????</Text>
        <Text className='text-text-secondary mb-10 text-center'>?????? ?? ?? ???? ????</Text>

        <View className='space-y-4 mb-8'>
          <TextInput
            className='bg-background-secondary text-text-primary px-4 py-4 rounded-xl border border-border'
            placeholder='?????? ??????????'
            placeholderTextColor='#737373'
            value={email}
            onChangeText={setEmail}
            autoCapitalize='none'
            keyboardType='email-address'
          />
          <TextInput
            className='bg-background-secondary text-text-primary px-4 py-4 rounded-xl border border-border mt-4'
            placeholder='???? ??????'
            placeholderTextColor='#737373'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className='bg-primary py-4 rounded-xl mb-4'
          onPress={signInWithEmail}
          disabled={loading}
        >
          <Text className='text-[#0F0F0F] font-bold text-center text-lg'>
            {loading ? '???? ???????...' : '????? ??????'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className='border border-primary py-4 rounded-xl'
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text className='text-primary font-bold text-center text-lg'>
            ???? ????
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
