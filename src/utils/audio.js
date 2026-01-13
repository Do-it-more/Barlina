/**
 * Utility for playing success sounds.
 * Uses Web Audio API to generate a sound without external assets.
 */

let audioContext = null;

export const initializeAudio = () => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (error) {
        console.error("Failed to initialize audio context:", error);
    }
};

/**
 * Plays a pleasant, premium "Glassy" chime.
 * A rich major chord (C Major 7) that feels airy and positive.
 */
export const playSuccessSound = () => {
    try {
        if (!audioContext) {
            initializeAudio();
        }

        const ctx = audioContext;
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const t = ctx.currentTime;
        const duration = 0.6;

        // Frequencies for a C Major 7 chord (High octave for "sparkle")
        // C6 (1046.50), E6 (1318.51), G6 (1567.98), B6 (1975.53)
        // We will play them slightly arpeggiated (staggered start) to sound like a strum/chime
        const notes = [1046.50, 1318.51, 1567.98, 1975.53];

        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine'; // Pure tone
            osc.frequency.value = freq;

            // Stagger start times slightly for a "strum" effect (15ms apart)
            const startTime = t + (index * 0.015);
            const stopTime = startTime + duration;

            // Envelope
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.05, startTime + 0.05); // Low volume to keep it subtle
            gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

            osc.start(startTime);
            osc.stop(stopTime);
        });

    } catch (error) {
        console.error("Error playing success sound:", error);
    }
};
