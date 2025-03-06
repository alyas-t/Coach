
import Dashboard from "@/components/dashboard/Dashboard";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";

const DashboardPage = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <Dashboard />
        </main>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;
