import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Act {
  id: string;
  title: string;
  date: string;
}

interface HistoryEntry {
  act: Act;
  completed: boolean;
}

interface HistoryTabProps {
  userId: string;
  refreshTrigger: number;
}

const HistoryTab = ({ userId, refreshTrigger }: HistoryTabProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId, refreshTrigger]);

  const fetchHistory = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get acts from the past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const { data: acts, error: actsError } = await supabase
        .from('acts')
        .select('*')
        .lte('date', todayStr)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (actsError) throw actsError;

      // Get user's completions
      const { data: completions } = await supabase
        .from('completions')
        .select('act_id')
        .eq('user_id', userId);

      const completedActIds = new Set(completions?.map(c => c.act_id) || []);

      // Filter out today's act if not completed, show all past acts with completion status
      const historyData = acts
        ?.filter(act => {
          // Show past acts regardless of completion
          if (act.date < todayStr) return true;
          // Only show today's act if it's been completed
          if (act.date === todayStr) return completedActIds.has(act.id);
          return false;
        })
        .map(act => ({
          act,
          completed: completedActIds.has(act.id)
        })) || [];

      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading your history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
          <div className="text-muted-foreground">No history yet</div>
          <div className="text-sm text-muted-foreground">Start completing acts to build your history</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Your Kindness Journey</h2>
        <p className="text-muted-foreground">Track your impact over time</p>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-3 pr-4">
          {history.map((entry) => (
            <Card
              key={entry.act.id}
              className={`p-4 transition-all ${
                entry.completed
                  ? 'bg-success/5 border-success/20'
                  : 'bg-muted/30 border-muted'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${entry.completed ? 'text-success' : 'text-muted-foreground'}`}>
                  {entry.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold ${
                      entry.completed ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {entry.act.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.act.date), 'MMM d')}
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${
                    entry.completed ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {entry.completed ? 'Completed ✓' : 'Missed'}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HistoryTab;
