import { Ionicons } from '@expo/vector-icons';
import { requireOptionalNativeModule } from 'expo';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import * as Location from 'expo-location';
import { type ReactNode, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { refresh as refreshNetInfo, useNetInfo } from '@react-native-community/netinfo';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Whether the ExpoLocation native module is present in the running binary. It is
 * `null` in Expo Go and in any dev build compiled before `expo-location` was added —
 * touching the module then throws, so we feature-detect instead of crashing.
 */
const LOCATION_AVAILABLE = requireOptionalNativeModule('ExpoLocation') != null;

type Status = 'idle' | 'pending' | 'ok' | 'denied' | 'error';

const STATUS_COLOR: Record<Status, ThemeColor> = {
  idle: 'textMuted',
  pending: 'warning',
  ok: 'success',
  denied: 'error',
  error: 'error',
};

/** One capability row: title, description, live status line and a test/request action. */
function DiagnosticCard({
  icon,
  title,
  description,
  status,
  detail,
  actionLabel,
  onPress,
  loading,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: Status;
  detail?: string;
  actionLabel: string;
  onPress: () => void;
  loading?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrapper}>
          {icon}
        </View>
        <View style={styles.cardHeaderText}>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statusRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('diagnostics.status')}:
        </ThemedText>
        <ThemedText type="smallBold" themeColor={STATUS_COLOR[status]}>
          {t(`diagnostics.statuses.${status}`)}
        </ThemedText>
      </View>

      {detail ? (
        <ThemedText type="code" themeColor="textSecondary">
          {detail}
        </ThemedText>
      ) : null}

      {children}

      <Button title={actionLabel} variant="secondary" onPress={onPress} loading={loading} />
    </ThemedView>
  );
}

