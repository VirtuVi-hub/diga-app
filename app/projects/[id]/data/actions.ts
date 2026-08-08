"use server";

import { AgreementService } from "@/lib/services/agreement-service";

export async function getCurrentAgreement(projectId: string) {
  return AgreementService.getCurrentAgreement(projectId);
}
