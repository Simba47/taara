import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, hsl(225 73% 57% / 0.07) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-glow mb-7">
          <Star className="h-7 w-7 text-primary-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground mb-3">
          Taara Talent
        </h1>
        <p className="font-body text-muted-foreground text-sm leading-relaxed mb-12 max-w-[280px]">
          The modern platform for talent agencies. Manage your team, track your
          talent, grow your business.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            onClick={() => navigate("/admin/login")}
            className="flex-1 h-11 rounded-xl font-body font-semibold text-[13px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          >
            Admin Login
          </Button>
          <Button
            onClick={() => navigate("/manager/login")}
            variant="outline"
            className="flex-1 h-11 rounded-xl font-body font-semibold text-[13px] border-border hover:bg-accent hover:text-accent-foreground"
          >
            Manager Login
          </Button>
        </div>
        <p className="mt-6 font-body text-[12px] text-muted-foreground">
          New agency?{" "}
          <button
            onClick={() => navigate("/admin/signup")}
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
