import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '@/src/components/AppButton';
import { useAuth } from '@/src/contexts/AuthContext';
import type { RootStackScreenProps } from '@/src/navigation/types';
import { fetchReceipts, searchReceipts } from '@/src/services/receipts';
import type { Receipt } from '@/src/types/receipt';
import { getAuthErrorMessage } from '@/src/utils/authErrors';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

type Props = RootStackScreenProps<'ReceiptList'>;

export function ReceiptListScreen({ navigation }: Props) {
  const { session, signOut } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadReceipts = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchReceipts();
      setReceipts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts])
  );

  const filteredReceipts = searchReceipts(receipts, searchQuery);

  const handleLogout = async () => {
    setError(null);
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoggingOut(false);
    }
  };

  const renderItem = ({ item }: { item: Receipt }) => (
    <Pressable
      style={styles.receiptRow}
      onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
    >
      <Text style={styles.vendor}>{item.vendor}</Text>
      <Text style={styles.meta}>
        {formatCurrency(item.total)} · {formatDate(item.receipt_date)}
      </Text>
      <Text style={styles.category}>{item.category}</Text>
    </Pressable>
  );

  const renderListContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.centeredText}>Loading receipts…</Text>
        </View>
      );
    }

    if (error && receipts.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <AppButton title="Retry" onPress={loadReceipts} />
        </View>
      );
    }

    if (filteredReceipts.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matches' : 'No receipts yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different vendor or category.'
              : 'Tap Add Receipt to save your first one.'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadReceipts}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{session?.user.email}</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search vendor or category…"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <View style={styles.listArea}>{renderListContent()}</View>

      <AppButton title="Scan Receipt" onPress={() => navigation.navigate('ScanReceipt')} />
      <AppButton title="Export" onPress={() => navigation.navigate('Export')} />
      {error && receipts.length > 0 ? <Text style={styles.errorInline}>{error}</Text> : null}
      <AppButton
        title="Log Out"
        onPress={handleLogout}
        loading={loggingOut}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  email: { fontSize: 14, color: '#666', marginBottom: 8 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  listArea: { flex: 1, marginBottom: 8 },
  list: { paddingBottom: 12 },
  receiptRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  vendor: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 14, color: '#444', marginTop: 4 },
  category: { fontSize: 13, color: '#666', marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  centeredText: { marginTop: 12, color: '#555' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  error: { color: '#dc2626', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  errorInline: { color: '#dc2626', fontSize: 13, marginTop: 8 },
});
