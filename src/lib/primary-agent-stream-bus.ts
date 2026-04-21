import {
  createPrimaryAgentStreamState,
  reduceViewerStreamEvent,
  type ViewerStreamEvent,
} from './primary-agent-stream';

type Listener = (event: ViewerStreamEvent) => void;

type StreamBucket = {
  history: ViewerStreamEvent[];
  listeners: Set<Listener>;
};

const buckets = new Map<string, StreamBucket>();

function getBucket(threadId: string): StreamBucket {
  const existing = buckets.get(threadId);
  if (existing) return existing;
  const bucket: StreamBucket = {
    history: [],
    listeners: new Set(),
  };
  buckets.set(threadId, bucket);
  return bucket;
}

export function resetPrimaryAgentStreamThread(threadId: string): void {
  const bucket = getBucket(threadId);
  bucket.history = [];
}

export function publishPrimaryAgentStreamEvent(
  threadId: string,
  event: ViewerStreamEvent
): void {
  const bucket = getBucket(threadId);
  bucket.history.push(event);
  if (bucket.history.length > 512) {
    bucket.history = bucket.history.slice(-512);
  }
  for (const listener of bucket.listeners) {
    listener(event);
  }
}

export function subscribePrimaryAgentStream(
  threadId: string,
  listener: Listener
): () => void {
  const bucket = getBucket(threadId);
  bucket.listeners.add(listener);
  for (const event of bucket.history) {
    listener(event);
  }
  return () => {
    bucket.listeners.delete(listener);
  };
}

export function getPrimaryAgentStreamSnapshot(threadId: string) {
  const bucket = getBucket(threadId);
  let state = createPrimaryAgentStreamState();
  for (const event of bucket.history) {
    state = reduceViewerStreamEvent(state, event);
  }
  return state;
}
