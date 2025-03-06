
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useCheckIns(month?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['check-ins', user?.id, month],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      let query = supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id);
        
      if (month) {
        query = query.ilike('check_in_date', `${month}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
