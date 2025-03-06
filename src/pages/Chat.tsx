
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatInterface from "@/components/chat/ChatInterface";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-4xl mx-auto h-[calc(100vh-180px)]">
            <Card className="h-full overflow-hidden">
              <ChatInterface />
            </Card>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default Chat;