export default function DiagnosticsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  // Camera -----------------------------------------------------------------
  const [cameraPerm, requestCamera] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraStatus: Status = !cameraPerm
    ? 'idle'
    : cameraPerm.granted
      ? 'ok'
      : cameraPerm.status === 'denied'
        ? 'denied'
        : 'idle';

  // First tap requests permission; once granted the same button toggles the
  // live preview frame on and off.
  const onPressCamera = useCallback(async () => {
    if (!cameraPerm?.granted) {
      const res = await requestCamera();
      if (res.granted) setCameraOn(true);
      return;
    }
    setCameraOn((on) => !on);
  }, [cameraPerm?.granted, requestCamera]);

  const cameraActionLabel = !cameraPerm?.granted
    ? t('diagnostics.requestPermission')
    : cameraOn
      ? t('diagnostics.camera.hide')
      : t('diagnostics.camera.show');

  // Location ---------------------------------------------------------------
  // Imperative (not the `useForegroundPermissions` hook) so a missing native
  // module can't crash the screen at render — we surface it as a status instead.
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [locationDetail, setLocationDetail] = useState<string | undefined>(
    LOCATION_AVAILABLE ? undefined : t('diagnostics.location.unavailable'),
  );
  const [locationBusy, setLocationBusy] = useState(false);
  const locationStatus: Status = !LOCATION_AVAILABLE
    ? 'error'
    : locationBusy
      ? 'pending'
      : locationGranted == null
        ? 'idle'
        : locationGranted
          ? 'ok'
          : 'denied';

  const testLocation = useCallback(async () => {
    if (!LOCATION_AVAILABLE) {
      setLocationDetail(t('diagnostics.location.unavailable'));
      return;
    }
    setLocationBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(perm.granted);
      if (!perm.granted) {
        setLocationDetail(t('diagnostics.location.denied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocationDetail(
        `lat ${pos.coords.latitude.toFixed(5)}, lon ${pos.coords.longitude.toFixed(5)} (±${Math.round(
          pos.coords.accuracy ?? 0,
        )}m)`,
      );
    } catch (e) {
      setLocationDetail(e instanceof Error ? e.message : String(e));
    } finally {
      setLocationBusy(false);
    }
  }, [t]);

  // Network / Wi-Fi --------------------------------------------------------
  const net = useNetInfo();
  const netStatus: Status =
    net.isConnected == null ? 'idle' : net.isConnected ? 'ok' : 'denied';
  const wifi = net.type === 'wifi' ? (net.details as { ssid?: string | null } | null) : null;
  const netDetail = [
    `${t('diagnostics.network.type')}: ${net.type ?? '—'}`,
    `${t('diagnostics.network.internet')}: ${
      net.isInternetReachable == null ? '—' : net.isInternetReachable ? '✓' : '✗'
    }`,
    wifi?.ssid ? `SSID: ${wifi.ssid}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  // Internal storage -------------------------------------------------------
  const [storageStatus, setStorageStatus] = useState<Status>('idle');
  const [storageDetail, setStorageDetail] = useState<string>();
  const [storageBusy, setStorageBusy] = useState(false);

  const testStorage = useCallback(async () => {
    setStorageBusy(true);
    try {
      const file = new File(Paths.cache, `diagnostics-${Date.now()}.txt`);
      const payload = `write check @ ${new Date().toISOString()}`;
      file.create();
      file.write(payload);
      const readBack = file.textSync();
      const size = file.size;
      file.delete();

      const ok = readBack === payload;
      const freeGb = (Paths.availableDiskSpace / 1024 ** 3).toFixed(1);
      const totalGb = (Paths.totalDiskSpace / 1024 ** 3).toFixed(1);
      setStorageStatus(ok ? 'ok' : 'error');
      setStorageDetail(
        `${t('diagnostics.storage.wroteRead', { size })}\n${t('diagnostics.storage.disk', {
          free: freeGb,
          total: totalGb,
        })}`,
      );
    } catch (e) {
      setStorageStatus('error');
      setStorageDetail(e instanceof Error ? e.message : String(e));
    } finally {
      setStorageBusy(false);
    }
  }, [t]);

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        {t('diagnostics.subtitle')}
      </ThemedText>

      <DiagnosticCard
        icon={<Ionicons name="camera-outline" size={28} color={theme.text} />}
        title={t('diagnostics.camera.title')}
        description={t('diagnostics.camera.description')}
        status={cameraStatus}
        actionLabel={cameraActionLabel}
        onPress={onPressCamera}
      >
        {cameraPerm?.granted && cameraOn ? (
          <View style={styles.cameraPreview}>
            <CameraView style={StyleSheet.absoluteFill} facing={facing} active={cameraOn} />
            <Button
              title={t('diagnostics.camera.flip')}
              variant="secondary"
              style={styles.flipButton}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            />
          </View>
        ) : null}
      </DiagnosticCard>

      <DiagnosticCard
        icon={<Ionicons name="location-outline" size={28} color={theme.text} />}
        title={t('diagnostics.location.title')}
        description={t('diagnostics.location.description')}
        status={locationStatus}
        detail={locationDetail}
        actionLabel={t('diagnostics.location.action')}
        onPress={testLocation}
        loading={locationBusy}
      />

      <DiagnosticCard
        icon={<Ionicons name="wifi-outline" size={28} color={theme.text} />}
        title={t('diagnostics.network.title')}
        description={t('diagnostics.network.description')}
        status={netStatus}
        detail={netDetail}
        actionLabel={t('diagnostics.network.action')}
        onPress={() => {
          void refreshNetInfo();
        }}
      />

      <DiagnosticCard
        icon={<Ionicons name="server-outline" size={28} color={theme.text} />}
        title={t('diagnostics.storage.title')}
        description={t('diagnostics.storage.description')}
        status={storageStatus}
        detail={storageDetail}
        actionLabel={t('diagnostics.storage.action')}
        onPress={testStorage}
        loading={storageBusy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  cardHeaderText: { flex: 1, gap: Spacing.half },
  iconWrapper: { width: 32, alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cameraPreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: Spacing.two,
  },
  flipButton: { alignSelf: 'flex-end', minHeight: 40, opacity: 0.9 },
});
