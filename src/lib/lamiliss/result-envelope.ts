import { z } from 'zod';

export const lamilissModeSchema = z.enum([
  'inspect',
  'patch',
  'verify',
  'system',
  'motion',
]);

export const lamilissCheckSchema = z
  .object({
    name: z.string().min(1),
    status: z.enum(['pass', 'fail', 'skipped']),
    command: z.string(),
    evidence: z.array(z.string()),
    notes: z.string(),
  })
  .strict();

export const lamilissEscalationSchema = z
  .object({
    reason: z.string().min(1),
    evidence: z.array(z.string()),
    requestedDecision: z.string().min(1),
  })
  .strict();

export const lamilissEnvelopeSchema = z
  .object({
    status: z.enum(['pass', 'fail', 'blocked', 'escalate']),
    mode: lamilissModeSchema,
    scope: z
      .object({
        routes: z.array(z.string()),
        components: z.array(z.string()),
        files: z.array(z.string()),
      })
      .strict(),
    contractSources: z.array(z.string()),
    changedFiles: z.array(z.string()),
    checks: z.array(lamilissCheckSchema),
    screenshots: z.array(z.string()),
    visualRegressions: z.array(z.string()),
    accessibilityFindings: z.array(z.string()),
    performanceFindings: z.array(z.string()),
    systemDrift: z.array(z.string()),
    unverified: z.array(z.string()),
    escalation: lamilissEscalationSchema.nullable(),
  })
  .strict()
  .superRefine((envelope, context) => {
    if ((envelope.status === 'escalate') !== (envelope.escalation !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['escalation'],
        message: 'escalation must be present exactly when status is escalate',
      });
    }
  });

export type LamilissEnvelope = z.infer<typeof lamilissEnvelopeSchema>;

export function parseLamilissEnvelope(value: unknown): LamilissEnvelope {
  return lamilissEnvelopeSchema.parse(value);
}
