
import { motion } from "@/utils/animation";

interface VoiceVisualizerProps {
  isRecording: boolean;
  amplitude: number;
}

const VoiceVisualizer = ({ isRecording, amplitude }: VoiceVisualizerProps) => {
  if (!isRecording) return null;

  return (
    <div className="mb-4 h-12 flex items-center justify-center">
      <div className="flex items-end space-x-1">
        {[...Array(20)].map((_, i) => {
          const height = Math.min(40, Math.max(3, amplitude * Math.sin(i / 2) * 0.5)) + 5;
          return (
            <motion.div
              key={i}
              className="w-1 bg-primary rounded-full"
              initial={{ height: 5 }}
              animate={{ height }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VoiceVisualizer;
