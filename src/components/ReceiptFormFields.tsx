import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTextInput } from '@/src/components/AppTextInput';
import { RECEIPT_CATEGORIES } from '@/src/constants/categories';
import { isLowConfidence } from '@/src/utils/aiHelpers';

type ReceiptFormFieldsProps = {
  vendor: string;
  receiptDate: string;
  total: string;
  category: string;
  notes: string;
  imageUri: string | null;
  aiConfidence?: number;
  fieldErrors: Record<string, string>;
  onVendorChange: (v: string) => void;
  onReceiptDateChange: (v: string) => void;
  onTotalChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onNotesChange: (v: string) => void;
};

export function ReceiptFormFields({
  vendor,
  receiptDate,
  total,
  category,
  notes,
  imageUri,
  aiConfidence,
  fieldErrors,
  onVendorChange,
  onReceiptDateChange,
  onTotalChange,
  onCategoryChange,
  onNotesChange,
}: ReceiptFormFieldsProps) {
  return (
    <>
      {aiConfidence != null && aiConfidence > 0 && isLowConfidence(aiConfidence) ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            AI confidence is low ({Math.round(aiConfidence * 100)}%). Please double-check every
            field before saving.
          </Text>
        </View>
      ) : null}

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      ) : null}

      <AppTextInput label="Vendor *" value={vendor} onChangeText={onVendorChange} />
      {fieldErrors.vendor ? <Text style={styles.fieldError}>{fieldErrors.vendor}</Text> : null}

      <AppTextInput
        label="Date (YYYY-MM-DD) *"
        value={receiptDate}
        onChangeText={onReceiptDateChange}
        placeholder="2026-05-19"
      />
      {fieldErrors.receipt_date ? (
        <Text style={styles.fieldError}>{fieldErrors.receipt_date}</Text>
      ) : null}

      <AppTextInput
        label="Total *"
        value={total}
        onChangeText={onTotalChange}
        keyboardType="decimal-pad"
        placeholder="42.50"
      />
      {fieldErrors.total ? <Text style={styles.fieldError}>{fieldErrors.total}</Text> : null}

      <Text style={styles.label}>Category *</Text>
      <View style={styles.categoryGrid}>
        {RECEIPT_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
            onPress={() => onCategoryChange(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>
      {fieldErrors.category ? (
        <Text style={styles.fieldError}>{fieldErrors.category}</Text>
      ) : null}

      <AppTextInput
        label="Notes"
        value={notes}
        onChangeText={onNotesChange}
        multiline
        numberOfLines={3}
        style={styles.notesInput}
      />
    </>
  );
}

const styles = StyleSheet.create({
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningText: { color: '#92400e', fontSize: 14 },
  preview: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
  fieldError: { color: '#dc2626', fontSize: 13, marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  categoryText: { fontSize: 14, color: '#374151' },
  categoryTextActive: { color: '#fff' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
});
