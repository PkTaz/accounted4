import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AiExtractionResult } from '@/src/types/ai';

export type RootStackParamList = {
  Login: undefined;
  ReceiptList: undefined;
  ScanReceipt: undefined;
  ReviewReceipt: {
    draftReceiptId: string;
    imagePath: string;
    localImageUri: string;
    extraction: AiExtractionResult;
  };
  ReceiptDetail: { receiptId: string };
  Export: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
