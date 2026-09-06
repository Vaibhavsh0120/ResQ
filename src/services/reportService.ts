import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { IncidentReportInput, IncidentReportResult } from '@/types';

/**
 * Submits an incident report. In a real backend this would likely trigger:
 *   1. Storage of the report (with photo upload handled separately/beforehand)
 *   2. A classification pass (matching against known disaster types)
 *   3. A RAG lookup so the immediate `fetchGuidance(types)` call right after
 *      has fresh, contextual results (e.g. blending in other nearby reports)
 *
 * The report itself is explicitly "reported, not verified" — see the
 * confirmation copy in app/(tabs)/report.tsx — matching how most community
 * incident-reporting systems work.
 */
export async function submitIncidentReport(input: IncidentReportInput): Promise<IncidentReportResult> {
  if (config.useMockData) {
    return mockDelay({
      id: `report-${Date.now()}`,
      status: 'reported' as const,
      submittedAt: new Date().toISOString(),
    });
  }

  // Real implementation: photo would typically be uploaded via multipart
  // form data or a signed URL first, then its resulting URI passed here.
  return apiRequest<IncidentReportResult>(config.endpoints.reportIncident, {
    method: 'POST',
    body: input,
  });
}
