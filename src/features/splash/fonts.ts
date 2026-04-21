import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { NotoSansSinhala_400Regular } from '@expo-google-fonts/noto-sans-sinhala';

/**
 * Aliases the Google Fonts assets to the names referenced in design tokens
 * (src/design/tokens.ts). Loaded once at app startup from the root layout.
 */
export const FONT_MAP = {
  IBMPlexSans: IBMPlexSans_400Regular,
  'IBMPlexSans-Medium': IBMPlexSans_500Medium,
  'IBMPlexSans-SemiBold': IBMPlexSans_600SemiBold,
  'IBMPlexSans-Bold': IBMPlexSans_700Bold,
  JetBrainsMono: JetBrainsMono_400Regular,
  NotoSansSinhala: NotoSansSinhala_400Regular,
};
