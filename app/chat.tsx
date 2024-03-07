import { supabase } from '@/lib/supabase';
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useProfileStore } from '@/stores/profileStore'
import { router } from 'expo-router';

type profile = {
  displayname: string
  imageurl: string
}

const index = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const messageId = useRef(0)
  const userId = useProfileStore(state => state.id)
  const [guestId, setGuestId] = useState('')
  // const profile = useProfileStore(state => state.profile)
  const [roomID, setRoomID] = useState('')
  const [guestProfile, setGuestProfile] = useState<profile>({ displayname: '', imageurl: '' })

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
    setGuestProfile(profile)
    setGuestId(data[0].userID)
    deleteQueueEntry(data[0].userID)
  }


  useEffect(() => {
    if (userId == '') {
      router.replace('/')
    }
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
          const roomId = payload?.new?.roomID
          const state = payload?.new?.state
          if (roomId !== null) {
            setRoomID(roomId)
            getGuestProfile(parseInt(roomId))
          }
        }
      )
      .subscribe()
  }, []);

  useEffect(() => {
    if (roomID !== '') {
      const channel = supabase.channel(userId) 
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
  }, [roomID]);

  const sendMessage = async (message: string) => {

    if (!message || roomID == '') {
      console.log('no message or roomID')
      return;

    }
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
  }, [roomID])

  return (
    <GiftedChat
      messages={messages}
      onSend={messages => onSend(messages)}
      user={{
        _id: 1,
      }}
    />
  )
}

export default index
