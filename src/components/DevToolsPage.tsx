import React from 'react';
import { showUserMeals, mealSummary } from '../devTools/checkMeals';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function DevToolsPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Developer Tools</CardTitle>
          <CardDescription>
            Quick access to development utilities. Check the browser console for output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => showUserMeals()}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="font-semibold">📊 Show User Meals</div>
              <div className="text-sm text-muted-foreground mt-1">
                Detailed meal log with nutrition info
              </div>
            </Button>

            <Button 
              onClick={() => mealSummary()}
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="font-semibold">📋 Meal Summary</div>
              <div className="text-sm text-muted-foreground mt-1">
                Quick overview of logged meals
              </div>
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Console Commands:</h4>
            <div className="text-sm space-y-1 font-mono">
              <div><code>showUserMeals()</code> - Detailed meal log</div>
              <div><code>meals()</code> - Same as above (shorter)</div>
              <div><code>mealSummary()</code> - Quick summary</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>⚠️ This page is only available in development mode.</p>
            <p>🔍 Check the browser console (F12) for detailed output.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}