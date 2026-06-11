# Trident | Enterprise AI Bid & Proposal Engine

Trident is an enterprise-grade automated procurement and risk assessment suite designed to solve the manual overhead associated with processing Request for Proposals (RFPs), Tenders, and RFQs. 

This repository contains the high-fidelity, decoupled single-page application (SPA) frontend designed to handle document ingestion workflows, compliance matrices, and real-time narrative generation editing.

## ⚡ Core Hackathon Deliverables Implemented

The user interface map maps explicitly to the core criteria outlined in the technical evaluation scope:
* **Source Ingestion Interface:** An interactive corporate dropzone designed to trigger document analysis simulation workflows.
* **Win Probability Heuristics Dashboard:** Real-time data readouts analyzing fiscal/budget realignment ratings and capability density matching percentages.
* **Automated Traceability Matrix:** A high-contrast compliance check list mapping explicit external requirements against historical past performance assets with `COMPLIANT` and `NON-COMPLIANT` evaluation indicators.
* **Technical Proposal Generation Module:** A dual-pane split workstation combining extracted core directive parameters with an active, editable AI text narrative engine.

## 📂 Architecture & File Structure

The frontend layer leverages a highly maintainable, decoupled structure written in vanilla architecture to ensure optimal speed and zero build-time overhead:

```text
├── index.html     # Application layout, UI shells, and Tailwind CSS configuration
├── app.js         # View-Controller handling SPA tab routing and DOM updates
└── mockData.js    # Data layer representing model output structures and metrics data