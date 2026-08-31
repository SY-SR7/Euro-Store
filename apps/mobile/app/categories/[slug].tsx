import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProductsScreen from '../products/index';

export default function CategoryProductsScreen() {
  const { slug, title } = useLocalSearchParams<{ slug: string; title?: string }>();
  return <ProductsScreen preset={{ category: slug, title }} />;
}
