import Toast from 'react-native-toast-message';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useGuestStore, useProfileStore } from '@/stores/profileStore';
import { Avatar } from 'react-native-elements';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

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
  const setGuestProfile = useGuestStore(state => state.setProfile)
  const setRoomId = useGuestStore(state => state.setRoomId)
  const setGuestId = useGuestStore(state => state.setGuestId)
  const colorScheme = useColorScheme();
  const userId = useProfileStore(state => state.id)

  const validateSkipCount = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('skipCount, skipDay')
      .eq('id', userId)
    if (error) {
      console.log(error)
    }
    console.log(data)
    const today = new Date().toLocaleDateString('en-CA')
    console.log(today)

    if(data && data.length > 0) {
      if(data[0].skipDay === today) {
        console.log('skipDay is today')
        if(data[0].skipCount >= 5) {
          Toast.show({
            type: 'error',
            text1: 'You have reached the maximum number of skips for today',
            position: 'bottom',
          });
          return false
        }
      }
      return data[0].skipCount
    }
  }

  const incrementSkipCount = async (prevCount:number) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ skipCount: prevCount + 1, skipDay: new Date().toLocaleDateString('en-CA') })
      .eq('id', userId)
    if (error) {
      console.log(error)
    }
  }

  const joinQueue = async () => {
    const prevCount = await validateSkipCount()
    if(prevCount === false) {
      return
    }
    setRoomId(-1)
    setGuestProfile({
      displayname: '',
      imageurl: '',
    })
    setGuestId('')
    const changes = supabase
      .channel('table-filter-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue',
          filter: `userID=eq.${userId}`,
        },
        (payload) => {
          console.log(payload)
          const roomId = payload?.new?.roomID
          const state = payload?.new?.state
          if (roomId !== null) {
            setRoomId(roomId)
            console.log(roomId)
          }
        }
      ).subscribe()


    const { error } = await supabase
      .from('queue')
      .upsert([
        {
          userID: userId,
          roomID: null,
        }
      ], { onConflict: 'userID' })

   const {data} = await supabase.from('queue').select('roomID').eq('userID', userId)
    if(data && data.length > 0) {
      if(data[0].roomID != null) {
        setRoomId(data[0].roomID)
        }
    }
    incrementSkipCount(prevCount)
    if (error) {
      console.log(error)
    }
    else {
      router.replace('/chat')
    }

  }


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
                <TouchableOpacity onPress={() => console.log('settings')} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }} onPressIn={joinQueue}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Skip</Text>
                  <FontAwesome.Button
                    name="sign-out"
                    backgroundColor="transparent"
                    color="black"
                  />
                </TouchableOpacity>
              </View>)
          },
        }} />
      </Stack>
      <Toast/>
    </ThemeProvider>
  );
}
