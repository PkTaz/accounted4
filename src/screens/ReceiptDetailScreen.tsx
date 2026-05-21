import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/AppButton';
import type { RootStackScreenProps } from '@/src/navigation/types';
import { fetchReceiptById } from '@/src/services/receipts';
import type { Receipt } from '@/src/types/receipt';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

type Props = RootStackScreenProps<'ReceiptDetail'>;

export function ReceiptDetailScreen({ navigation, route }: Props) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReceiptById(route.params.receiptId);
        if (!cancelled) setReceipt(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load receipt.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [route.params.receiptId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !receipt) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{error ?? 'Receipt not found'}</Text>
        <AppButton title="Back to List" onPress={() => navigation.navigate('ReceiptList')} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{receipt.vendor}</Text>
      <Text style={styles.amount}>{formatCurrency(receipt.total)}</Text>

      {receipt.image_url ? (
        <Image source={{ uri: receipt.image_url }} style={styles.image} resizeMode="contain" />
      ) : null}

      <View style={styles.card}>
        <Row label="Date" value={formatDate(receipt.receipt_date)} />
        <Row label="Category" value={receipt.category} />
        {receipt.notes ? <Row label="Notes" value={receipt.notes} /> : null}
        {receipt.ai_confidence != null && receipt.ai_confidence > 0 ? (
          <Row
            label="AI confidence"
            value={`${Math.round(receipt.ai_confidence * 100)}%`}
          />
        ) : null}
        <Row label="Saved" value={formatDate(receipt.created_at)} />
      </View>

      <AppButton title="Back to Receipt List" onPress={() => navigation.navigate('ReceiptList')} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
  amount: { fontSize: 20, color: '#2563eb', marginVertical: 12 },
  image: { width: '100%', height: 280, borderRadius: 8, marginBottom: 16, backgroundColor: '#f3f4f6' },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  row: { marginBottom: 12 },
  rowLabel: { fontSize: 12, color: '#888' },
  rowValue: { fontSize: 16, marginTop: 2 },
});
