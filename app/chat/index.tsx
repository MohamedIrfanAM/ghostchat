import { supabase } from '@/lib/supabase';
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'


const index = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const messageId = useRef(0)

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

  useEffect(() => {
    const channel = supabase.channel('room-1'); 

    const messageReceived = (payload:any) => {
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

      setMessages((prevMessages) => [newMessage,...prevMessages]);
      messageId.current += 1
    };
    channel.on('broadcast', { event: 'recieve' }, messageReceived).subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const onSend = useCallback((messages:IMessage[] = []) => {
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
  )}

export default index
