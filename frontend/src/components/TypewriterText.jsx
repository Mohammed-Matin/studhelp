import { useState, useEffect } from 'react';

const TypewriterText = ({ text, speed = 50, delay = 400, className = '' }) => {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let index = 0;
        let intervalId;

        const startId = setTimeout(() => {
            intervalId = setInterval(() => {
                index += 1;
                setDisplayed(text.slice(0, index));
                if (index >= text.length) {
                    clearInterval(intervalId);
                    setDone(true);
                }
            }, speed);
        }, delay);

        return () => {
            clearTimeout(startId);
            clearInterval(intervalId);
        };
    }, [text, speed, delay]);

    return (
        <span className={className}>
            {displayed}
            <span
                className={`inline-block w-0.5 h-[0.85em] ml-1 align-middle bg-cyan-400 typewriter-cursor ${
                    done ? 'opacity-60' : ''
                }`}
                aria-hidden="true"
            />
        </span>
    );
};

export default TypewriterText;
