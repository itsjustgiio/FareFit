import { useEffect, useState } from 'react';
import { getUserFitnessGoals } from '../userService';

export function useUserFitnessGoal(userId: string | undefined) {
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserFitnessGoals(userId)
      .then((data) => {
        setGoal(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  return { goal, loading, error };
}
