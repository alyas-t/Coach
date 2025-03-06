
import ChatInterface from "@/components/chat/ChatInterface";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";

const Chat = () => {
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
