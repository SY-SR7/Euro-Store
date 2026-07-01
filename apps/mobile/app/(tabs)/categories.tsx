import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../utils/supabase';

type Category = {
  id: string;
  name_ar: string;
  image_url: string | null;
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name_ar, image_url')
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
        <Text className='text-2xl font-bold text-primary'>???????</Text>
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
              >
                <View className='h-32 w-full bg-background-card'>
                  <Image 
                    source={{ uri: cat.image_url || 'https://via.placeholder.com/300' }} 
                    className='w-full h-full opacity-80' 
                    resizeMode='cover' 
                  />
                  <View className='absolute inset-0 bg-black/40 items-center justify-center'>
                    <Text className='text-white font-bold text-lg text-center px-2'>{cat.name_ar}</Text>
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
