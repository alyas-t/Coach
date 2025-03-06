
import React from "react";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import CoachSettingsForm from "@/components/settings/CoachSettingsForm";

const Settings = () => {
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
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            
            <CoachSettingsForm />
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default Settings;
