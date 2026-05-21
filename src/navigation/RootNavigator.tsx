import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoadingScreen } from '@/src/components/LoadingScreen';
import { useAuth } from '@/src/contexts/AuthContext';
import { ExportScreen } from '@/src/screens/ExportScreen';
import { LoginScreen } from '@/src/screens/LoginScreen';
import { ReceiptDetailScreen } from '@/src/screens/ReceiptDetailScreen';
import { ReceiptListScreen } from '@/src/screens/ReceiptListScreen';
import { ReviewReceiptScreen } from '@/src/screens/ReviewReceiptScreen';
import { ScanReceiptScreen } from '@/src/screens/ScanReceiptScreen';
import type { RootStackParamList } from '@/src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator>
      {session ? (
        <>
          <Stack.Screen
            name="ReceiptList"
            component={ReceiptListScreen}
            options={{ title: 'Receipts' }}
          />
          <Stack.Screen
            name="ScanReceipt"
            component={ScanReceiptScreen}
            options={{ title: 'Scan Receipt' }}
          />
          <Stack.Screen
            name="ReviewReceipt"
            component={ReviewReceiptScreen}
            options={{ title: 'Review Receipt' }}
          />
          <Stack.Screen
            name="ReceiptDetail"
            component={ReceiptDetailScreen}
            options={{ title: 'Receipt Detail' }}
          />
          <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Export' }} />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
