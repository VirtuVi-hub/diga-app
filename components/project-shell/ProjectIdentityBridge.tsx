"use client";

import { useEffect } from "react";
import { useProjectIdentity, type ProjectParticipant } from "./ProjectIdentityContext";

type ProjectSummary = {
  id: string;
  name: string;
  client: string | null;
  type: string | null;
};

export function ProjectIdentityBridge({
  project,
  participants,
  canViewProject,
  lifecycleStage,
  children,
}: {
  project: ProjectSummary;
  participants: ProjectParticipant[];
  canViewProject: boolean;
  lifecycleStage: string;
  children: React.ReactNode;
}) {
  const { setIdentity } = useProjectIdentity();

  useEffect(() => {
    setIdentity({ id: project.id, name: project.name, client: project.client, participants, canViewProject, lifecycleStage });

    return () => setIdentity(null);
  }, [project.id, project.name, project.client, participants, canViewProject, lifecycleStage, setIdentity]);

  return <>{children}</>;
}
