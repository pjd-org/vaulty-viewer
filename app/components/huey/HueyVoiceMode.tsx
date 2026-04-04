import React, { useCallback, useState } from 'react';
import {
  LiveKitRoom,
  useVoiceAssistant,
  useChat,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { AgentAudioVisualizerBar } from '../agents-ui/agent-audio-visualizer-bar';
import { AgentChatTranscript } from '../agents-ui/agent-chat-transcript';
import { AgentControlBar } from '../agents-ui/agent-control-bar';
import { SoftPanel } from '../layout';

// ---------------------------------------------------------------------------
// Inner — must be rendered inside a LiveKitRoom context
// ---------------------------------------------------------------------------

function HueyVoiceModeInner({ onDisconnect }: { onDisconnect: () => void }) {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const { chatMessages } = useChat();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Audio visualizer */}
      <div className="flex flex-1 items-center justify-center">
        <AgentAudioVisualizerBar
          size="lg"
          state={agentState}
          audioTrack={audioTrack}
        />
      </div>

      {/* Chat transcript — shown when chat panel is open */}
      {chatOpen && (
        <AgentChatTranscript
          agentState={agentState}
          messages={chatMessages}
          className="flex-1 min-h-0 overflow-hidden"
        />
      )}

      {/* Control bar */}
      <AgentControlBar
        variant="livekit"
        isConnected={agentState !== 'disconnected'}
        isChatOpen={chatOpen}
        onIsChatOpenChange={setChatOpen}
        onDisconnect={onDisconnect}
        controls={{
          microphone: true,
          camera: false,
          screenShare: false,
          chat: true,
          leave: true,
        }}
        className="shrink-0"
      />

      {/* Renders remote audio tracks */}
      <RoomAudioRenderer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public — connects to LiveKit and renders inner
// ---------------------------------------------------------------------------

export interface HueyVoiceModeProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
}

export function HueyVoiceMode({
  token,
  serverUrl,
  onDisconnect,
}: HueyVoiceModeProps) {
  const handleDisconnect = useCallback(() => {
    onDisconnect();
  }, [onDisconnect]);

  return (
    <SoftPanel variant="utility" className="h-full flex flex-col p-6">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={handleDisconnect}
        className="flex flex-col h-full"
      >
        <HueyVoiceModeInner onDisconnect={handleDisconnect} />
      </LiveKitRoom>
    </SoftPanel>
  );
}
