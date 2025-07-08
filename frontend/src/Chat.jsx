import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); 

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    socket.on('ai_response', (data) => {
      setAiResponse(prev => prev + data.chunk);
    });

    return () => {
      socket.off('ai_response');
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setAiResponse('');
    socket.emit('user_message', { message: input });
    setInput('');
  };

  useEffect(() => {
    if (aiResponse) {
      setMessages(prev => [...prev.filter(m => m.sender !== 'ai'), { sender: 'ai', text: aiResponse }]);
    }
  }, [aiResponse]);

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>Islamic Therapy Chat</h2>
      <div style={{ border: '1px solid #ccc', padding: '1rem', minHeight: '300px', marginBottom: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ color: msg.sender === 'ai' ? 'blue' : 'black', margin: '0.5rem 0' }}>
            <strong>{msg.sender === 'ai' ? 'AI' : 'You'}:</strong> {msg.text}
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
