import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTopBar } from '../../components/AppTopBar';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiFetch } from '../../utils/api';

type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  image_url: string | null;
  slug: string;
  parent_id: string | null;
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const { isAr, l, t } = usePreferences();

  const fetchCategories = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    try {
      const result = await apiFetch<{ data: Category[] }>('/api/categories');
      setCategories(result.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppTopBar />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#B8860B" /></View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center leading-6 text-text-secondary">{l('تعذر تحميل التصنيفات. تحقق من الاتصال وحاول مجددًا.', 'Categories could not be loaded. Check your connection and try again.')}</Text>
          <Pressable accessibilityRole="button" onPress={() => void fetchCategories()} className="mt-6 min-h-12 items-center justify-center rounded-lg bg-primary px-7">
            <Text className="font-bold text-[#17130A]">{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchCategories(true)} tintColor="#B8860B" colors={['#B8860B']} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <LinearGradient colors={['#FFFDF9', '#FAF6ED', '#F5EFE0']} className="mb-10 overflow-hidden rounded-3xl border border-border p-7">
            <View className="mb-4 self-start flex-row items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
              <LayoutGrid size={15} color="#B8860B" />
              <Text className="text-[11px] font-black text-primary">{l('دليل الأقسام والتصنيفات', 'Departments Directory')}</Text>
            </View>
            <Text className={`${isAr ? 'text-right' : 'text-left'} text-3xl font-black leading-10 text-text-primary`}>{l('كافة التصنيفات والأقسام الفاخرة', 'Explore All Luxury Categories')}</Text>
            <Text className={`${isAr ? 'text-right' : 'text-left'} mt-3 text-sm leading-6 text-text-secondary`}>{l('تصفح مجموعاتنا الكاملة عبر الأقسام الرئيسية والفرعية للعثور على المنتجات والماركات المفضلة لديك بكل سهولة.', 'Browse our full collections across departments to find your favorite luxury products and authentic global brands.')}</Text>
          </LinearGradient>

          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-black text-text-primary">{l('الأقسام الرئيسية', 'Main Departments')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={l('عرض كافة المنتجات', 'View All Products')} onPress={() => router.push('/products')} className="flex-row items-center gap-1"><Text className="text-xs font-bold text-primary">{l('عرض كافة المنتجات', 'View All Products')}</Text>{isAr ? <ArrowLeft size={14} color="#B8860B" /> : <ArrowRight size={14} color="#B8860B" />}</Pressable>
          </View>

          <View>
            {categories.filter((category) => !category.parent_id).map((category) => {
              const title = isAr ? category.name_ar : category.name_en;
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={title}
                  style={({ pressed }) => ({
                    width: '100%',
                    marginBottom: 20,
                    padding: 14,
                    overflow: 'hidden',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E8DCC3',
                    backgroundColor: '#FFFFFF',
                    opacity: pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  })}
                  onPress={() => router.push({ pathname: '/categories/[slug]', params: { slug: category.slug, title } })}
                >
                  <View className="h-56 items-center justify-center overflow-hidden rounded-xl bg-[#FAF6EE] p-4">
                    <Image source={category.image_url ? { uri: category.image_url } : require('../../assets/icon.png')} className="h-full w-full" resizeMode="contain" accessibilityLabel={title} />
                  </View>
                  <View className="mt-4 flex-row items-center justify-between">
                    <Text className="flex-1 text-base font-black text-text-primary" numberOfLines={2}>{title}</Text>
                    <View className="rounded-full border border-border bg-[#FAF6EE] px-3 py-1.5"><Text className="text-[11px] font-bold text-primary">{l('تصفح', 'Explore')}</Text></View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {categories.some((category) => category.parent_id) ? <View className="mt-5 border-t border-border pt-10"><Text className="mb-6 text-xl font-black text-text-primary">{l('التصنيفات الفرعية والتخصصية', 'Specialized Subcategories')}</Text><View className="flex-row flex-wrap justify-between">{categories.filter((category) => category.parent_id).map((category) => { const title = isAr ? category.name_ar : category.name_en; return <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push({ pathname: '/categories/[slug]', params: { slug: category.slug, title } })} className="mb-3 min-h-16 w-[48.5%] items-center justify-center rounded-xl border border-border bg-white px-3 py-3"><Text className="text-center text-xs font-bold text-text-primary">{title}</Text></Pressable>; })}</View></View> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
