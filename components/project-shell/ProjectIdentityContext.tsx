"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ProjectParticipant = {
  id: string;
  name: string;
  initials: string;
  role: string;
};

export type ProjectIdentity = {
  /** Sprint 5.9, Module 1: the Notification Center needs to know which project to fetch notifications for — previously absent from this context entirely. */
  id: string;
  name: string;
  client: string | null;
  participants: ProjectParticipant[];
  canViewProject: boolean;
  /** Sprint 5.7, Module 15: drives the Sidebar's pre-Active navigation (Agreement/Setup instead of Dashboard/Journal/Timeline/Knowledge). */
  lifecycleStage: string;
};

type ProjectIdentityContextValue = {
  identity: ProjectIdentity | null;
  setIdentity: (identity: ProjectIdentity | null) => void;
};

const ProjectIdentityContext = createContext<ProjectIdentityContextValue>({
  identity: null,
  setIdentity: () => {},
});

export function ProjectIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<ProjectIdentity | null>(null);

  return (
    <ProjectIdentityContext.Provider value={{ identity, setIdentity }}>
      {children}
    </ProjectIdentityContext.Provider>
  );
}

export function useProjectIdentity() {
  return useContext(ProjectIdentityContext);
}
