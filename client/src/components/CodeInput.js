import React from 'react';

const CodeInput = ({ codeDigits, onCodeInput, onPaste, onKeyDown }) => {
  return (
    <div className="otp-inputs">
      {codeDigits.map((digit, index) => (
        <input
          key={index}
          id={`code-input-${index}`}
          type="text"
          value={digit}
          onChange={e => onCodeInput(index, e.target.value)}
          onKeyDown={e => onKeyDown(index, e)}
          onPaste={e => onPaste(index, e)}
          className="otp-input"
          maxLength="1"
        />
      ))}
    </div>
  );
};

export default CodeInput;