import { router } from 'expo-router'
// import { Text, View } from '@/components/Themed'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet,Text, View } from 'react-native'
import { TextInput } from 'react-native'
import { Button } from 'react-native-elements'
import { supabase } from '@/lib/supabase'
import { useGuestStore, useProfileStore } from '@/stores/profileStore'


const joinRoom = () => {

  const userId = useProfileStore(state => state.id)
  const setProfile = useProfileStore(state => state.setProfile)
  const profile = useProfileStore(state => state.profile)
  const [displayName, setDisplayName] = useState(profile.displayname)
  const setRoomId = useGuestStore(state => state.setRoomId)
  const setGuestProfile = useGuestStore(state => state.setProfile)

  useEffect(() => {
    if (userId == '') {
      router.push('/')
    }
    else {
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
    setRoomId(-1)
    setGuestProfile({
      displayname: '',
      imageurl: '',
    })
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
      <TextInput placeholder="Display Name" onChangeText={(text) => setDisplayName(text)} value={displayName} style={styles.input} />
      <Button title="Join Room" onPress={() => joinQueue()} style={styles.button}/>
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
    fontSize: 30,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  button: {
    width: '80%',
    padding: 10,
    margin: 12,
  },
  input: {
    height: 50,
    padding: 10,
    width: '80%',
    margin: 12,
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 10,
    fontWeight: 'bold',
    fontSize: 20,
    color: 'black',
  },
});

export default joinRoom
