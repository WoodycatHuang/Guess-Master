import {
  NotoSansSC_700Bold,
} from '@expo-google-fonts/noto-sans-sc';
import {
  PressStart2P_400Regular,
} from '@expo-google-fonts/press-start-2p';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    PressStart2P_400Regular,
    NotoSansSC_700Bold,
  });

  return { loaded, error };
}
