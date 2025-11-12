import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Heart, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface Act {
  id: string;
  title: string;
  description: string | null;
  date: string;
}

interface TodayTabProps {
  userId: string;
  onComplete: () => void;
}

const TodayTab = ({ userId, onComplete }: TodayTabProps) => {
  const [todayAct, setTodayAct] = useState<Act | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchTodayAct();
  }, [userId]);

  const fetchTodayAct = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's act
      const { data: act, error: actError } = await supabase
        .from('acts')
        .select('*')
        .eq('date', today)
        .single();

      if (actError) throw actError;

      setTodayAct(act);

      // Check if already completed
      const { data: completion } = await supabase
        .from('completions')
        .select('*')
        .eq('user_id', userId)
        .eq('act_id', act.id)
        .maybeSingle();

      setIsCompleted(!!completion);
    } catch (error: any) {
      console.error('Error fetching today act:', error);
      toast.error("Couldn't load today's act");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!todayAct) return;

    setCompleting(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Mark as completed
      const { error: completionError } = await supabase
        .from('completions')
        .insert({
          user_id: userId,
          act_id: todayAct.id,
          date: today
        });

      if (completionError) throw completionError;

      // Update streak logic
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        const lastDate = profile.last_completion_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = profile.current_streak || 0;
        
        if (lastDate === yesterdayStr) {
          // Consecutive day
          newStreak += 1;
        } else if (lastDate === today) {
          // Already completed today
          newStreak = profile.current_streak;
        } else {
          // Streak broken, start new
          newStreak = 1;
        }

        const newBestStreak = Math.max(newStreak, profile.best_streak || 0);

        await supabase
          .from('profiles')
          .update({
            current_streak: newStreak,
            best_streak: newBestStreak,
            last_completion_date: today
          })
          .eq('id', userId);
      }

      // Celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']
      });

      setIsCompleted(true);
      toast.success("Amazing! You've completed today's act of kindness! 🎉");
      onComplete();
    } catch (error: any) {
      console.error('Error completing act:', error);
      toast.error("Couldn't mark as complete. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading today's kindness...</div>
      </div>
    );
  }

  if (!todayAct) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground" />
          <div className="text-muted-foreground">No act scheduled for today</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Today's Act of Kindness</h2>
        <p className="text-muted-foreground">Small acts, big impact</p>
      </div>

      <Card className="p-8 space-y-6 bg-gradient-to-br from-card via-secondary/20 to-card border-2 shadow-lg">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          
          <h3 className="text-3xl font-bold text-primary">{todayAct.title}</h3>
          
          {todayAct.description && (
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {todayAct.description}
            </p>
          )}
        </div>

        {isCompleted ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg font-semibold">Completed!</span>
            </div>
            <p className="text-center text-muted-foreground">
              You've made the world a little brighter today ✨
            </p>
          </div>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {completing ? (
              "Completing..."
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Mark as Complete
              </>
            )}
          </Button>
        )}
      </Card>
    </div>
  );
};

export default TodayTab;
