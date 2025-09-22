# Zeta Network: Intelligence Doctrine

This document outlines the strategic framework for the Zeta Web Intelligence Network, evolving from a mission-based system to a persistent, multi-agent intelligence ecosystem.

## 1. The Intelligence Hierarchy

All intelligence gathered by the Zeta Network will be categorized and stored according to the following three-tier hierarchy. This structure provides a clear targeting doctrine and allows for systematic analysis of market-moving forces.

### Tier 1: Macro-Economic Forces (The Tides)
*These are the global forces that impact the entire market landscape.*

- **Monetary Policy:**
  - **Targets:** Federal Reserve announcements, interest rate decisions, central bank statements (FOMC, ECB).
  - **Access:** Economic calendars, official central bank websites, major financial news outlets (Bloomberg, Reuters).
- **Economic Indicators:**
  - **Targets:** Inflation reports (CPI, PCE), labor market data (Nonfarm Payrolls, Unemployment), GDP reports, consumer sentiment surveys.
  - **Access:** Bureau of Labor Statistics (BLS), Bureau of Economic Analysis (BEA), dedicated economic calendar websites (e.g., MarketWatch, Investing.com).
- **Geopolitical Events:**
  - **Targets:** Elections, trade agreements, sanctions, international conflicts.
  - **Access:** Global news organizations (Reuters, Associated Press), think tank reports (Council on Foreign Relations).

### Tier 2: Sector & Industry Trends (The Currents)
*These are powerful trends that affect specific segments of the market.*

- **Regulatory Changes:**
  - **Targets:** New legislation or regulatory guidance impacting specific industries (e.g., tech antitrust, FDA drug approvals, EPA emissions standards).
  - **Access:** Government agency websites (SEC, FDA, EPA), specialized industry news.
- **Supply Chain Analysis:**
  - **Targets:** Reports on shipping costs, port backlogs, semiconductor availability, raw material prices.
  - **Access:** Industry-specific publications, freight and logistics news sources.
- **Technological Shifts:**
  - **Targets:** News on breakthrough technologies (AI, quantum computing, biotech), patent filings, major R&D announcements.
  - **Access:** Tech news outlets (TechCrunch, Wired), academic journals, patent office databases.

### Tier 3: Micro-Economic Events (The Fish)
*These are company-specific events and data points.*

- **Corporate Earnings:**
  - **Targets:** Quarterly/annual earnings reports, forward guidance, conference call transcripts.
  - **Access:** Company investor relations pages, SEC filings (EDGAR), earnings calendars (e.g., Yahoo Finance, Zacks).
- **Analyst Actions:**
  - **Targets:** Analyst upgrades, downgrades, price target changes, initiation of coverage.
  - **Access:** Financial news terminals, market data providers (e.g., TipRanks, MarketBeat).
- **Corporate Actions:**
  - **Targets:** Mergers & Acquisitions (M&A), stock buyback announcements, dividend changes, leadership changes (CEO/CFO).
  - **Access:** Press releases, SEC filings, financial news.

## 2. The Zeta Memory Core

To achieve persistence and enable long-term learning, the network will utilize a centralized knowledge base known as the **Zeta Memory Core**.

- **Implementation:** A master `memory_core.json` file will serve as the single source of truth. Its structure will mirror the Intelligence Hierarchy.
- **Access Control:** A dedicated `MemoryAgent` will be the sole gatekeeper for the Memory Core. All other agents must submit new intelligence to the `MemoryAgent` for validation and integration. This prevents data corruption and ensures consistency.

*Example Structure for `memory_core.json`:*
```json
{
  "Tier1_Macro": {
    "Monetary_Policy": {
      "Federal_Reserve_Policy_Decision_2025-09-17": {
        "summary": "...",
        "last_updated": "..."
      }
    }
  },
  "Tier3_Micro": {
    "Corporate_Earnings": {
      "ADBE": {
        "Q3_2025_Report": {
          "executive_summary": "...",
          "sentiment": "Neutral",
          "last_updated": "..."
        }
      }
    }
  }
}
```

## 3. The Agent Legion Architecture

The network will evolve from a single "do-it-all" agent to a **Legion** of specialized, autonomous agents. Uniqueness is achieved through specialization.

- **`Zeta Prime` (The Orchestrator):** The master agent. It continuously monitors the `Memory Core` to identify intelligence gaps (e.g., stale data, missing reports for upcoming events). Its sole purpose is to deploy and task other agents to fill these gaps.
- **`MacroAgent`:** A specialist agent deployed by `Zeta Prime`. It is tasked with gathering intelligence on a specific Tier 1 category (e.g., "Gather all new data on upcoming CPI report").
- **`SectorAgent`:** A specialist that monitors a specific market sector (e.g., "Semiconductors") for Tier 2 events.
- **`CompanyAgent`:** Our deep-dive specialist. It is spawned by `Zeta Prime` to perform a full investigation on a single Tier 3 entity (e.g., "Execute deep dive on GME").
- **`MemoryAgent`:** The librarian and gatekeeper of the `Memory Core`. It receives reports from all other agents and integrates them into our persistent brain.

This new architecture provides the scalability, organization, and persistent memory required to operate a true, autonomous intelligence empire.
