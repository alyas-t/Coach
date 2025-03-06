
import { motion } from "@/utils/animation";

interface SpeechTranscriptProps {
  transcript: string;
  isRecording: boolean;
}

const SpeechTranscript = ({ transcript, isRecording }: SpeechTranscriptProps) => {
  if (transcript) {
    return (
      <div className="mb-4 min-h-[60px]">
        <p className="text-sm font-medium mb-1">Voice Message:</p>
        <p>{transcript}</p>
      </div>
    );
  }

  return (
    <div className="mb-4 text-center py-4 text-muted-foreground">
      {isRecording ? "Listening..." : "Press the microphone button to start speaking"}
    </div>
  );
};

export default SpeechTranscript;
