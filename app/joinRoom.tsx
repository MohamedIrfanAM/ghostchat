import { router } from 'expo-router'
import { Text, View } from '@/components/Themed'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { TextInput } from 'react-native'
import { Button } from 'react-native-elements'
import { supabase } from '@/lib/supabase'
import { useProfileStore } from '@/stores/profileStore'


const joinRoom = () => {

  const userId = useProfileStore(state => state.id)
  const setProfile = useProfileStore(state => state.setProfile)
  const profile = useProfileStore(state => state.profile)
  const [displayName, setDisplayName] = useState(profile.displayname)

  useEffect(() => {
    if (userId == '') {
      router.push('/')
    }
    else{
      fetchProfile()
    }
    
  }, [userId])

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('displayname, imageurl')
      .eq('id', userId)
    if (error) {
      console.log(error)
    }
    else {
      if (data.length > 0) {
        setProfile({
          displayname: data[0].displayname,
          imageurl: data[0].imageurl,
        })
        setDisplayName(data[0].displayname)
      }
    }
  }

  const updateDisplayName = async () => {
    setProfile({
      displayname: displayName,
      imageurl: '',
    })
    const { error } = await supabase
      .from('profiles')
      .update([
        {
          id: userId,
          displayname: displayName,
        }
      ])
      .eq('id', userId)
    console.log(error)
  }

  const joinQueue = async () => {
    await updateDisplayName()
    const { error } = await supabase
      .from('queue')
      .upsert([
        {
          userID: userId,
          roomID: null,
        }
      ], { onConflict: 'userID' })
    if (error) {
      console.log(error)
    }
    else {
      router.replace('/chat')
    }

  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Join Room</Text>
      <View style={styles.separator} />
      <TextInput placeholder="Display Name" onChangeText={(text) => setDisplayName(text)} value={displayName} />
      <Button title="Join Room" onPress={() => joinQueue()} />
    </SafeAreaView>
  )
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

export default joinRoom
