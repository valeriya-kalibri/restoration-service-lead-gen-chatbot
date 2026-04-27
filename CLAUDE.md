# CLAUDE.md — Kalibri AI Lead Capture Chatbot

## What This App Is

This is the **Kalibri AI Lead Capture Chatbot** — a conversational widget built for restoration and emergency home service businesses (water, fire, mold, HVAC, roofing, plumbing, etc.).

It is **not** a general-purpose chatbot. It is a **lead capture and conversion system** disguised as a simple conversation. Its sole job: engage every website visitor instantly, classify urgency, capture contact details, and trigger the right action — automatically, 24/7.

---

## Business Context

**Product Owner:** Kalibri Studios (KalibriStudios.AI)
**Contact:** 407-212-8290
**Business Type:** Single-member LLC offering AI Automation Solutions, Agentic Workflows, AI Voice Agents, and Chatbots
**Target Customers:** Small to mid-sized restoration and emergency home service businesses

---

## Core Problem This Solves

Restoration is time-sensitive. Website visitors with emergencies leave in under 30 seconds if nothing engages them. This widget:

- Greets every visitor **immediately** on page load
- Holds them in a **conversation** instead of a blank form
- Captures **name, phone, email, location, and urgency**
- Classifies the lead as **emergency vs. scheduled**
- Triggers **SMS alerts** for high-urgency leads or logs them for follow-up
- Operates **after hours** with no human involvement

---

## Conversation Flow (7 Steps)

1. Visitor lands on website → widget appears immediately
2. AI opens with a warm, human-like greeting
3. AI asks what type of damage occurred (water, fire, mold, other)
4. AI classifies urgency (emergency vs. scheduled job)
5. AI captures: name, phone, email, location
6. High-urgency → SMS alert or live call connect | Low-urgency → logged for follow-up
7. All conversations stored in dashboard with full audit trail

---

## Key Features

| Feature | Description |
|---|---|
| Instant Engagement | Widget fires on page load, before visitor can leave |
| Guided Conversation | Short focused question sequence — no forms |
| Urgency Classification | Emergency vs. scheduled job routing |
| Smart Lead Capture | Name, phone, email, location — every time |
| SMS Alerts | Immediate team notification for high-urgency leads |
| After-Hours Coverage | 24/7 operation, no human required |
| Analytics Dashboard | Engagement, conversion, and lead data |
| Full Audit Trail | Every conversation logged and tracked |

---

## Pricing

| | Amount |
|---|---|
| One-Time Setup | $1,000 |
| Monthly Fee | $300/month (flat rate, all-inclusive) |

Setup includes: chatbot build, widget install, dashboard setup, booking/routing config, onboarding support.
Monthly includes: live widget, dashboard access, all API/infrastructure costs, maintenance, updates.

---

## Target Industries

- Water, fire & mold restoration
- HVAC & emergency home services
- Roofing & structural repair
- Plumbing & electrical
- Disaster response & cleanup
- Any service business needing fast lead response

---

## What This App Is NOT

- Not a general customer support chatbot
- Not a contact form replacement (it's active, not passive)
- Not a call center
- Not something the client manages — Kalibri builds, installs, and runs it entirely

---

## Tech Stack Notes

- Deployed as a **website widget** (embeds on client's existing site)
- Connects to a **dashboard** for lead tracking and analytics
- Supports **SMS alerting** to the client's team
- Supports **live call connection** for emergency leads
- API and infrastructure costs fully covered by Kalibri's flat monthly fee

---

## Development Conventions

- Keep conversation flow strictly to the 7-step sequence above
- Urgency classification must always produce a binary output: `EMERGENCY` or `SCHEDULED`
- Required captured fields: `name`, `phone`, `email`, `location`, `damage_type`, `urgency`
- All conversations must be logged — nothing dropped silently
- SMS trigger fires only on `EMERGENCY` classification
- Widget must initialize and display within **2 seconds** of page load
- No forms — all input collected through conversational prompts
- Tone: warm, human, helpful — never robotic or clinical

---

## Competitive Positioning

Very few restoration businesses currently use AI on their websites. Early adopters get a lead response advantage over competitors who still rely on contact forms and manual callbacks. First responder wins the job — this tool ensures the client is always first to engage.

---

*© 2026 Kalibri Studios. All rights reserved. | KalibriStudios.AI*