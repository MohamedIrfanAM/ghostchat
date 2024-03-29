import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useGuestStore, useProfileStore } from '@/stores/profileStore'
import { router } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

const index = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const messageId = useRef(0)
  const userId = useProfileStore(state => state.id)
  const setGuestId = useGuestStore(state => state.setGuestId)
  const guestId = useGuestStore(state => state.guestId)
  // const profile = useProfileStore(state => state.profile)
  const roomId = useGuestStore(state => state.roomId)
  const { guestProfile, setGuestProfile } = useGuestStore((state) => ({ guestProfile: state.profile, setGuestProfile: state.setProfile }))

  const deleteQueueEntry = async (id: string) => {
    const { data, error } = await supabase
      .from('queue')
      .delete()
      .eq('userID', id)
    if (error !== null) {
      console.log("error whle deleting queue entry")
      console.log(error)
    }
  }

  const getGuestProfile = async (roomID: number) => {
    const { data, error } = await supabase
      .from('queue')
      .select(`
        userID,
        profiles(
          displayname,
          imageurl
        )
      `)
      .eq('roomID', roomID)
      .neq('userID', userId)

    if (error) {
      console.log(error)
      return
    }
    const profile = data[0].profiles
    console.log('GuestId: ' + data[0].userID)
    setGuestProfile(profile)
    setGuestId(data[0].userID)
    // deleteQueueEntry(data[0].userID)
  }


  useEffect(() => {
    if (userId == '') {
      router.replace('/')
    }
    console.log('userId: ', userId)
  }, []);

  useEffect(() => {
    if (roomId != -1 && roomId > 0) {
      console.log('roomId: ', roomId)
      getGuestProfile(roomId)
      console.log('create channel with userId: ', userId)
      const channel = supabase.channel(userId)
      Toast.show({
        type: 'success',
        text1: 'Guest joined the room',
        position: 'bottom',
      });
      const messageReceived = (payload: any) => {
        const message = payload?.payload?.message
        const newMessage: IMessage = {
          _id: messageId.current,
          text: message,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: guestProfile.displayname,
            avatar: guestProfile.imageurl,
          },
        }

        setMessages((prevMessages) => [newMessage, ...prevMessages]);
        messageId.current += 1
      };

      channel.on('broadcast', { event: 'message' }, messageReceived).subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
    else {
      console.log('roomId is not valid')
    }
  }, [roomId]);

  const sendMessage = async (message: string) => {

    if (!message || roomId == -1) {
      console.log('no message or roomID')
      return;
    }
    console.log('create channel with guestId: ' + guestId)
    const channel = supabase.channel(guestId)
    try {
      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: { message },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onSend = useCallback((messages: IMessage[] = []) => {
    sendMessage(messages[0].text)
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    )
  }, [roomId])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {roomId == -1 ?
        <View style={styles.container} >
          <View>
            <ActivityIndicator size="large" animating={roomId == -1} />
            <Text>Waiting for guest to join</Text>
          </View>
        </View>
        :
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: 1,
          }}
        />
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


export default index

