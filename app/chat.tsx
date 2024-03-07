import { supabase } from '@/lib/supabase';
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'


const index = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const messageId = useRef(0)
  const userId = '1ddfad57-f13d-4b7a-b82a-1c71b345d5be'

  const sendMessage = async (message: string) => {
    if (!message) return;

    try {
      const channel = supabase.channel('room-1');
      await channel.send({
        type: 'broadcast',
        event: 'send',
        payload: { message },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteQueueEntry = async () => {
    const { data, error } = await supabase
      .from('queue')
      .delete()
      .eq('userID', userId)
    if(error){
      console.log(error)
    }
  }

  useEffect(() => {
    const channel = supabase.channel('room-1');
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
          if(roomId !== null){
            deleteQueueEntry()
          }
          console.log(roomId)
        }
      )
      .subscribe()

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
    channel.on('broadcast', { event: 'recieve' }, messageReceived).subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const onSend = useCallback((messages: IMessage[] = []) => {
    sendMessage(messages[0].text)
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    )
  }, [])

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
