
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/layout/PageTransition";

const About = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <Link to="/">
              <Button variant="ghost" className="mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            
            <h1 className="text-4xl font-bold mb-8">About Personal Coach</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="text-lg leading-relaxed">
                  Personal Coach is designed to help you transform your goals into achievable daily tasks with the 
                  help of AI-powered coaching and accountability tools. Our platform adapts to your unique journey,
                  providing personalized guidance and support every step of the way.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
                <ul className="list-disc pl-6 space-y-3 text-lg">
                  <li>
                    <span className="font-medium">AI-Powered Coaching:</span> Get personalized guidance from our AI coach that adapts to your needs and preferences.
                  </li>
                  <li>
                    <span className="font-medium">Goal Tracking:</span> Set and track your personal goals with visual progress indicators and streak counters.
                  </li>
                  <li>
                    <span className="font-medium">Daily Accountability:</span> Stay on track with morning plans and evening reflections to maintain momentum.
                  </li>
                  <li>
                    <span className="font-medium">Weekly Progress Charts:</span> Visualize your progress over time with intuitive charts and analytics.
                  </li>
                  <li>
                    <span className="font-medium">Calendar Integration:</span> Keep track of your check-ins and important milestones.
                  </li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">About the Creator</h2>
                <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
                  <h3 className="text-xl font-medium mb-2">Alyas Thomas</h3>
                  <p className="text-lg leading-relaxed">
                    Alyas is a self-driven UC Irvine undergraduate software engineering student seeking a bachelor's degree. 
                    As a software developer, he is constantly excited to try out new technologies and works hard to create 
                    new projects that will ultimately help him learn more!
                  </p>
                  <p className="text-lg leading-relaxed mt-3">
                    Personal Coach represents his vision of combining artificial intelligence with personal development 
                    to create a tool that can help people achieve their goals and improve their lives.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
        
        <footer className="py-8 border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <span className="text-xl font-medium text-primary">PersonalCoach</span>
              </div>
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Personal Coach. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default About;
