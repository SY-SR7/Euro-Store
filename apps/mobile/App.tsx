import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, I18nManager } from 'react-native';
import { createSupabasePublicClientFromEnv } from '@eurostore/database';

// Ensure RTL is enforced for Arabic default
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function App(): JSX.Element {
  const [shippingRateCount, setShippingRateCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabasePublicClientFromEnv();

    void supabase
      .from('shipping_rates')
      .select('id')
      .eq('is_active', true)
      .then(({ data }) => {
        if (isMounted) {
          setShippingRateCount(data?.length ?? 0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ØªØ·Ø¨ÙŠÙ‚ ÙŠÙˆØ±Ùˆ Ø³ØªÙˆØ± â€” Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡</Text>
      <Text style={styles.subtitle}>EuroStore Mobile App â€” Customer Portal</Text>
      <Text style={styles.meta}>
        {shippingRateCount === null ? 'Ø¬Ø§Ø± Ø§Ù„Ø±Ø¨Ø· Ù…Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...' : `Ù…Ø­Ø§ÙØ¸Ø§Øª Ø§Ù„Ø´Ø­Ù† Ø§Ù„Ù…ØªØ§Ø­Ø©: ${shippingRateCount}`}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F', // Dark background from brand identity
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#C9A84C', // Gold primary
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#E8D28A', // Gold Light
    fontSize: 16,
    textAlign: 'center',
  },
  meta: {
    color: '#E2E2E2',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});

