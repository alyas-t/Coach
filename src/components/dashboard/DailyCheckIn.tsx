
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { motion } from "@/utils/animation";

const DailyCheckIn = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkInStage, setCheckInStage] = useState(0);
  
  const questions = [
    "How are you feeling today?",
    "What's your main focus for today?",
    "Is there anything challenging you today?",
  ];
  
  const handleComplete = () => {
    if (checkInStage < questions.length - 1) {
      setCheckInStage(checkInStage + 1);
    } else {
      setIsCompleted(true);
    }
  };
  
  const handleSkip = () => {
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-green-100 border border-green-200 rounded-full p-2 mr-4">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Morning check-in completed</h3>
              <p className="text-sm text-green-700">
                Great job! Your coach will review your responses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-medium text-primary-foreground">
                Morning Check-in
              </h3>
              <p className="text-sm text-primary-foreground/70">
                Start your day with intention and awareness
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-4 sm:mt-0 bg-white/90 hover:bg-white border-white/20 text-primary"
              onClick={handleSkip}
            >
              Skip Today
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <motion.div
            key={checkInStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
              <span>Question {checkInStage + 1} of {questions.length}</span>
              <span>{Math.round(((checkInStage + 1) / questions.length) * 100)}% complete</span>
            </div>
            
            <h4 className="text-lg font-medium">{questions[checkInStage]}</h4>
            
            <div className="bg-muted/50 rounded-lg p-4 min-h-[100px] border border-border">
              <textarea
                className="w-full bg-transparent resize-none focus:outline-none min-h-[80px]"
                placeholder="Type your response here..."
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={handleSkip}>
                <X className="h-4 w-4 mr-1" /> Skip
              </Button>
              <Button size="sm" onClick={handleComplete}>
                <Check className="h-4 w-4 mr-1" /> 
                {checkInStage < questions.length - 1 ? "Next" : "Complete"}
              </Button>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCheckIn;
