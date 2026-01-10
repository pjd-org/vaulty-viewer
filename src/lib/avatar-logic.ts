export type AvatarData = {
  vitals?: {
    tasksCompletedToday?: number;
    sessionsCompletedThisWeek?: number;
    energy?: number;
  };
};

export const apiBadgeText = (status: string) => {
  if (status === "online") return "API online";
  if (status === "loading") return "Syncing";
  if (status === "offline") return "API offline";
  return "API";
};

export const computeSnapshotStats = (avatar: AvatarData) => ({
  tasksToday: avatar.vitals?.tasksCompletedToday || 0,
  sessionsThisWeek: avatar.vitals?.sessionsCompletedThisWeek || 0,
  energy: avatar.vitals?.energy ?? 0,
});
