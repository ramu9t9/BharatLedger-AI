# Indian Government e-Invoice API Sandbox

**Portal:** https://einv-apisandbox.nic.in/  
**Title:** GST-NIC – e-Invoice API Developer's Portal  
**Managed by:** e-Invoice Team, National Informatics Centre (NIC), Govt. of India

---

## 1. What It Is

The **e-Invoice API Sandbox** is the government’s test environment for the **Goods and Services Tax (GST) e-Invoice System**. It lets developers and businesses:

- Test e-Invoice APIs without affecting production
- Integrate with the **Invoice Registration Portal (IRP)** to generate **IRN (Invoice Reference Number)** and QR codes
- Test **e-Way Bill** generation from e-Invoices
- Use sample GSTINs and payloads for integration testing

**Related portals:**

- **Sandbox (API testing):** https://einv-apisandbox.nic.in  
- **e-Invoice Trial (offline tools & APIs):** https://einvoice1-trial.nic.in  
- **e-Invoice Production:** (linked from portal)  
- **e-Waybill API Dev. Portal:** (linked from portal)

---

## 2. Portal Sections (from the menu)

| Section | Purpose |
|--------|--------|
| **Introduction** | Overview of e-Invoice and sandbox |
| **API Overview** | High-level API design and flow |
| **Benefits** | Why use e-Invoice / APIs |
| **On-Boarding** | How to register and get access |
| **API Credentials** | Obtaining and using credentials for sandbox/production |
| **Best Practices** | Do’s and don’ts for integration |
| **FAQs** | Common questions |
| **API Versioning** | How versions are managed |
| **Release Notes** | Changes and validations over time |
| **Support** | Contact and help |

---

## 3. API Categories

### 3.1 Vital APIs (v1.04)

- **Authentication** – Get OTP / token for API access (Overview, Payloads, Sample JSONs, Validations, FAQs)
- **Get GSTIN Details** – Fetch taxpayer details by GSTIN
- **Sync GSTIN Details from CP** – Sync from Central Portal  

**Sandbox test GSTINs:**  
`33GSPTN1882G1Z3`, `27GSPMH1881G1ZH`, `27GSPMH1882G1ZG`, `33GSPTN3381G1Z5`, `33GSPTN3382G1Z4`, `27GSPMH3381G1ZI`

### 3.2 Core APIs (v1.03)

- **Generate IRN** – Submit invoice payload, get IRN and signed QR code (Overview, Payloads, Sample JSONs, JSON Schema, Validations, FAQs)
- **Cancel IRN** – Cancel a generated IRN
- **Get IRN Details** – Fetch details by IRN
- **Get IRN details by Doc. Details** – Fetch by document details
- **Get Rejected IRNs Details** – List/details of rejected IRNs

### 3.3 E-Waybill APIs (v1.03)

- **Generate e-Way Bill by IRN** – Create e-Way Bill from an e-Invoice (IRN)
- **Cancel E-way Bill**
- **Get e-Waybill Details by IRN**

### 3.4 Health API (v1.03)

- **Health** – Check system/API availability

---

## 4. Resources (from the portal)

- **IRN** – Invoice Reference Number concept and usage
- **Mapping of Notified schema with API (IRN) schema** – How notified e-Invoice schema maps to API payload
- **Mapping of E-Way Bill schema with API (IRN) schema** – E-Way Bill vs e-Invoice schema mapping
- **Regular Expressions** – Valid formats for fields (GSTIN, etc.)
- **e-Com Operator** – For e-commerce operators
- **Master lists** – HSN, state codes, etc.
- **Error List** – API error codes and messages
- **Note on Top Errors** – Most common errors and fixes
- **General Master** – Other reference data
- **Sample Code** – Java and C#.net samples

---

## 5. Important Concepts

- **IRN (Invoice Reference Number):** Unique number issued by the IRP when an invoice is registered. It is used for e-Invoice and e-Way Bill.
- **Signed content / QR:** Responses (e.g. from Generate IRN) can include signed JSON/QR; the sandbox offers a **public key for verification** (download after Login).
- **Validations:** The portal publishes detailed validation rules; these are updated over time (see Release Notes and “Updates in validations”).
- **Time limit:** There have been proposals for a time limit for reporting invoices on the IRP (e.g. not older than 7 days); some have been deferred – check latest Release Notes.
- **Turnover-based rollout:** Sandbox/trial has been opened in phases by PAN-based turnover (e.g. 100 Cr+, then 50–100 Cr, 20–50 Cr, 10–20 Cr, 5 Cr+). Production eligibility follows government notifications.

---

## 6. Relevance to BharatLedger AI

- **e-Invoice integration (future):** BharatLedger can prepare invoice payloads in the **notified e-Invoice/IRN schema**, then call the sandbox (and later production) **Generate IRN** API so users get a valid IRN and QR.
- **GSTR-1 / e-Invoice link:** e-Invoice data flows to GSTR-1; our GSTR-1 JSON generation can align with the same schema and validations.
- **Sandbox first:** Any integration should be developed and tested on https://einv-apisandbox.nic.in (and trial portal if needed) before production.
- **Credentials:** Use the portal’s **On-Boarding** and **API Credentials** sections to get sandbox credentials; production requires separate registration with GSTN/NIC.

---

## 7. Quick Links (from the portal)

- e-Invoice API Sandbox: https://einv-apisandbox.nic.in  
- e-Invoice Trial: https://einvoice1-trial.nic.in  
- Release notes, validations, and public key for signed content are available after **Login** on the sandbox portal.

---

*Summary based on the structure and content of https://einv-apisandbox.nic.in/ as of the review. For current payloads, schemas, and validations, always refer to the portal and latest Release Notes.*
