import React from 'react';
import ProductsScreen from './products/index';
import { usePreferences } from '../contexts/PreferencesContext';

export default function OffersScreen() {
  const { l } = usePreferences();
  return <ProductsScreen preset={{ sale: true, hero: 'offers', title: l('العروض والتخفيضات الحصرية', 'Exclusive offers and discounts') }} />;
}
