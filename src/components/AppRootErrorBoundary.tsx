"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logAppError } from "@/lib/app-logger";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppRootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logAppError("AppRootErrorBoundary", error, {
      componentStack: info.componentStack?.slice(0, 4000),
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-medium">Algo deu errado ao exibir esta área.</p>
          <p className="text-sm text-muted-foreground max-w-md">
            O erro foi registrado nos logs (console do navegador e, em desenvolvimento, no terminal do servidor).
          </p>
          <Button type="button" onClick={this.handleRetry}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
