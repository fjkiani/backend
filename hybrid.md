# Integrating Cohere and Gemini for News Analysis

This document outlines how the Cohere and Google Gemini Node.js SDKs are used in this project for advanced news analysis and market overview generation.

## 1. Overview

- Brief description of the goal (market overviews from news).
- Mention the two main flows (RealTimeNews, Trading Economics).
- High-level description of using Cohere for triage/summarization and Gemini for synthesis.

## 2. Setup

- Required environment variables (`COHERE_API_KEY`, `GEMINI_API_KEY`).
- Node.js SDK installation (`npm install cohere-ai @google/generative-ai`).

## 3. Cohere Integration (`CohereService`)

- Initialization (`backend/src/services/analysis/cohere.js`).
- Key methods used:
    - `triageArticleTitles`: Explain prompt structure and purpose.
    - `analyzeArticle` (if used for summarization): Explain prompt structure.
    - `synthesizeOverview`: Explain prompt structure.
- Example usage within route handlers (`backend/src/routes/analysis.js`).

## 4. Gemini Integration (`GoogleGenaiService`)

- Initialization (`backend/src/services/analysis/googleGenaiService.js`).
- Model selection (`gemini-1.5-flash-latest`).
- Key methods used:
    - `synthesizeOverview`: Explain prompt structure and how it differs/compares to Cohere's.
- Example usage within route handlers (`backend/src/routes/analysis.js`).

## 5. Hybrid Approach Example (Trading Economics Overview)

- Walk through the steps in the `/trading-economics-overview` endpoint:
    - Cohere Triage -> Summary Gathering -> Gemini Synthesis.
- Discuss the rationale for using each service at each step.

## 6. Economic Calendar & Event Interpretation

Beyond market overviews based on news articles, the application integrates an Economic Calendar feature with contextual LLM interpretation.

- **Backend Service (`EconomicCalendarService`):** 
    - Located in `backend/src/services/calendar/EconomicCalendarService.js`.
    - Fetches economic event data from a RapidAPI endpoint (`economic-events-calendar.p.rapidapi.com`).
    - Requires `ECONOMIC_CALENDAR_RAPIDAPI_KEY` environment variable.
    - Implements Redis caching for API responses.
- **Backend Route (`/api/calendar/events`):**
    - Defined in `backend/src/routes/calendarRoutes.js`.
    - Handles requests for calendar events based on date range and country filters.
- **Frontend Component (`EconomicCalendar.tsx`):**
    - Located in `src/components/Calendar/EconomicCalendar.tsx`.
    - Provides UI for selecting date ranges and minimum importance levels.
    - Displays fetched calendar events in a table format.
- **LLM Event Interpretation (`/api/calendar/interpret-event`):**
    - A POST endpoint in `backend/src/routes/calendarRoutes.js`.
    - Takes an individual `event` object and the current `marketOverview` (from the Trading Economics tab) as input.
    - Utilizes the existing `GoogleGenaiService` (Gemini) to generate an interpretation.
    - **Contextual Prompt:** The prompt dynamically adapts based on whether the event is past or upcoming and includes the provided `marketOverview` text. It asks the LLM to explain the event's significance *in the context* of the current market picture.
    - **Frontend Trigger:** An `<Info>` icon button next to each event in `EconomicCalendar.tsx` triggers a call to this endpoint.
    - **Frontend Display:** The returned interpretation is displayed in a dedicated area below the calendar table.

## 7. Potential Future Enhancements

- Briefly mention ideas like multi-step synthesis, prompt refinement, improving input data quality.
