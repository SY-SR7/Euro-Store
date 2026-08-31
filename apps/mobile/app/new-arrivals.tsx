import React from 'react';
import ProductsScreen from './products/index';
import { usePreferences } from '../contexts/PreferencesContext';

export default function NewArrivalsScreen() {
  const { l } = usePreferences();
  return <ProductsScreen preset={{ sort: 'newest', hero: 'new-arrivals', title: l('أحدث المنتجات المضافة', 'New arrivals') }} />;
}
