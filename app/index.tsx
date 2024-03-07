import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Link } from 'expo-router';
import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase';
import Auth from '@/components/Auth';
import { Session } from '@supabase/supabase-js'
import { router } from 'expo-router';
import {useProfileStore} from '../stores/profileStore'

export default function TabOneScreen() {
  const [session, setSession] = useState<Session | null>(null)
  const setId = useProfileStore(state => state.setId)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    if(session && session.user && session.user.id) {
      setId(session?.user?.id)
      router.push('/joinRoom')
    }
  }, [session])

  return (
    <View>
      <Auth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
