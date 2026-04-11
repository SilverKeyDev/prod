# GDPR Compliance Documentation

**General Data Protection Regulation (EU) 2016/679**

Last Updated: April 5, 2026

---

## Table of Contents

1. [Data Controller Information](#data-controller-information)
2. [Data Collection and Usage](#data-collection-and-usage)
3. [Legal Basis for Processing](#legal-basis-for-processing)
4. [User Rights Under GDPR](#user-rights-under-gdpr)
5. [Data Retention Policies](#data-retention-policies)
6. [Third-Party Data Processors](#third-party-data-processors)
7. [Data Security Measures](#data-security-measures)
8. [International Data Transfers](#international-data-transfers)
9. [Data Breach Notification Procedures](#data-breach-notification-procedures)
10. [Contact Information](#contact-information)

---

## Data Controller Information

**SilverKey Platform**
- **Role:** Data Controller
- **Jurisdiction:** United States (with EU data subject rights)
- **DPO Contact:** privacy@silverkey.com
- **EU Representative:** [To be appointed if processing substantial EU data]

---

## Data Collection and Usage

### 1. Personal Data We Collect

#### Account Information
- **What:** Name, email address, phone number, profile photo
- **Why:** Account creation, authentication, user identification
- **How:** Direct user input during registration
- **Legal Basis:** Contract performance, consent

#### Authentication Data
- **What:** Password hashes, session tokens, OAuth tokens
- **Why:** Secure authentication and authorization
- **How:** AWS Cognito authentication service
- **Legal Basis:** Contract performance, legitimate interest (security)
- **Storage:** Session tokens in sessionStorage (not localStorage), server-side secure storage

#### Financial Information
- **What:** Bank account connections, transaction data, income verification
- **Why:** Financial pre-qualification for home buying
- **How:** Plaid financial data aggregation API
- **Legal Basis:** Explicit consent, contract performance
- **Protection:** Encrypted at rest and in transit, PII masked in logs

#### Calendar Data
- **What:** Event schedules, appointments, availability
- **Why:** Home showing scheduling, agent coordination
- **How:** Google Calendar API integration
- **Legal Basis:** Explicit consent
- **Access:** Read/write access to connected Google Calendar only

#### Real Estate Preferences
- **What:** Location preferences, budget, home features, search history
- **Why:** Personalized home recommendations, saved searches
- **How:** User input and interaction tracking
- **Legal Basis:** Contract performance, legitimate interest

#### Property Viewing Activity
- **What:** Homes viewed, saved, liked, or disliked
- **Why:** Personalized recommendations, user experience
- **How:** User interaction with platform
- **Legal Basis:** Legitimate interest, contract performance

#### Document Data
- **What:** Uploaded documents, signed contracts (via DocuSign)
- **Why:** Transaction facilitation, legal document management
- **How:** DocuSign integration, secure file storage
- **Legal Basis:** Contract performance, legal obligation

#### Communication Data
- **What:** Messages with agents, support tickets, notifications
- **Why:** Customer support, agent-client communication
- **How:** In-app messaging, email notifications
- **Legal Basis:** Contract performance, legitimate interest

#### Technical Data
- **What:** IP address, browser type, device information, usage logs
- **Why:** Security, fraud prevention, service improvement
- **How:** Automated collection via web/mobile app
- **Legal Basis:** Legitimate interest (security and service improvement)
- **Protection:** PII automatically masked in logs (see Data Security Measures)

#### Location Data
- **What:** General location (city/region), map searches
- **Why:** Property search, location-based recommendations
- **How:** User-provided search parameters, optional device location
- **Legal Basis:** Explicit consent (device location), contract performance (search)

### 2. Data We Do NOT Collect

- Biometric data
- Health information
- Political opinions or affiliations
- Religious or philosophical beliefs
- Trade union membership
- Genetic data (except as voluntarily provided for verification purposes)
- Precise real-time location tracking (only general search locations)

### 3. Automated Decision-Making

**AI Property Recommendations:**
- **Nature:** Algorithmic property matching based on preferences
- **Impact:** Suggests properties to view (non-binding)
- **Human Oversight:** Users can manually search and select properties
- **Right to Object:** Users can opt out of AI recommendations

**No High-Impact Automated Decisions:** We do NOT make automated decisions with legal or similarly significant effects (e.g., loan approvals are handled by third parties with human review).

---

## Legal Basis for Processing

| Data Type | Legal Basis | Article 6(1) |
|-----------|-------------|--------------|
| Account information | Contract performance | (b) |
| Authentication data | Contract performance, Legitimate interest (security) | (b), (f) |
| Financial data | Explicit consent | (a) |
| Calendar integration | Explicit consent | (a) |
| Property preferences | Contract performance | (b) |
| Document signing | Contract performance, Legal obligation | (b), (c) |
| Communication logs | Contract performance | (b) |
| Technical/security logs | Legitimate interest (security, fraud prevention) | (f) |
| Marketing communications | Consent (opt-in) | (a) |

**Legitimate Interest Assessment:**
- Security monitoring and fraud prevention
- Service improvement and bug fixes
- Anonymous analytics for product development

---

## User Rights Under GDPR

SilverKey respects all GDPR rights for EU data subjects. You have the right to:

### 1. Right to Access (Article 15)
- **What:** Receive a copy of your personal data we hold
- **How:** Submit request to privacy@silverkey.com or via in-app settings
- **Timeframe:** Within 30 days (1 month)
- **Format:** Machine-readable JSON or PDF export

### 2. Right to Rectification (Article 16)
- **What:** Correct inaccurate or incomplete data
- **How:** Update in app settings or request via privacy@silverkey.com
- **Timeframe:** Immediate (self-service) or within 30 days (assisted)

### 3. Right to Erasure ("Right to be Forgotten") (Article 17)
- **What:** Request deletion of your personal data
- **How:** In-app account deletion or email privacy@silverkey.com
- **Timeframe:** Within 30 days
- **Exceptions:** Legal obligations (e.g., transaction records), ongoing disputes
- **Scope:** Complete account and data deletion (see Data Retention policy)

### 4. Right to Data Portability (Article 20)
- **What:** Receive your data in machine-readable format
- **How:** Request via privacy@silverkey.com
- **Format:** JSON export with schema documentation
- **Includes:** Account data, preferences, saved homes, documents (if permissible)
- **Timeframe:** Within 30 days

### 5. Right to Restrict Processing (Article 18)
- **What:** Limit how we process your data
- **How:** Request via privacy@silverkey.com
- **Effect:** Data stored but not actively processed (except storage, legal claims, or with consent)
- **Duration:** Until restriction is lifted or data is deleted

### 6. Right to Object (Article 21)
- **What:** Object to processing based on legitimate interest or direct marketing
- **How:** Opt-out links in emails, in-app settings, or privacy@silverkey.com
- **Effect:** Immediate cessation of that processing
- **Exceptions:** Compelling legitimate grounds override objection (rare, must be justified)

### 7. Rights Related to Automated Decision-Making (Article 22)
- **What:** Object to automated decisions with legal/significant effects
- **Current Status:** No high-impact automated decisions; AI recommendations are assistive only
- **How:** Opt out via app settings

### 8. Right to Withdraw Consent (Article 7(3))
- **What:** Withdraw consent at any time (for consent-based processing)
- **How:** In-app settings, email privacy@silverkey.com
- **Effect:** Immediate cessation of that processing (does not affect lawfulness of prior processing)
- **Examples:** Calendar integration, financial data access, marketing emails

### 9. Right to Lodge a Complaint
- **What:** File complaint with supervisory authority
- **How:** Contact your national data protection authority
- **EU Lead Authority:** [To be determined based on main establishment]
- **Contact:** We will cooperate fully with any supervisory authority inquiry

---

## Data Retention Policies

See [DATA_RETENTION.md](./DATA_RETENTION.md) for detailed retention periods.

**Summary:**
- **Active user data:** Retained while account is active
- **Inactive accounts:** Deleted after 3 years of inactivity (with prior notice)
- **Deleted accounts:** Permanently deleted within 90 days
- **Transaction records:** Retained for 7 years (legal obligation)
- **Logs and technical data:** Retained for 90 days (PII-masked)
- **Backups:** Overwritten within 90 days of deletion request

---

## Third-Party Data Processors

SilverKey engages the following third-party processors under GDPR-compliant Data Processing Agreements (DPAs):

### 1. AWS (Amazon Web Services)
- **Service:** Cloud infrastructure, data storage, Cognito authentication
- **Data:** All user data, encrypted at rest
- **Location:** US-East-2 (Ohio), EU regions available upon request
- **DPA:** AWS GDPR DPA in place
- **Safeguards:** EU-US Data Privacy Framework, Standard Contractual Clauses (SCCs)

### 2. AWS Cognito
- **Service:** User authentication and identity management
- **Data:** Email, password hashes, session tokens, profile data
- **Location:** US-East-2 (Ohio)
- **DPA:** AWS GDPR DPA in place
- **Safeguards:** EU-US Data Privacy Framework, SCCs

### 3. Google Calendar API
- **Service:** Calendar integration for home showings
- **Data:** Calendar events, availability (only for users who connect calendar)
- **Location:** Google data centers (US and EU)
- **DPA:** Google Cloud Platform DPA
- **Safeguards:** EU-US Data Privacy Framework, SCCs
- **User Control:** Users explicitly authorize calendar access (OAuth 2.0)

### 4. DocuSign
- **Service:** Electronic document signing
- **Data:** Uploaded documents, signatures, identity verification
- **Location:** US and EU data centers (region-specific)
- **DPA:** DocuSign GDPR DPA in place
- **Safeguards:** EU-US Data Privacy Framework, SCCs
- **Compliance:** eIDAS compliant (EU electronic signatures)

### 5. Plaid
- **Service:** Financial data aggregation (bank account verification)
- **Data:** Bank account details, transaction history, income data
- **Location:** United States
- **DPA:** Plaid GDPR DPA in place
- **Safeguards:** EU-US Data Privacy Framework, SCCs
- **User Control:** Explicit consent required; users can revoke access anytime

### 6. OpenAI (ChatGPT API)
- **Service:** AI-powered property recommendations and chatbot
- **Data:** User preferences, search queries, anonymized usage patterns
- **Location:** United States
- **DPA:** OpenAI Enterprise DPA
- **Safeguards:** Zero data retention policy (API calls not used for training)
- **Privacy:** PII stripped before sending to API

### 7. Perplexity AI
- **Service:** AI-powered search and property research
- **Data:** Search queries (anonymized)
- **Location:** United States
- **DPA:** [To be confirmed]
- **Privacy:** No PII transmitted

### 8. Google Maps / Mapbox
- **Service:** Mapping and geolocation services
- **Data:** Search locations, map interactions (anonymized)
- **Location:** United States and EU
- **DPA:** Google Maps Platform DPA / Mapbox DPA
- **Safeguards:** SCCs in place

### 9. Stripe (if payment processing added)
- **Service:** Payment processing
- **Data:** Payment card details (tokenized), billing information
- **Location:** US and EU
- **DPA:** Stripe GDPR DPA
- **Compliance:** PCI DSS Level 1 certified

**Processor Responsibilities:**
- All processors are contractually required to:
  - Process data only on our instructions
  - Implement appropriate security measures
  - Assist with data subject rights requests
  - Notify us of data breaches within 24 hours
  - Delete or return data upon contract termination

---

## Data Security Measures

SilverKey implements industry-standard technical and organizational measures to protect personal data:

### Technical Measures

#### 1. Encryption
- **In Transit:** TLS 1.3 for all client-server communication
- **At Rest:** AES-256 encryption for all stored data
- **Database:** Encrypted database connections, encrypted backups

#### 2. Authentication & Authorization
- **Method:** AWS Cognito (industry-standard OAuth 2.0)
- **Password Policy:** Minimum 8 characters, complexity requirements
- **Session Management:** Secure tokens in sessionStorage (not localStorage), automatic expiration
- **MFA Support:** Available for all users (encouraged)

#### 3. PII Protection in Logs
- **Automated Masking:** All logs automatically scrubbed for PII
- **Patterns Detected:**
  - Email addresses
  - Phone numbers (all formats)
  - Social Security Numbers (SSN)
  - Credit card numbers
  - JWT tokens
  - API keys and bearer tokens
  - Passwords in URLs or objects
  - Long alphanumeric strings (potential keys/tokens)
- **Implementation:**
  - Frontend: `Client/packages/logger/pii.ts`
  - Backend: `Server/logger/pii.py`
- **Sensitive Keys Redacted:** password, token, accessToken, refreshToken, idToken, authorization, secret, apiKey, credential, ssn, credit_card, cvv, pin

#### 4. Security Headers
- **HSTS:** Enforce HTTPS connections
- **X-Frame-Options:** Prevent clickjacking
- **X-Content-Type-Options:** Prevent MIME sniffing
- **Referrer-Policy:** Control referrer information leakage
- **Permissions-Policy:** Restrict browser features
- **CSP (Content Security Policy):** Prevent XSS attacks

#### 5. Input Validation & Sanitization
- **Server-side validation:** All user input validated before processing
- **Parameterized queries:** SQL injection prevention
- **File upload validation:** MIME type checking, size limits, malicious pattern scanning
- **XSS prevention:** Input sanitization, output encoding

#### 6. Access Controls
- **Principle of Least Privilege:** Users and systems have minimum necessary access
- **Role-Based Access Control (RBAC):** Agent vs. Client vs. Admin roles
- **API Authentication:** All API endpoints require valid authentication tokens

### Organizational Measures

#### 1. Staff Training
- Regular security and privacy training for all employees
- GDPR awareness training for EU data handling
- Incident response procedures

#### 2. Access Logs
- All data access logged and monitored
- Logs retained for 90 days (PII-masked)
- Regular security audits

#### 3. Vendor Management
- All processors undergo security assessment
- DPAs in place with all processors
- Regular vendor security reviews

#### 4. Incident Response Plan
- Documented breach notification procedures (see below)
- 24-hour breach detection and containment target
- Regular incident response drills

---

## International Data Transfers

**Primary Data Location:** United States (AWS US-East-2, Ohio)

### EU Data Transfers

For EU data subjects, we rely on the following transfer mechanisms:

#### 1. EU-US Data Privacy Framework
- SilverKey and key processors (AWS, Google, Plaid) participate in the EU-US Data Privacy Framework
- Provides adequacy for data transfers to the US

#### 2. Standard Contractual Clauses (SCCs)
- Backup mechanism for processors not covered by Data Privacy Framework
- EU Commission-approved SCCs in place with all processors
- Regular assessments of supplementary measures

#### 3. User Consent
- For certain non-essential services, explicit consent for data transfer
- Users can withdraw consent at any time

**UK Transfers:** UK GDPR addendum to SCCs in place for UK users

**Switzerland Transfers:** Swiss-US Data Privacy Framework or SCCs

---

## Data Breach Notification Procedures

### Internal Procedures

#### 1. Detection (Target: Within 24 hours)
- Automated monitoring and alerting
- Security team 24/7 on-call rotation
- User and employee reporting channels

#### 2. Containment (Target: Within 24 hours)
- Immediate isolation of affected systems
- Revocation of compromised credentials
- Emergency response team activation

#### 3. Assessment (Target: Within 48 hours)
- Scope of breach (what data, how many users)
- Root cause analysis
- Risk assessment for data subjects

#### 4. Notification (Target: Within 72 hours of awareness)
- **To Supervisory Authority:** Within 72 hours of becoming aware (GDPR Article 33)
- **To Data Subjects:** Without undue delay if high risk to rights and freedoms (GDPR Article 34)

### Notification to Supervisory Authority

If breach is likely to result in a risk to rights and freedoms, we will notify the lead supervisory authority within 72 hours with:

- Nature of the breach
- Categories and approximate number of data subjects affected
- Categories and approximate number of data records affected
- Contact details of DPO or point of contact
- Likely consequences of the breach
- Measures taken or proposed to address the breach

**Exemption:** If personal data rendered unintelligible (e.g., encrypted with keys not compromised), notification may not be required.

### Notification to Data Subjects

If breach is likely to result in a **high risk** to rights and freedoms, we will notify affected data subjects directly without undue delay, including:

- Nature of the breach in clear, plain language
- Contact details of DPO or point of contact
- Likely consequences of the breach
- Measures taken or proposed to mitigate adverse effects
- Recommended actions for data subjects (e.g., password reset, monitor accounts)

**Communication Method:** Email to registered address, in-app notification

**Exemption from Individual Notification:**
- Data rendered unintelligible (e.g., encryption)
- Subsequent measures ensure high risk no longer likely
- Disproportionate effort (will instead use public communication)

### Post-Breach Actions

- Root cause remediation
- Security control enhancements
- Affected user support (free credit monitoring if applicable)
- Documentation for regulatory review
- Lessons learned and process improvements

---

## Compliance and Auditing

### Regular Reviews
- **Frequency:** Annual GDPR compliance audit
- **Scope:** Data inventory, processor agreements, security measures, user rights fulfillment
- **Documentation:** Maintained for regulatory inspection

### Data Protection Impact Assessments (DPIAs)
- Conducted for new processing activities with high risk
- Reviewed by DPO and legal team
- Updated when processing changes significantly

### Records of Processing Activities (Article 30)
- Maintained for all processing operations
- Available to supervisory authority upon request
- Updated quarterly or when processing changes

---

## Contact Information

### Data Protection Officer (DPO)
- **Email:** privacy@silverkey.com
- **Response Time:** Within 5 business days

### User Rights Requests
- **Email:** privacy@silverkey.com
- **Subject Line:** "GDPR Request - [Your Name]"
- **In-App:** Settings > Privacy > Data Rights

### Supervisory Authority Inquiries
- **Email:** legal@silverkey.com
- **Reference:** "GDPR Supervisory Authority Inquiry"

### General Privacy Questions
- **Email:** privacy@silverkey.com
- **Response Time:** Within 10 business days

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 5, 2026 | Initial GDPR compliance documentation |

---

## Related Documents

- [CCPA Compliance](./CCPA.md)
- [Data Retention Policy](./DATA_RETENTION.md)
- [Privacy Policy](./PRIVACY_POLICY.md)

---

*This document is maintained by the SilverKey Legal and Compliance team. For questions or updates, contact privacy@silverkey.com.*
