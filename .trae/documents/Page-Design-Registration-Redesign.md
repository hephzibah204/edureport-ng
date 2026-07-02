# Page Design: Registration Page Redesign

## 1. Overview
The current registration page serves its purpose but lacks the modern, premium feel that matches the "All-in-one school management" proposition. 
This redesign shifts the experience from a static, form-heavy page to a sleek, **Minimalist Drawer** experience with rich interactive feedback.

## 2. Approach: Minimalist Drawer
- **The Foundation (Background):** A visually rich, full-screen background showcasing the product's value proposition (using the existing green/gold brand colors, possibly with a subtle animated gradient or grid pattern).
- **The Trigger:** A clean "Get Started" or "Create School Account" call-to-action centered on the screen.
- **The Drawer (Vaul / Framer Motion):** Clicking the CTA slides up a smooth, modern drawer (or a side sheet on desktop) containing the registration flow. This keeps the user anchored to the landing page context while completing the form.

## 3. Interactive Features & UX Enhancements
- **Framer Motion Animations:** Smooth transitions between form states, error message appearances, and the drawer opening/closing.
- **Live Subdomain Check:** As the user types their `School Username`, a debounce function will hit an API endpoint to verify availability and provide immediate visual feedback (e.g., a green checkmark or red warning).
- **Password Strength Meter:** A visual bar indicating the complexity of the entered password to ensure security standards (>12 chars).
- **Enhanced Plan Cards:** The plan selection will be visually distinct, highlighting the "Lifetime Access" or "Pro" plans with subtle glowing borders or badges.
- **Progressive Disclosure:** Inside the drawer, the form will reveal sections progressively (e.g., select plan -> enter details) to reduce cognitive load, rather than showing all fields at once.

## 4. Technical Implementation Plan
1. **Component Restructuring:** 
   - Move the giant `RegisterContent` into smaller, manageable components (`PlanSelector`, `SchoolDetailsForm`, `PaymentStep`).
   - Create a new `RegistrationDrawer` component using the `vaul` library (already in `package.json`).
2. **State Management:**
   - Keep React `useState` for simple form state, but group them logically.
3. **API Enhancements:**
   - Add a lightweight `GET /api/auth/check-domain?domain=xyz` endpoint to support the live subdomain check.
4. **Styling:**
   - Use Tailwind CSS with the existing CSS variables (`--color-green`, `--color-gold`, etc.).
   - Introduce modern primitives like glassmorphism (backdrop-blur) for the drawer.

## 5. Next Steps
Once approved, we will transition to Execution phase to implement these changes iteratively.