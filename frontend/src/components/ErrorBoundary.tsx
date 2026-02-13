import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/50 bg-destructive/5 p-8">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center space-y-1">
            <h3 className="font-semibold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
