import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterProps {
    text: string | string[];
    speed?: number;
    delay?: number;
    pause?: number;
    cursor?: boolean;
    loop?: boolean;
    className?: string;
    cursorClassName?: string;
}

/**
 * Ultra-smooth Framer Motion Typewriter component.
 * Types text character by character with an authentic blinking cursor.
 * Supports single string and rotating multi-string arrays with optional looping.
 */
export function Typewriter({
    text,
    speed = 45,
    delay = 250,
    pause = 2400,
    cursor = true,
    loop = true,
    className = "",
    cursorClassName = "",
}: TypewriterProps) {
    const rawTexts = Array.isArray(text) ? text : [text];
    const texts = rawTexts.filter((t) => typeof t === "string" && t.trim().length > 0);
    const safeTexts = texts.length > 0 ? texts : [""];

    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset when the text prop changes (e.g. banner slider changes)
    const textKey = JSON.stringify(text);
    useEffect(() => {
        setCurrentTextIndex(0);
        setDisplayedText("");
        setIsDeleting(false);
    }, [textKey]);

    useEffect(() => {
        const fullText = safeTexts[currentTextIndex] || "";
        if (!fullText) return;

        let timer: ReturnType<typeof setTimeout> | undefined;

        if (!loop && safeTexts.length === 1) {
            // Type once and stop with blinking cursor
            if (displayedText.length < fullText.length) {
                timer = setTimeout(() => {
                    setDisplayedText(fullText.slice(0, displayedText.length + 1));
                }, displayedText.length === 0 ? delay : speed);
            }
        } else {
            // Loop mode (single or multiple items)
            if (!isDeleting && displayedText.length < fullText.length) {
                timer = setTimeout(() => {
                    setDisplayedText(fullText.slice(0, displayedText.length + 1));
                }, displayedText.length === 0 ? delay : speed);
            } else if (!isDeleting && displayedText.length === fullText.length) {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, pause);
            } else if (isDeleting && displayedText.length > 0) {
                timer = setTimeout(() => {
                    setDisplayedText(fullText.slice(0, displayedText.length - 1));
                }, speed / 1.8);
            } else if (isDeleting && displayedText.length === 0) {
                timer = setTimeout(() => {
                    setIsDeleting(false);
                    setCurrentTextIndex((prev) => (prev + 1) % safeTexts.length);
                }, 350);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [displayedText, isDeleting, currentTextIndex, safeTexts, speed, delay, pause, loop]);

    return (
        <span className={`inline-block ${className}`}>
            <span>{displayedText}</span>
            {cursor && (
                <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className={`inline-block font-mono font-light ml-1 select-none ${cursorClassName || "text-white"}`}
                    aria-hidden="true"
                >
                    |
                </motion.span>
            )}
        </span>
    );
}
