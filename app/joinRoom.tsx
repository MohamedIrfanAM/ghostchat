import { Text, View } from '@/components/Themed'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {StyleSheet} from 'react-native'
import { TextInput } from 'react-native'
import { Button } from 'react-native-elements'
import { supabase } from '@/lib/supabase'


const joinRoom = () => {

  const [displayName, setDisplayName] = useState('')
  const userId = '1ddfad57-f13d-4b7a-b82a-1c71b345d5be'

  const updateDisplayName = async () => {
    const { error } = await supabase
      .from('profiles')
      .update([
        { id: userId,
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
        { userID: userId,
          roomID: null,
        }
      ],{onConflict: 'userID'})
    console.log(error)
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Join Room</Text>
      <View style={styles.separator}/>
      <TextInput placeholder="Display Name" onChangeText={(text) => setDisplayName(text)} value={displayName} />
      <Button title="Join Room" onPress={() => joinQueue()}  />
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
