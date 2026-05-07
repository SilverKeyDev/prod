# Data Retention Policy

**SilverKey Platform Data Retention and Deletion Procedures**

Last Updated: April 5, 2026
hello 
---

## Table of Contents

1. [Overview](#overview)
2. [General Principles](#general-principles)
3. [Retention Periods by Data Type](#retention-periods-by-data-type)
4. [Deletion Procedures](#deletion-procedures)
5. [Legal Hold and Exceptions](#legal-hold-and-exceptions)
6. [Backup and Archive Policies](#backup-and-archive-policies)
7. [Data Subject Rights](#data-subject-rights)
8. [Implementation and Enforcement](#implementation-and-enforcement)
9. [Review and Updates](#review-and-updates)

---

## Overview

This Data Retention Policy defines how long SilverKey retains personal data, when and how data is deleted, and exceptions for legal or business requirements.

**Purpose:**
- Comply with GDPR, CCPA, and other privacy laws
- Minimize data storage to reduce privacy risks
- Retain data necessary for business operations and legal obligations
- Ensure timely and secure data deletion

**Scope:** All personal data collected, processed, or stored by SilverKey, including:
- User account information
- Property search and preference data
- Financial information (via Plaid)
- Calendar data (via Google Calendar)
- Documents (via DocuSign)
- Communication records
- Technical logs and analytics

---

## General Principles

### 1. Data Minimization
- Collect only data necessary for specified purposes
- Delete data when no longer needed

### 2. Purpose Limitation
- Retain data only for original purpose or compatible uses
- Do not retain data indefinitely "just in case"

### 3. Storage Limitation (GDPR Article 5(1)(e))
- Define retention periods based on purpose
- Review and delete data regularly

### 4. Legal Compliance
- Retain data required by law (e.g., transaction records, tax documents)
- Balance legal obligations with privacy minimization

### 5. User Control
- Honor user deletion requests (Right to Erasure)
- Provide transparency on retention periods

---

## Retention Periods by Data Type

### 1. Account and Profile Information

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Active User Accounts** | Duration of account + 90 days | Account deletion request or inactivity deletion | Provide services, user preferences |
| **Name, Email, Phone** | While account active + 90 days | Account deletion | Identity, authentication, communication |
| **Profile Photo** | While account active + 30 days | Account deletion or user removal | User preference, optional data |
| **Preferences (location, budget, features)** | While account active + 30 days | Account deletion | Personalization, recommendations |
| **Inactive Accounts (no login)** | 3 years of inactivity | Automated deletion after notice | Compliance, storage minimization |

**Inactive Account Procedure:**
- After **2.5 years** of inactivity: Email warning with 6-month grace period
- After **3 years** total inactivity: Account and data deleted (see Deletion Procedures)

---

### 2. Authentication and Security Data

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Password Hashes** | While account active | Account deletion (immediate) | Security, authentication |
| **Session Tokens (sessionStorage)** | Session duration (browser close) | Browser close or logout | Security, session management |
| **OAuth Tokens (Google, Plaid)** | While integration active | User disconnects or account deletion | Third-party API access |
| **API Keys (server-side)** | While account active + 30 days | Account deletion | API authentication |
| **MFA Settings** | While account active | Account deletion | Security enhancement |
| **Login History** | 90 days | Rolling 90-day window | Security monitoring, fraud detection |
| **Failed Login Attempts** | 30 days | Rolling 30-day window | Security monitoring |

---

### 3. Financial Information (via Plaid)

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Bank Account Connections** | While connection active | User disconnects Plaid or account deletion | Financial qualification |
| **Transaction Data (cached)** | 90 days | Rolling 90-day window or user disconnect | Budget analysis, income verification |
| **Income Verification Results** | 1 year | User request or account deletion | Financial pre-qualification records |
| **Plaid Access Tokens** | While connection active | User disconnects or account deletion | API access |

**Special Note:** Plaid retains data per its own retention policy. Disconnecting Plaid in SilverKey does NOT automatically delete data from Plaid. Users must contact Plaid separately for full deletion.

---

### 4. Calendar Data (via Google Calendar)

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Calendar Connection** | While integration active | User disconnects Google Calendar or account deletion | Home showing scheduling |
| **Cached Event Data** | 30 days | Rolling 30-day window or user disconnect | Display upcoming showings |
| **Event History (showing appointments)** | 1 year | Account deletion or user request | Appointment records, agent coordination |
| **Google OAuth Tokens** | While connection active | User disconnects or account deletion | API access |

**Special Note:** Disconnecting Google Calendar in SilverKey does NOT delete events from your Google Calendar. Events created by SilverKey may remain in your Google Calendar until you delete them.

---

### 5. Document Data (via DocuSign)

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Uploaded Documents** | 7 years | Regulatory requirement (transaction records) | Legal obligation (real estate transactions) |
| **Signed Contracts (via DocuSign)** | 7 years | Regulatory requirement | Legal obligation, audit trail |
| **Document Metadata (title, upload date)** | 7 years | Tied to document retention | Document management |
| **Signature Records** | 7 years | Regulatory requirement | Legal validity, audit trail |
| **Draft/Unsigned Documents** | 1 year | User deletion or account deletion | Pending transactions |

**Legal Requirement:** Real estate transaction records must be retained for 7 years per federal and state regulations (e.g., IRS requirements, state real estate laws).

**User Deletion Requests:** For documents subject to 7-year retention, we will:
- Anonymize user-identifiable metadata (e.g., replace name with "User [ID]")
- Retain document content for legal compliance
- Permanently delete after 7-year period

---

### 6. Property Search and Activity Data

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Saved/Liked Homes** | While account active | Account deletion or user removal | User preferences, recommendations |
| **Disliked Homes** | 1 year | Rolling 1-year window or account deletion | Filter recommendations (time-limited relevance) |
| **Search History** | 90 days | Rolling 90-day window or account deletion | Recent search context, recommendations |
| **Property Viewing History** | 1 year | Rolling 1-year window or account deletion | User activity, recommendations |
| **AI Recommendation Data** | 90 days | Tied to preference changes or account deletion | Personalization (ephemeral) |

---

### 7. Communication Records

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **In-App Messages (Agent-Client)** | 3 years | Account deletion or user request | Communication records, dispute resolution |
| **Support Tickets** | 3 years | Ticket closure + 3 years | Customer support records, quality assurance |
| **Email Notifications (logs)** | 90 days | Rolling 90-day window | Delivery tracking, troubleshooting |
| **SMS Notifications (logs)** | 90 days | Rolling 90-day window | Delivery tracking, compliance |

**User Deletion Note:** When account is deleted, messages are:
- Anonymized: Sender name replaced with "Former User [ID]"
- Retained for 90 days (for ongoing transactions/disputes), then deleted
- If party to active transaction, retained until transaction closes + 90 days

---

### 8. Technical Logs and Analytics

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Application Logs (PII-masked)** | 90 days | Rolling 90-day window | Debugging, security monitoring |
| **Security Logs (PII-masked)** | 1 year | Rolling 1-year window | Security audits, incident response |
| **Error Logs (PII-masked)** | 90 days | Rolling 90-day window | Bug fixing, service reliability |
| **Analytics Data (anonymized)** | 2 years | Rolling 2-year window | Product improvement, trend analysis |
| **IP Address Logs** | 90 days | Rolling 90-day window | Security, fraud prevention |
| **Device Information** | While account active + 30 days | Account deletion | Security, compatibility |

**PII Masking:** All logs are automatically scrubbed for PII via `Client/packages/logger/pii.ts` and `Server/logger/pii.py` before storage. Logs contain only anonymized or pseudonymized data.

---

### 9. Marketing and Consent Data

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Email Marketing Consent** | While account active or until opt-out | Opt-out or account deletion | Marketing compliance (CAN-SPAM, GDPR) |
| **Marketing Email History** | 2 years | Rolling 2-year window or account deletion | Campaign effectiveness, compliance |
| **Cookie Consent Preferences** | 1 year | Rolling 1-year window or user reset | Cookie policy compliance |
| **Opt-Out Records** | 5 years | Regulatory requirement | Compliance (GDPR, CCPA) |

**Opt-Out Compliance:** Even after account deletion, we retain opt-out records (email address + opt-out status) to ensure we do not re-contact you if you re-register.

---

### 10. Backups and Disaster Recovery

| Data Type | Retention Period | Deletion Trigger | Rationale |
|-----------|------------------|------------------|-----------|
| **Daily Backups** | 30 days | Rolling 30-day window | Disaster recovery |
| **Weekly Backups** | 90 days | Rolling 90-day window | Long-term recovery |
| **Monthly Backups** | 1 year | Rolling 1-year window | Compliance, audit trail |

**Deletion from Backups:** When user data is deleted:
- Data is immediately deleted from production systems
- Backups containing deleted data are overwritten within 90 days (as they age out)
- For urgent deletion requests (e.g., GDPR Right to Erasure), we may manually purge from recent backups

---

## Deletion Procedures

### User-Initiated Deletion

#### 1. Account Deletion (Full Data Removal)

**Trigger:** User requests account deletion via in-app settings or privacy@silverkey.com

**Procedure:**
1. **Confirmation:** User confirms deletion (7-day grace period to cancel)
2. **Disconnections:** All third-party integrations (Plaid, Google Calendar, DocuSign) disconnected
3. **Immediate Deletion (within 48 hours):**
   - Account credentials (password, session tokens)
   - Personal identifiers (name, email, phone) - pseudonymized in systems requiring transaction records
   - Preferences, saved homes, search history
   - Profile photos
4. **Delayed Deletion (within 90 days):**
   - Communication logs (anonymized, then deleted after 90 days)
   - Technical logs (already PII-masked, deleted per rolling retention)
   - Backups (overwritten within 90 days)
5. **Retention for Legal Compliance (7 years):**
   - Transaction documents (anonymized: user name replaced with "User [ID]")
   - Signed contracts (via DocuSign, per legal requirement)
6. **Notification:** Confirmation email upon completion of immediate deletion

**Exceptions:**
- Data subject to legal hold (litigation, regulatory investigation)
- Data required for legal obligations (transaction records, tax compliance)
- Anonymized analytics data (no longer personal data)

#### 2. Partial Deletion (Specific Data)

**Examples:**
- Disconnect Plaid: Delete cached financial data (within 24 hours)
- Disconnect Google Calendar: Delete cached events (within 24 hours)
- Delete saved homes: Immediate removal from profile
- Delete specific messages: Immediate removal (unless party to ongoing transaction)

**Procedure:** User requests via in-app settings or privacy@silverkey.com
**Timeline:** Within 24-48 hours for most requests

---

### System-Initiated Deletion (Automated)

#### 1. Inactive Account Deletion (3 Years)

**Trigger:** No login activity for 3 years

**Procedure:**
1. **2.5 Years:** Email warning to registered address
   - Subject: "Your SilverKey Account Will Be Deleted in 6 Months"
   - Action: Log in to keep account active
2. **3 Years:** Automated deletion (same procedure as user-initiated)
3. **Logging:** Deletion event logged for audit (log contains only anonymized ID, no PII)

#### 2. Rolling Retention Windows

**Automated Deletion:** Data types with rolling retention periods (e.g., 90-day logs) are automatically deleted by scheduled cleanup jobs.

**Frequency:** Daily cleanup jobs run at 2:00 AM UTC
**Verification:** Monthly audits to ensure cleanup jobs are functioning

#### 3. Expired Session Data

**Trigger:** Session expiration (browser close, logout, or timeout)

**Procedure:**
- Session tokens immediately invalidated server-side
- SessionStorage cleared client-side (browser-managed)

---

### Third-Party Data Processor Deletion

When user data is deleted from SilverKey, we instruct third-party processors to delete data per DPA terms:

| Processor | Deletion Procedure | Timeline |
|-----------|-------------------|----------|
| **AWS (Storage)** | S3 object deletion, RDS data deletion | Immediate (production), 90 days (backups) |
| **AWS Cognito** | User pool account deletion | Immediate |
| **Google Calendar** | OAuth token revocation (events remain in user's Google Calendar unless user deletes) | Immediate |
| **DocuSign** | Document anonymization (retained for 7 years per legal requirement) | Anonymization within 48 hours, deletion after 7 years |
| **Plaid** | Plaid connection deletion (Plaid retains per its own policy) | Immediate (SilverKey side), Plaid-specific timeline for Plaid-side deletion |
| **OpenAI** | No data retained (zero retention policy for API calls) | N/A (not stored) |

**User Responsibility:** For third-party services (Google Calendar, Plaid), users may need to separately request deletion from those providers if they want data removed from third-party systems.

---

## Legal Hold and Exceptions

### When Deletion is Suspended

Data deletion may be delayed or refused in the following circumstances:

#### 1. Legal Obligations
- **Transaction Records:** 7-year retention for real estate transactions (IRS, state laws)
- **Tax Records:** Retention per IRS and state tax authority requirements
- **Audit Requirements:** Regulatory audits or investigations

#### 2. Litigation or Regulatory Investigations
- **Legal Hold:** Data subject to litigation, subpoena, or investigation is preserved
- **Notification:** User is notified (unless prohibited by law) that deletion is delayed
- **Duration:** Until legal matter is resolved

#### 3. Fraud Prevention and Security
- **Fraudulent Accounts:** Data retained to prevent re-registration and repeated fraud
- **Security Incidents:** Data related to active security incident retained until resolved

#### 4. Ongoing Transactions
- **Incomplete Transactions:** Data for active home purchase transactions retained until completion
- **Pending Disputes:** Data for dispute resolution retained until resolved

#### 5. Anonymized Data
- **No Longer Personal Data:** Once data is truly anonymized (cannot be re-identified), it is no longer subject to deletion rights under GDPR/CCPA

### User Notification

If deletion request is denied or delayed:
- **Notification:** Within 30 days, explain reason for denial/delay
- **Timeline:** Provide estimated timeline for deletion (if applicable)
- **Appeal:** User may appeal decision via privacy@silverkey.com

---

## Backup and Archive Policies

### Backup Retention

**Purpose:** Disaster recovery, service continuity

**Schedule:**
- **Daily Backups:** Retained for 30 days
- **Weekly Backups:** Retained for 90 days
- **Monthly Backups:** Retained for 1 year

**Deletion from Backups:**
- When user data is deleted, it is immediately removed from production
- Backups containing deleted data are overwritten as they age out (within 90 days for most data)
- Backups are encrypted and access-controlled (same security as production)

**Urgent Deletion Requests (GDPR Right to Erasure):**
- For high-risk data (e.g., sensitive personal information), we may manually purge from recent backups within 30 days upon request

---

### Archive Policies

**Long-Term Storage:** For data required for legal compliance (e.g., 7-year transaction records):
- Data is moved to **cold storage** (AWS Glacier or equivalent) after 1 year of inactivity
- Cold storage is encrypted, access-controlled, and audited
- Data is **anonymized** (user PII replaced with pseudonymous ID) before archiving

**Retrieval:** Archived data can be retrieved for legal purposes (e.g., audit, litigation) within 24-48 hours

---

## Data Subject Rights

### Impact on Data Subject Rights

This Data Retention Policy supports user rights under GDPR and CCPA:

#### 1. Right to Erasure (GDPR Article 17)
- Users can request deletion via in-app settings or privacy@silverkey.com
- Data deleted within 30-90 days (except legal hold)

#### 2. Right to Delete (CCPA § 1798.105)
- Same as GDPR Right to Erasure
- Exceptions: Legal obligations, fraud prevention, transaction completion

#### 3. Right to Restriction of Processing (GDPR Article 18)
- Users can request data be stored but not processed
- Applicable during disputes or pending deletion

#### 4. Right to Data Portability (GDPR Article 20)
- Users can export their data before deletion
- JSON or CSV format available

### Request Deletion

**Methods:**
- **In-App:** Settings > Privacy > Delete Account
- **Email:** privacy@silverkey.com with subject "Data Deletion Request"
- **Timeframe:** Deletion completed within 30-90 days (confirmation email sent)

---

## Implementation and Enforcement

### Automated Systems

**Cleanup Jobs:**
- Daily: Rolling retention windows (logs, session data)
- Weekly: Inactive session cleanup, expired cache
- Monthly: Inactive account warnings, audit of retention compliance

**Monitoring:**
- Automated alerts for cleanup job failures
- Monthly audits of data retention compliance
- Quarterly security audits of archived data

### Manual Procedures

**User Requests:**
- Privacy team processes deletion requests within 5 business days (acknowledgment)
- Full deletion completed within 30-90 days
- Confirmation email sent to user

**Legal Hold:**
- Legal team maintains list of legal hold accounts
- Automated systems prevent deletion of legal hold data
- Quarterly review of legal holds (release if resolved)

### Training

- All employees trained annually on data retention policies
- Privacy team trained on user rights fulfillment (GDPR/CCPA)
- Engineering team trained on secure deletion procedures

---

## Review and Updates

### Policy Review

**Frequency:** Annual review (or upon regulatory changes)

**Reviewers:**
- Legal and Compliance team
- Privacy team
- Engineering and Security team

**Approval:** Chief Privacy Officer or Legal Counsel

### Update Process

**Triggers for Updates:**
- New privacy law requirements (GDPR, CCPA, state laws)
- Changes in business practices or data processing
- Audit findings or compliance gaps
- User feedback or regulatory guidance

**Notification:** Material changes notified to users via email or in-app notice

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 5, 2026 | Initial Data Retention Policy |

---

## Related Documents

- [GDPR Compliance](./GDPR.md)
- [CCPA Compliance](./CCPA.md)
- [Privacy Policy](./PRIVACY_POLICY.md)

---

## Contact Information

**Privacy Inquiries:**
- **Email:** privacy@silverkey.com
- **Subject Line:** "Data Retention Policy Question"

**Deletion Requests:**
- **Email:** privacy@silverkey.com
- **Subject Line:** "Data Deletion Request"
- **In-App:** Settings > Privacy > Delete Account

---

*This document is maintained by the SilverKey Legal and Compliance team. For questions or updates, contact privacy@silverkey.com.*
