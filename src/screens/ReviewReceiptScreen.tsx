import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/src/components/AppButton';
import { ReceiptFormFields } from '@/src/components/ReceiptFormFields';
import { useAuth } from '@/src/contexts/AuthContext';
import type { RootStackScreenProps } from '@/src/navigation/types';
import { createReceipt } from '@/src/services/receipts';
import { aiExtractionToForm, normalizeAiCategory } from '@/src/utils/aiHelpers';
import {
  hasFormErrors,
  parseTotal,
  todayIsoDate,
  validateReceiptForm,
} from '@/src/utils/receiptValidation';

type Props = RootStackScreenProps<'ReviewReceipt'>;

export function ReviewReceiptScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const { draftReceiptId, imagePath, localImageUri, extraction } = route.params;

  const initial = aiExtractionToForm({
    ...extraction,
    category: normalizeAiCategory(extraction.category),
    receipt_date: extraction.receipt_date ?? todayIsoDate(),
  });

  const [vendor, setVendor] = useState(initial.vendor);
  const [receiptDate, setReceiptDate] = useState(initial.receipt_date || todayIsoDate());
  const [total, setTotal] = useState(initial.total);
  const [category, setCategory] = useState(initial.category);
  const [notes, setNotes] = useState(initial.notes);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const aiConfidence = extraction.ai_confidence;

  const handleSave = async () => {
    setError(null);
    const form = {
      vendor,
      receipt_date: receiptDate,
      total,
      category,
      notes,
    };
    const errors = validateReceiptForm(form, true);
    if (hasFormErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const userId = session?.user.id;
    if (!userId) {
      setError('You must be logged in to save.');
      return;
    }

    const parsedTotal = parseTotal(total);
    if (parsedTotal === null) return;

    setSaving(true);
    try {
      const receipt = await createReceipt(userId, {
        id: draftReceiptId,
        vendor,
        receipt_date: receiptDate.trim(),
        total: parsedTotal,
        category,
        notes,
        image_path: imagePath,
        ai_confidence: aiConfidence > 0 ? aiConfidence : null,
      });

      navigation.replace('ReceiptDetail', { receiptId: receipt.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save receipt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Review Receipt</Text>
        <Text style={styles.subtitle}>
          AI never saves automatically — check every field, then save.
        </Text>

        <ReceiptFormFields
          vendor={vendor}
          receiptDate={receiptDate}
          total={total}
          category={category}
          notes={notes}
          imageUri={localImageUri}
          aiConfidence={aiConfidence}
          fieldErrors={fieldErrors}
          onVendorChange={setVendor}
          onReceiptDateChange={setReceiptDate}
          onTotalChange={setTotal}
          onCategoryChange={setCategory}
          onNotesChange={setNotes}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title="Save Receipt" onPress={handleSave} loading={saving} />
        <AppButton
          title="Cancel"
          onPress={() => navigation.navigate('ReceiptList')}
          variant="secondary"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  error: { color: '#dc2626', fontSize: 14, marginTop: 12 },
});
