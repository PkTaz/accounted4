import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/AppButton';
import type { RootStackScreenProps } from '@/src/navigation/types';
import { fetchReceipts } from '@/src/services/receipts';
import { receiptsToCsv } from '@/src/utils/csvExport';

type Props = RootStackScreenProps<'Export'>;

export function ExportScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const receipts = await fetchReceipts();

      if (receipts.length === 0) {
        setError('No receipts to export. Add some receipts first.');
        return;
      }

      const csv = receiptsToCsv(receipts);
      const fileName = `receipts-${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        setSuccess(`CSV saved to cache: ${fileName}`);
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export receipts',
        UTI: 'public.comma-separated-values-text',
      });

      setSuccess(`Exported ${receipts.length} receipt(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export Receipts</Text>
      <Text style={styles.subtitle}>
        Download a CSV with date, vendor, category, total, notes, and image path for your
        accountant or tax prep.
      </Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Preparing CSV…</Text>
        </View>
      ) : (
        <AppButton title="Export to CSV" onPress={handleExport} />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <AppButton
        title="Back to Receipt List"
        onPress={() => navigation.navigate('ReceiptList')}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 24 },
  centered: { alignItems: 'center', paddingVertical: 24 },
  loadingText: { marginTop: 12, color: '#555' },
  error: { color: '#dc2626', fontSize: 14, marginTop: 16 },
  success: { color: '#059669', fontSize: 14, marginTop: 16 },
});
