import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { AppButton } from '@/src/components/AppButton';
import { useAuth } from '@/src/contexts/AuthContext';
import type { RootStackScreenProps } from '@/src/navigation/types';
import { extractReceiptFromImage } from '@/src/services/ai';
import { uploadReceiptImage } from '@/src/services/storage';
import { EMPTY_AI_EXTRACTION, type AiExtractionResult } from '@/src/types/ai';
import { isExtractionReadyForReview } from '@/src/utils/aiHelpers';

type Props = RootStackScreenProps<'ScanReceipt'>;

const SCAN_INTERVAL_MS = 4500;
const MAX_AUTO_SCANS = 12;

type ScanStatus = 'point_camera' | 'scanning' | 'processing' | 'found' | 'paused';

export function ScanReceiptScreen({ navigation }: Props) {
  const { session } = useAuth();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);

  const draftReceiptIdRef = useRef(Crypto.randomUUID());
  const imagePathRef = useRef<string | null>(null);
  const scanCountRef = useRef(0);
  const scanningActiveRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>('point_camera');
  const [statusMessage, setStatusMessage] = useState('Point your camera at the receipt');
  const [error, setError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [libraryMode, setLibraryMode] = useState(false);

  const stopScanLoop = useCallback(() => {
    scanningActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const goToReview = useCallback(
    (localUri: string, extraction: AiExtractionResult) => {
      stopScanLoop();
      const imagePath = imagePathRef.current;
      if (!imagePath) return;

      navigation.navigate('ReviewReceipt', {
        draftReceiptId: draftReceiptIdRef.current,
        imagePath,
        localImageUri: localUri,
        extraction,
      });
    },
    [navigation, stopScanLoop]
  );

  const runSingleScan = useCallback(
    async (
      localUri: string,
      mimeType: string
    ): Promise<{ complete: boolean; extraction: AiExtractionResult }> => {
      const userId = session?.user.id;
      if (!userId) throw new Error('You must be logged in.');

      setStatus('processing');
      setStatusMessage('Reading receipt…');

      const imagePath = await uploadReceiptImage(
        userId,
        draftReceiptIdRef.current,
        localUri,
        mimeType
      );
      imagePathRef.current = imagePath;
      setPreviewUri(localUri);

      const extraction = await extractReceiptFromImage(imagePath);

      if (isExtractionReadyForReview(extraction)) {
        setStatus('found');
        setStatusMessage('Got it! Opening review…');
        goToReview(localUri, extraction);
        return { complete: true, extraction };
      }

      setStatus('scanning');
      setStatusMessage(
        `Scanning… (${scanCountRef.current}/${MAX_AUTO_SCANS}) — hold receipt steady`
      );
      return { complete: false, extraction };
    },
    [session?.user.id, goToReview]
  );

  const captureAndScan = useCallback(async () => {
    if (!scanningActiveRef.current || !cameraRef.current) return;
    if (scanCountRef.current >= MAX_AUTO_SCANS) {
      stopScanLoop();
      setStatus('paused');
      setStatusMessage('Auto-scan limit reached. Use library or enter manually.');
      setError('Could not read receipt clearly. Try better lighting or choose from library.');
      return;
    }

    scanCountRef.current += 1;
    setStatus('scanning');
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.65 });
      if (!photo?.uri) return;

      await runSingleScan(photo.uri, 'image/jpeg');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed.';
      setError(message);
      setStatus('paused');
      stopScanLoop();
    }
  }, [runSingleScan, stopScanLoop]);

  const startScanLoop = useCallback(() => {
    if (libraryMode || !permission?.granted) return;
    stopScanLoop();
    scanningActiveRef.current = true;
    scanCountRef.current = 0;
    setStatus('scanning');
    setStatusMessage('Scanning live… hold receipt in frame');
    setError(null);

    void captureAndScan();
    intervalRef.current = setInterval(() => {
      void captureAndScan();
    }, SCAN_INTERVAL_MS);
  }, [libraryMode, permission?.granted, captureAndScan, stopScanLoop]);

  useFocusEffect(
    useCallback(() => {
      if (!libraryMode && permission?.granted && isFocused) {
        startScanLoop();
      }
      return () => stopScanLoop();
    }, [libraryMode, permission?.granted, isFocused, startScanLoop, stopScanLoop])
  );

  useEffect(() => {
    if (!permission) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const pickFromLibrary = async () => {
    stopScanLoop();
    setLibraryMode(true);
    setError(null);

    const libPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libPermission.granted) {
      setError('Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      setLibraryMode(false);
      startScanLoop();
      return;
    }

    const asset = result.assets[0];
    try {
      setStatus('processing');
      const { complete, extraction } = await runSingleScan(
        asset.uri,
        asset.mimeType ?? 'image/jpeg'
      );
      if (!complete) {
        goToReview(asset.uri, extraction);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not scan image.');
      setStatus('paused');
    }
  };

  const handleManualEntry = async () => {
    stopScanLoop();
    setError(null);

    try {
      let uri = previewUri;

      if (!uri && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.65 });
        if (photo?.uri) {
          uri = photo.uri;
          await runSingleScan(uri, 'image/jpeg');
        }
      }

      if (!uri || !imagePathRef.current) {
        setError('Take a photo or choose from library first.');
        return;
      }

      goToReview(uri, EMPTY_AI_EXTRACTION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare manual entry.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.subtitle}>Allow camera access to scan receipts live.</Text>
        <AppButton title="Allow Camera" onPress={requestPermission} />
        <AppButton title="Choose from Library" onPress={pickFromLibrary} variant="secondary" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan Receipt</Text>
      <Text style={styles.subtitle}>
        AI reads the live camera feed. When it has enough info, you go to review automatically.
      </Text>

      {!libraryMode && isFocused ? (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.cameraOverlay}>
            <Text style={styles.overlayText}>{statusMessage}</Text>
            {(status === 'scanning' || status === 'processing') && (
              <ActivityIndicator color="#fff" style={styles.overlaySpinner} />
            )}
          </View>
        </View>
      ) : previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton title="Choose from Library" onPress={pickFromLibrary} variant="secondary" />
      <AppButton
        title="Resume Live Scan"
        onPress={() => {
          setLibraryMode(false);
          startScanLoop();
        }}
        variant="secondary"
        disabled={!libraryMode && status === 'scanning'}
      />
      <AppButton title="Enter Manually" onPress={handleManualEntry} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#fff', flexGrow: 1 },
  centered: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  cameraWrap: {
    height: 360,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  camera: { flex: 1 },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayText: { color: '#fff', flex: 1, fontSize: 14 },
  overlaySpinner: { marginLeft: 8 },
  preview: { width: '100%', height: 240, borderRadius: 8, marginBottom: 12 },
  error: { color: '#dc2626', fontSize: 14, marginVertical: 8 },
});
