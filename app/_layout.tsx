import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useGuestStore } from '@/stores/profileStore';
import { Avatar } from 'react-native-elements';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const guestProfile = useGuestStore(state => state.profile)
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="joinRoom" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{
          headerShown: true,
          headerBackTitleVisible: false,
          headerTitle: () => {
            if (guestProfile.displayname == '') return <Text style={
              {
                fontSize: 20,
                fontWeight: 'bold',
              }
            }>Loading...</Text>
            return (
              <View style={
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }
              }>
                <Avatar
                  rounded
                  source={{
                    uri:
                      'https://s3.amazonaws.com/uifaces/faces/twitter/ladylexy/128.jpg',
                  }}
                />
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{guestProfile.displayname}</Text>
              </View>
            )
          },
          headerRight: () => {
            if (guestProfile.displayname == '') return <View></View>
            return (
              <View >
                <TouchableOpacity onPress={() => console.log('settings')} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Skip</Text>
                  <FontAwesome.Button
                    name="sign-out"
                    backgroundColor="transparent"
                    color="black"
                    onPress={() => console.log('sign out')}
                  />
                </TouchableOpacity>
              </View>)
          },
        }} />
      </Stack>
    </ThemeProvider>
  );
}
