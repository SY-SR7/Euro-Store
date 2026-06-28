import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, I18nManager } from 'react-native';

// Ensure RTL is enforced for Arabic default
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>تطبيق يورو ستور — بوابة العملاء</Text>
      <Text style={styles.subtitle}>EuroStore Mobile App — Customer Portal</Text>
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
});
