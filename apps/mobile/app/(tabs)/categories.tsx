import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';
import { usePreferences } from '../../contexts/PreferencesContext';

type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  image_url: string | null;
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAr, l } = usePreferences();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name_ar, name_en, image_url')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='px-6 py-4 border-b border-border'>
        <Text className='text-2xl font-bold text-primary'>{l('التصنيفات', 'Categories')}</Text>
      </View>

      {loading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#B8860B' />
        </View>
      ) : (
        <ScrollView className='flex-1 p-6' showsVerticalScrollIndicator={false}>
          <View className='flex-row flex-wrap justify-between'>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                className='w-[48%] bg-background-secondary rounded-2xl overflow-hidden mb-4 border border-border shadow-sm'
                onPress={() => router.push({ pathname: '/products', params: { categoryId: cat.id, title: isAr ? cat.name_ar : cat.name_en } })}
              >
                <View className='h-32 w-full bg-background-card'>
                  <Image
                    source={cat.image_url ? { uri: cat.image_url } : require('../../assets/icon.png')}
                    className='w-full h-full opacity-80'
                    resizeMode='cover'
                  />
                  <View className='absolute inset-0 bg-black/40 items-center justify-center'>
                    <Text className='text-white font-bold text-lg text-center px-2'>{isAr ? cat.name_ar : cat.name_en}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
