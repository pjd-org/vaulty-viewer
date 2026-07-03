import type { ReactNode } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import { TooltipProvider } from '@/app/components/ui/tooltip';

const noopAdapter: ChatModelAdapter = {
  run: () => new Promise(() => {}),
};

export function MockAssistantRuntime({ children }: { children: ReactNode }) {
  const runtime = useLocalRuntime(noopAdapter);

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
