import type {
  AgreementParticipant,
  DocusignUpdateEnvelopeNotificationRequest,
  SendAgreementRequest,
} from "packages/features/documents/types/docusign";

export function participantCanResend(p: AgreementParticipant): boolean {
  if (p.role !== "signer") {
    return false;
  }
  const rs = (p.recipient_status ?? "").toLowerCase();
  return !["signed", "completed", "declined", "autoresponded"].includes(rs);
}

export function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) {
    return undefined;
  }
  const n = Number(t);
  if (!Number.isFinite(n)) {
    return undefined;
  }
  return Math.trunc(n);
}

export function buildEnvelopeNotificationForSend(params: {
  advancedOpen: boolean;
  remDelay: string;
  remFreq: string;
  expAfter: string;
  expWarn: string;
}): SendAgreementRequest["envelope_notification"] | undefined {
  if (!params.advancedOpen) {
    return undefined;
  }
  const reminder_delay = parseOptionalInt(params.remDelay);
  const reminder_frequency = parseOptionalInt(params.remFreq);
  const expire_after = parseOptionalInt(params.expAfter);
  const expire_warn = parseOptionalInt(params.expWarn);

  const reminders =
    reminder_delay != null || reminder_frequency != null
      ? {
          reminder_enabled: true,
          ...(reminder_delay != null ? { reminder_delay } : {}),
          ...(reminder_frequency != null ? { reminder_frequency } : {}),
        }
      : undefined;

  const expirations =
    expire_after != null
      ? {
          expire_enabled: true,
          expire_after,
          ...(expire_warn != null ? { expire_warn } : {}),
        }
      : undefined;

  if (!reminders && !expirations) {
    return undefined;
  }
  return { reminders, expirations };
}

export function buildUpdateNotificationBody(params: {
  useAccountDefaults: boolean;
  remDelay: string;
  remFreq: string;
  expAfter: string;
  expWarn: string;
}): DocusignUpdateEnvelopeNotificationRequest {
  if (params.useAccountDefaults) {
    return { use_account_defaults: true };
  }
  const reminder_delay = parseOptionalInt(params.remDelay);
  const reminder_frequency = parseOptionalInt(params.remFreq);
  const expire_after = parseOptionalInt(params.expAfter);
  const expire_warn = parseOptionalInt(params.expWarn);

  const reminders =
    reminder_delay != null || reminder_frequency != null
      ? {
          reminder_enabled: true,
          ...(reminder_delay != null ? { reminder_delay } : {}),
          ...(reminder_frequency != null ? { reminder_frequency } : {}),
        }
      : undefined;

  const expirations =
    expire_after != null
      ? {
          expire_enabled: true,
          expire_after,
          ...(expire_warn != null ? { expire_warn } : {}),
        }
      : undefined;

  return {
    use_account_defaults: false,
    ...(reminders ? { reminders } : {}),
    ...(expirations ? { expirations } : {}),
  };
}
