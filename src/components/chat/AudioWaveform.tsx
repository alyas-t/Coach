
import { motion } from "@/utils/animation";

interface AudioWaveformProps {
  amplitude: number;
  isAiSpeaking?: boolean;
}

const AudioWaveform = ({ amplitude, isAiSpeaking = false }: AudioWaveformProps) => {
  return (
    <div className="flex items-end space-x-1">
      {[...Array(20)].map((_, i) => {
        let height;
        
        if (isAiSpeaking) {
          // Create a wave-like pattern for AI speaking
          const phase = Date.now() / 1000 * Math.PI * 2;
          height = 5 + Math.sin(phase + i / 3) * 15 + 15;
        } else {
          // User microphone visualization
          height = Math.min(40, Math.max(3, amplitude * Math.sin(i / 2) * 0.5)) + 5;
        }
        
        return (
          <motion.div
            key={i}
            className={`w-1 ${isAiSpeaking ? 'bg-primary/70' : 'bg-primary'} rounded-full`}
            initial={{ height: 5 }}
            animate={{ height }}
            transition={{ duration: 0.1 }}
          />
        );
      })}
    </div>
  );
};

export default AudioWaveform;
