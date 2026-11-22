# 📄 MediSlot — Resume Description & Portfolio Guide

This document provides ready-to-use, ATS-optimized descriptions, technical skills, bullet points, and interview walkthroughs for your software engineering resume, LinkedIn profile, and portfolio.

---

## 🎯 1. ATS-Friendly Resume Bullet Points

Copy and paste these bullet points directly into your resume under your **Projects** section:

* **Engineered a full-stack clinical appointment & healthcare management system** utilizing React 19, TypeScript, Node.js/Express, and PostgreSQL (Prisma ORM), supporting four distinct role-based access tiers (`PATIENT`, `DOCTOR`, `CLINIC_ADMIN`, `PLATFORM_ADMIN`).
* **Architected multi-tier backend security & observability infrastructure**, implementing IP-based rate limiting on authentication routes, cryptographic request correlation IDs (`X-Request-Id` UUID v4), input sanitization, and automated test suites verifying 19 security assertions.
* **Integrated a physician-supervised Python FastAPI microservice** with mutual secret authentication for clinical documentation support (SOAP notes) and medical terminology translation, ensuring stateless in-memory data processing with zero clinical record persistence on the AI tier.

---

## 📝 2. Concise Project Description (Portfolio / LinkedIn)

> **MediSlot — AI-Powered Smart Clinic Booking & Healthcare Management System**  
> *Live Demo:* https://medislot-ai-healthcare.pages.dev/  
> *GitHub:* https://github.com/Sahithi200423/MediSlot-AI-Healthcare  
> 
> MediSlot is a full-stack healthcare platform designed to streamline doctor appointment scheduling, clinic administration, and assistive clinical documentation. Built with React 19, Express, TypeScript, Prisma, and PostgreSQL, the application enforces strict Role-Based Access Control (RBAC), multi-tenant clinic scoping, brute-force rate limiting, and request correlation tracing. It integrates a dedicated Python FastAPI microservice that provides physician-supervised AI consultation drafting and patient-friendly medical term explanations without persisting sensitive health data on the AI layer.

---

## 🛠️ 3. Categorized Technical Skills Demonstrated

| Category | Technologies & Concepts Demonstrated |
|---|---|
| **Frontend Engineering** | React 19, TypeScript, Vite, Tailwind CSS, React Router v7, TanStack React Query v5, Framer Motion, Lucide Icons, Responsive Mobile-First Design, Web Accessibility |
| **Backend Engineering** | Node.js, Express 4, TypeScript, RESTful API Design, Middleware Pipeline, Zod Schema Validation, Morgan HTTP Logging |
| **Database & ORM** | PostgreSQL, Prisma ORM 6, Multi-Tenant Schema Design, ACID Transactions, Relational Foreign Keys, Enums, Supabase Postgres |
| **Security & Authentication** | Supabase Auth (JWT), bcryptjs Password Hashing (10 rounds), Express Rate Limiting (`express-rate-limit`), Request Correlation Tracing (`X-Request-Id`), HTTP Header Injection Sanitization, CORS Configuration, Role-Based Access Control (RBAC) |
| **Microservices & AI** | Python 3, FastAPI, Uvicorn, Mutual Shared-Secret Service Authentication (`X-AI-Service-Secret`), Stateless Memory Buffer Processing, Physician-in-the-Loop Clinical Safety |
| **DevOps & Cloud** | Cloudflare Pages (Frontend Hosting), Render Web Services (Backend Node API & Python AI Microservice), Git Worktrees, CI/CD Cloudflare Integration, Multi-Hop Reverse Proxy Trust (`trust proxy: 1`) |
| **Testing & Quality** | Automated Integration Testing, HTTP Request Verification, Edge-Case Rate Limit Simulation, TypeScript Type Checking |

---

## 💼 4. Honest Explanation of Individual Contributions

When interviewers ask, *"What was your exact role in building MediSlot?"*, answer with this transparent breakdown:

1. **Full-Stack Application Architecture:**
   * Designed and structured the monorepo-style architecture separating the React client, Express API server, and Python AI microservice.
   * Defined the relational database schema in Prisma covering 19 models and 7 enums including Profiles, Clinics, Doctors, Appointments, and Audit Logs.
2. **Security Hardening (PR #3.1):**
   * Implemented brute-force login protection (max 5 failed attempts per 15-minute window) while configuring `skipSuccessfulRequests: true` to prevent lockout of legitimate users.
   * Built registration spam rate limiting (max 3 accounts per IP per hour).
   * Developed request correlation ID middleware generating RFC 4122 UUID v4 tokens and sanitizing malformed headers to eliminate injection risks.
   * Configured Express reverse-proxy trust (`trust proxy: 1`) for client IP extraction behind Render's load balancers.
3. **Role-Based Authorization & Tenant Scoping:**
   * Built Express middleware (`requireRole`, `requireClinicAccess`) verifying JWT payloads to prevent patients from accessing administrative endpoints or doctors viewing unrelated clinic records.
4. **AI Microservice Integration:**
   * Integrated communication between Express and the FastAPI service using mutual shared-secret headers, ensuring AI endpoints are unreachable by unauthenticated public traffic.
5. **Quality Verification & Staged Deployment:**
   * Authored automated verification suites executing 48+ test assertions validating rate limiting, error responses, and endpoint routing.

---

## ⏱️ 5. 30-Second Elevator Pitch

> *"I built MediSlot, a full-stack healthcare platform engineered with React, Express, TypeScript, and PostgreSQL. It solves clinic scheduling and administrative bottlenecks while supporting four distinct user roles—patients, doctors, clinic managers, and platform admins. A key focus was production security: I engineered brute-force rate limiting, request correlation tracking, and role-based route guards. It also features a physician-supervised Python FastAPI microservice that generates consultation note drafts while ensuring zero health records are saved to the AI tier."*

---

## 🎤 6. 2-Minute Technical Interview Deep Dive

**Step 1: The Problem (20 seconds)**
> *"Many clinic management systems suffer from two major problems: chaotic manual appointment scheduling that leads to double-bookings, and clinical documentation fatigue where doctors spend hours writing consultation notes instead of treating patients. I built MediSlot to address both challenges with an emphasis on production-grade security and clean architecture."*

**Step 2: The Architecture & Security (40 seconds)**
> *"The frontend is a responsive React 19 application built with Vite and Tailwind. The backend is a Node.js Express server written in TypeScript, backed by PostgreSQL and Prisma ORM. On the security side, I implemented IP-based rate limiting on authentication endpoints to stop brute-force attacks, configured Express reverse-proxy trust for Render's cloud infrastructure, and added custom correlation ID middleware that assigns a UUID v4 to every request for end-to-end tracing in logs and CORS responses."*

**Step 3: The AI Paradigm (30 seconds)**
> *"For AI, I adopted a strict 'physician-in-the-loop' philosophy. The platform connects to an isolated Python FastAPI microservice over mutual shared-secret authentication. It generates consultation drafts (SOAP notes) and summarizes patient records in memory buffers without persisting data on disk. Crucially, all AI outputs are marked as draft decision support and require clinician review before entering medical records."*

**Step 4: Engineering Challenges & Takeaway (30 seconds)**
> *"One major challenge was designing the Role-Based Access Control matrix across four roles while maintaining multi-tenant clinic isolation so clinic admins cannot inspect data from other clinics. I implemented modular middleware verifying JWT claims and database memberships. Overall, building MediSlot taught me how to write type-safe, maintainable code, enforce security best practices, and architect distributed services."*

