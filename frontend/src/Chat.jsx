import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Handle normal chat messages (user + AI placeholders)
    socketRef.current.on('chat_message', (data) => {
      setMessages(prev => [...prev, { sender: data.sender, text: data.text }]);
    });

    // Handle streamed updates for the last AI message
    socketRef.current.on('update_last_ai', (data) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.map(m => m.sender).lastIndexOf('AI');
        if (lastIndex !== -1) {
          updated[lastIndex] = { sender: 'AI', text: data.text };
        }
        return updated;
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current.emit('user_message', { message: input });
    setInput('');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>Islamic Therapy Chat</h2>
      <div style={{
        border: '1px solid #ccc',
        padding: '1rem',
        minHeight: '300px',
        marginBottom: '1rem',
        whiteSpace: 'pre-wrap'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            color: msg.sender === 'AI' ? 'blue' : 'black',
            margin: '0.5rem 0'
          }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        placeholder="Type how you're feeling..."
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        style={{ width: '80%', padding: '0.5rem' }}
      />
      <button onClick={sendMessage} style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}>Send</button>
    </div>
  );
}
