import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { usePreferences } from '../contexts/PreferencesContext';
import { apiFetch } from '../utils/api';

type Suggestion = { type: 'category' | 'product'; id: string; name: string; slug: string };

export function AppTopBar() {
  const { locale, isAr, l } = usePreferences();
  const iconColor = '#57534E';
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setLoading(false); return; }
    let active = true;
    setLoading(true);
    const timeout = setTimeout(() => {
      apiFetch<{ suggestions: Suggestion[] }>(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}&lang=${locale}`)
        .then((result) => { if (active) setSuggestions(result.suggestions ?? []); })
        .catch(() => { if (active) setSuggestions([]); })
        .finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(timeout); };
  }, [locale, query]);

  function submit() {
    const value = query.trim();
    if (value.length < 2) return;
    setSuggestions([]);
    router.push({ pathname: '/products', params: { search: value } });
  }

  function select(item: Suggestion) {
    setQuery('');
    setSuggestions([]);
    router.push(item.type === 'category' ? `/categories/${encodeURIComponent(item.slug)}` : `/products/${encodeURIComponent(item.slug)}`);
  }

  return (
    <View
      className="h-16 flex-row items-center justify-between border-b border-border bg-background-card px-4"
    >
      <Image
        source={require('../assets/logo.png')}
        accessibilityLabel="Euro Store"
        resizeMode="contain"
        style={{ width: 52, height: 40 }}
      />
      <View className="relative z-50 min-h-11 w-[218px] flex-row items-center rounded-full border border-border bg-background-secondary px-4">
        <Search size={19} color={iconColor} strokeWidth={1.8} />
        <TextInput
          accessibilityLabel={l('البحث في المتجر', 'Search the store')}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          returnKeyType="search"
          autoCorrect={false}
          maxLength={100}
          placeholder={l('ابحث عن منتج...', 'Search for a product...')}
          placeholderTextColor="#6B6258"
          className={`flex-1 px-2 py-2 text-sm text-text-primary ${isAr ? 'text-right' : 'text-left'}`}
        />
        {loading ? <ActivityIndicator size="small" color="#B8860B" /> : null}
        {suggestions.length ? (
          <View className="absolute end-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-border bg-background-card p-2 shadow-lg">
            <Text className="px-3 pb-2 pt-1 text-xs font-bold text-text-secondary">{l('نتائج البحث', 'Search results')} ({suggestions.length})</Text>
            {suggestions.map((item) => (
              <Pressable key={`${item.type}-${item.id}`} accessibilityRole="button" accessibilityLabel={item.name} onPress={() => select(item)} className="min-h-12 justify-center rounded-xl px-3 active:bg-background-secondary">
                <Text className={`${isAr ? 'text-right' : 'text-left'} font-bold text-text-primary`} numberOfLines={1}>{item.name}</Text>
                <Text className={`${isAr ? 'text-right' : 'text-left'} mt-0.5 text-[11px] text-text-muted`}>{item.type === 'category' ? l('قسم', 'Category') : l('منتج', 'Product')}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
