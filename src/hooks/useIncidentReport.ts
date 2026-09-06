import { useCallback, useState } from 'react';
import { submitIncidentReport } from '@/services/reportService';
import { IncidentReportInput, IncidentReportResult } from '@/types';

export function useIncidentReport() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IncidentReportResult | null>(null);

  const submit = useCallback(async (input: IncidentReportInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitIncidentReport(input);
      setResult(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your report. Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { submit, submitting, error, result, reset };
}
