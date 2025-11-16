import React from 'react';

const Chat = ({ messages, newMessage, onMessageChange, onSendMessage, player }) => {
  const handleInputChange = (e) => {
    const value = e.target.value.slice(0, 50); // Limit to 50 characters
    onMessageChange({ target: { value } });
  };

  return (
    <div className="chat-container">
      <h3 style={{margin: '0 0 15px 0', color: '#FFFFFF'}}>Chat</h3>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.player === player ? 'own-message' : 'other-message'}`}>
            <span className="message-text">{msg.message}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{textAlign: 'center', color: '#666', fontStyle: 'italic', margin: '50% 0'}}>
            No messages yet. Start chatting!
          </div>
        )}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={e => e.key === 'Enter' && newMessage.trim() && onSendMessage()}
          placeholder={`Type a message... (${newMessage.length}/50)`}
          className="chat-input"
          maxLength={50}
        />
        <button onClick={onSendMessage} className="send-btn" disabled={!newMessage.trim()}>Send</button>
      </div>
    </div>
  );
};

export default Chat;