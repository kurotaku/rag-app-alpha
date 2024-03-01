import { useState, useEffect, useRef } from 'react';

type TextProps = {
  text: string;
  typingSpeed?: number;
};

const TypingText = ({ text, typingSpeed = 50 }: TextProps) => {
  const [displayText, setDisplayText] = useState('');
  const iteratorRef = useRef(text[Symbol.iterator]());
  const isTypingRef = useRef(false);

  useEffect(() => {
    async function typeMessage() {
      if (!isTypingRef.current) {
        isTypingRef.current = true;

        while (true) {
          const { value, done } = iteratorRef.current.next();

          if (done) {
            break;
          }

          await new Promise((resolve) =>
            setTimeout(() => {
              setDisplayText((prev) => prev + value);
              resolve(null);
            }, typingSpeed),
          );
        }

        isTypingRef.current = false;
      }
    }

    typeMessage();

    return () => {
      iteratorRef.current = text[Symbol.iterator]();
      isTypingRef.current = false;
    };
  }, [text, typingSpeed]);

  return <p>{displayText}</p>;
};

export default TypingText;
