
import { Link, useNavigate } from "react-router-dom";
import { motion } from "@/utils/animation";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Brain, Rocket, Zap } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    // If user is logged in, check if they have completed onboarding
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      try {
        // Check if the user has any goals set (indicating completed onboarding)
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
          
        if (goalsError) throw goalsError;
        
        // Check if the user has coach settings in their profile (another onboarding indicator)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('coach_style, coach_tone')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // If user has either goals or coach settings defined in their profile, they've likely completed onboarding
        if ((goals && goals.length > 0) || 
            (profileData && (profileData.coach_style || profileData.coach_tone))) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    
    checkOnboardingStatus();
  }, [user, navigate]);

  const features = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: "AI-Powered Coaching",
      description: "Get personalized guidance from our AI coach that adapts to your needs and preferences.",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Goal Tracking",
      description: "Set and track your personal goals with visual progress indicators and streak counters.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Daily Accountability",
      description: "Stay on track with daily check-ins and reflections to maintain momentum.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-32 md:pt-40 pb-16 md:pb-24">
            <div className="absolute top-0 left-0 right-0 h-screen bg-gradient-to-b from-primary/5 to-transparent -z-10" />
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6">
                    Your Personal Coach for <span className="text-primary">Positive Change</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Transform your goals into daily achievements with AI-powered coaching and accountability that adapts to your unique journey.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/onboarding">
                      <Button size="lg" className="gap-2">
                        Get Started <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative mx-auto max-w-4xl"
              >
                <div className="aspect-video rounded-xl overflow-hidden subtle-shadow glass-card border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-primary/5" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-6">
                      <Rocket className="h-12 w-12 mx-auto mb-4 text-primary animate-float" />
                      <h3 className="text-2xl font-medium mb-2">Start Your Journey</h3>
                      <p className="text-muted-foreground">
                        Personalized coaching designed for your success
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-4xl font-medium mb-4">
                  Transform Your Goals into Reality
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our personal coaching platform gives you everything you need to stay motivated and accountable.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-card p-6 rounded-xl border border-white/10"
                  >
                    <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-medium mb-4">
                  Ready to Transform Your Life?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Start your journey today with a personalized coach that helps you build better habits and achieve your goals.
                </p>
                <Link to="/onboarding">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
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

export default Index;
