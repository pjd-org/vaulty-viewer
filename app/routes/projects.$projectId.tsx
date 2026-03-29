import React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: `/project/${encodeURIComponent(params.projectId)}`,
      replace: true,
    });
  },
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  return null;
}
