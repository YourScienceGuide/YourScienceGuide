markdown_content = """# Your Science Guide

Welcome to the core repository for **Your Science Guide**, an educational platform engineered for high performance, accessibility, and an excellent developer experience. 

This document outlines the foundational architecture of the project, detailing the codebase structure and the rationale behind our managed infrastructure and authentication choices.

---

## 🏗 Architecture & Tech Stack

Our stack is chosen to maximize development velocity while maintaining enterprise-grade security and edge performance.

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Authentication:** [Clerk](https://clerk.com/)
* **Hosting & CI/CD:** [Vercel](https://vercel.com/)

---

## 💻 The Codebase

The core application is built on the **Next.js App Router**, leveraging modern React features to optimize both the user and developer experience.

* **TypeScript by Default:** The entire codebase is strictly typed to catch errors at compile time, ensure self-documenting code, and provide robust intellisense (especially helpful when using AI tooling like Cursor).
* **Server Components (RSC):** We default to React Server Components to keep our client bundles small. Data fetching and secure backend logic happen directly on the server.
* **Client Components:** Interactivity is heavily isolated to the leaves of the component tree using `"use client"`.

---

## 🔐 Authentication (Clerk)

To ensure maximum security and to eliminate the maintenance overhead of manual cryptography, session rotation, and password recovery, **Your Science Guide** utilizes Clerk as its managed identity provider.

### Why Clerk?
* **Offloaded Liability:** Passwords, salts, and sensitive PII are handled entirely by Clerk's secure infrastructure. We do not roll our own auth.
* **Edge Compatibility:** Clerk's middleware runs on Vercel's Edge Network, intercepting requests and verifying JWT sessions cryptographically before the user ever hits our application servers.
* **Pre-built UI:** We utilize Clerk's `<UserButton />`, `<SignIn />`, and `<SignUp />` components to provide instant, accessible, and polished flows for account creation and password resets.

### Implementation Details
* **Middleware:** Located at `middleware.ts`, it protects our private routes (like `/dashboard`) while leaving public landing pages accessible.
* **Global Provider:** The `<ClerkProvider>` wraps our root layout (`app/layout.tsx`), injecting session state into the entire React tree.

---

## 🚀 Deployment (Vercel)

The platform is natively deployed on Vercel, providing a zero-configuration pipeline from Git push to global edge deployment.

### Why Vercel?
* **Native Next.js Support:** As the creators of Next.js, Vercel automatically optimizes our App Router architecture, caching, and serverless functions without complex DevOps configuration.
* **Edge Network:** Static assets and edge middleware (like our Clerk authentication checks) are distributed globally, ensuring low-latency access for students and users worldwide.
* **Preview Deployments:** Every pull request automatically generates an isolated, live preview environment. This allows for rapid iteration and UI testing before merging into the production branch.

---

## 🛠 Getting Started

To run the platform locally, follow these steps:

### 1. Clone & Install
