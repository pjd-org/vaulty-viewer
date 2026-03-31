import React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/project/$slug',
      params: { slug: params.projectId },
      search: {
        tab: undefined,
        selectedId: undefined,
        noteId: undefined,
        mode: undefined,
        templateId: undefined,
        memoryTab: undefined,
      },
      replace: true,
    });
  },
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  return null;
}
