import { supabase } from '@/lib/supabase';
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useProfileStore } from '@/stores/profileStore'
import { RealtimeChannel } from '@supabase/supabase-js';
import { router } from 'expo-router';


const index = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const messageId = useRef(0)
  const userId = useProfileStore(state => state.id)
  const profile = useProfileStore(state => state.profile)
  const [roomID, setRoomID] = useState('')

  const deleteQueueEntry = async () => {
    const { data, error } = await supabase
      .from('queue')
      .delete()
      .eq('userID', userId)
    if (error) {
      console.log(error)
    }
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
          if (roomId !== null) {
            setRoomID(roomId)
            deleteQueueEntry()
          }
        }
      )
      .subscribe()
  }, []);

  useEffect(() => {
    if (roomID !== '') {
      const channel = supabase.channel('room-' + roomID)
      const messageReceived = (payload: any) => {
        const newMessage: IMessage = {
          _id: messageId.current,
          text: payload?.payload?.message,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        }
        setMessages((prevMessages) => [newMessage, ...prevMessages]);
        messageId.current += 1
      };

      channel.on('broadcast', { event: 'send' }, messageReceived).subscribe();

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
    const channel = supabase.channel('room-' + roomID)
    try {
      await channel.send({
        type: 'broadcast',
        event: 'receive',
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
