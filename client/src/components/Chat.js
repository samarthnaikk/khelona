import React from 'react';

const Chat = ({ messages, newMessage, onMessageChange, onSendMessage, player }) => {
  return (
    <div className="chat-container">
      <h3 style={{margin: '0 0 15px 0', color: '#FFFFFF'}}>Chat</h3>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.player === player ? 'own-message' : 'other-message'}`}>
            <span className="message-sender">{msg.player}</span>
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
          onChange={onMessageChange}
          onKeyPress={e => e.key === 'Enter' && onSendMessage()}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button onClick={onSendMessage} className="send-btn">Send</button>
      </div>
    </div>
  );
};

export default Chat;