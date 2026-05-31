# Racing Platform — Cost Structure & Investment-Recovery Budget

**Internal cost-justification document** supporting the Pricing & Revenue-Share Proposal.
*Prepared May 2026 · All figures are modeled for a 1-month build cycle and a highly optimized serverless infrastructure footprint.*

---

## 0. Planning assumptions (the levers)

| Assumption | Value | Note |
|---|---|---|
| FX rate | **18.50 MXN / USD** | Planning rate — lock to spot at signing. |
| Developer rate | **$54 USD / hour** | Standardized founder engineering rate. |
| Total projected capacity | **80 hours** | Scoped across the complete 1-month timeline. |
| Timeline | **1 month** | Full build-to-launch velocity. |
| Google Workspace seats | **5** | Business Starter ≈ $7.20 USD/seat/mo. |

---

## 1. Total development investment (the amount to recover)

Because this project moves from zero to launch in a single month, the pre-launch tooling and infrastructure costs are heavily condensed compared to longer builds.

| Component | Basis | USD | MXN |
|---|---|---:|---:|
| Founder engineering | 80 h × $54 | $4,320 | $79,920 |
| AI tooling during 1-mo build | $250/mo × 1 | $250 | $4,625 |
| AWS during 1-mo build (pre-launch) | Optimized sandbox environment | $12 | $222 |
| **Total development investment** | | **~$4,582** | **~$84,767** |

---

## 2. AWS infrastructure — production monthly cost

Scaled to 20% of the standard portfolio infrastructure model, utilizing a lean serverless footprint optimized for the initial racing platform user base. Serverless usage-based pricing dominates.

| Service | Basis | USD/mo | MXN/mo |
|---|---|---:|---:|
| Core Production Architecture | Amplify, Lambda, DynamoDB, API Gateway, S3, SES (scaled to 20%) | $38.60 | $714 |
| Staging / non-production | Parallel environment | $8.00 | $148 |
| AWS Support / Basic Margin | Monitored baseline allocation | $20.00 | $370 |
| **Total AWS Cost** | | **$66.60** | **$1,232** |

---

## 3. AWS cost adjustment — quarterly model

AWS costs are usage-driven and will scale with actual platform traffic and user activity. Rather than locking in a fixed monthly rate that overcharges early or undercuts later, costs are reviewed and adjusted quarterly (every 3 months) based on actual infrastructure consumption.

**Quarterly adjustment formula:**

For each completed quarter $Q_n$, calculate the actual AWS cost from CloudBilling. Use this to forecast $Q_{n+1}$:

$$\text{Forecast}_{Q_{n+1}} = \frac{\text{Actual}_{Q_n}}{\text{Active Users}_{Q_n}} \times \text{Projected Users}_{Q_{n+1}}$$

**Variance Clause:** The adjusted rate takes effect on the first day of the following quarter. If the quarterly forecast deviates by more than 30% from the previous quarter (e.g., due to a viral surge in traffic that doesn't convert linearly), both parties agree to manually review the AWS billing dashboard to authorize the adjustment, preventing skewed ratios.

---

## 4. Platform Operations & Support

**Scope of activities:**
* **Monitoring & incident response:** Uptime tracking and CloudWatch alarms routed directly to Telegram via structured supervisor and escalamiento protocols for immediate resolution.
* **Security & patching:** Dependency/CVE remediation, runtime upgrades, and secret rotation.
* **Payments reliability:** Stripe webhook monitoring, failed-payment handling, and daily reconciliation.
* **Release management:** CI/CD pipeline maintenance and controlled deployments.
* **Operator support:** Troubleshooting, user administration, and ad-hoc data/export requests.

**Fully-loaded monthly cost:**

| Component | Basis | MXN/mo |
|---|---|---:|
| Base salary | $1,400 USD | $25,900 |
| IMSS + Afore + Infonavit | Employer social-security contributions | $6,115 |
| ISN | State payroll tax | $777 |
| Tools & licenses | $100 USD (AI, GitHub, monitoring) | $1,850 |
| **Fully-loaded total** | **Dedicated resource cost** | **$34,642** |

### Strategic Cross-Project Subsidy
The $34,642 MXN figure represents the full, unmitigated cost of employing one dedicated platform operator. However, **this exact role is shared with the MUNET platform.** Because both projects utilize the same operator, the labor cost is entirely absorbed by whichever project goes live and generates revenue first. Once the operator's salary is covered by the primary project's operating expenses, the Racing Platform benefits from a **$0 MXN** baseline labor cost, effectively sharing the overhead and drastically accelerating the time to profit. 

---

## 5. Cost structure & capital-recovery model

**Distribution priority:** All Gross Revenue (defined strictly as gross receipts *minus* applicable taxes and payment processing fees) is allocated in order:

1. **Operating costs** (cleared monthly)
2. **Capital-recovery tranche** (until fully recovered)
3. **Profit split** 50/50 (begins seamlessly after capital recovery is complete)

### Operating costs

| Line | MXN/mo | Note |
|---|---:|---|
| AWS infrastructure ($66.60 USD) | $1,232 | Subject to quarterly adjustment |
| Google Workspace (5 seats @ $7.20 USD) | $666 | |
| Platform Operations & Support | $34,642 | **Drops to $0 MXN** if covered by sister project |
| Founders' attention (1 hr/week, once live) | $4,329 | Calculated at $54 USD/hr |
| **Maximum operating cost** | **$40,869** | Applies only if standalone |
| **Effective operating cost** | **$6,227** | **When operator cost is covered by sister project** |

### Capital-recovery tranche

| Item | Amount |
|---|---:|
| Development investment | $84,767 MXN |
| Recovery duration | Variable — dependent on user growth and transaction volume |
| Recovered from | Gross Revenue, after operating costs are cleared, before profit split |

Once the $84,767 MXN is fully recovered, the capital-recovery tranche ends entirely. From that point forward, all Net Utilities (Gross Revenue − active Operating Costs) are split 50/50.