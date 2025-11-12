import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";

interface StreakTabProps {
  userId: string;
  refreshTrigger: number;
}

const StreakTab = ({ userId, refreshTrigger }: StreakTabProps) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreaks();
  }, [userId, refreshTrigger]);

  const fetchStreaks = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, best_streak')
        .eq('id', userId)
        .single();

      if (profile) {
        setCurrentStreak(profile.current_streak || 0);
        setBestStreak(profile.best_streak || 0);
      }
    } catch (error) {
      console.error('Error fetching streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading your progress...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Your Kindness Streak</h2>
        <p className="text-muted-foreground">Keep the momentum going!</p>
      </div>

      <div className="space-y-4">
        <Card className="p-8 bg-gradient-to-br from-primary/10 via-card to-primary/5 border-2 border-primary/20 shadow-lg">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Flame className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <div className="text-6xl font-bold text-primary mb-2">
                {currentStreak}
              </div>
              <div className="text-lg font-semibold text-foreground">
                Current Streak
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {currentStreak === 0 && "Complete today's act to start your streak!"}
                {currentStreak === 1 && "Great start! Keep it going!"}
                {currentStreak > 1 && currentStreak < 7 && "You're on fire! 🔥"}
                {currentStreak >= 7 && currentStreak < 30 && "Incredible dedication! ✨"}
                {currentStreak >= 30 && "You're a kindness champion! 🏆"}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-celebration/10 via-card to-celebration/5 border-2 border-celebration/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-celebration/20 rounded-full flex items-center justify-center">
              <Trophy className="w-7 h-7 text-celebration" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">Best Streak</div>
              <div className="text-3xl font-bold text-celebration">{bestStreak}</div>
            </div>
          </div>
        </Card>

        {currentStreak > 0 && (
          <Card className="p-6 bg-muted/50 border-2">
            <div className="text-center space-y-2">
              <div className="text-sm font-semibold text-foreground">Keep Going!</div>
              <div className="text-xs text-muted-foreground">
                Complete your act every day to maintain your streak
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StreakTab;
