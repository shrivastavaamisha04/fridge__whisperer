# 🥗 The Fridge Whisperer

**Stop wasting food. Start saving money. Finally know what's in your fridge.**

[View Live App](https://ai.studio/apps/drive/1VqOh9ba_kPexCU35dq4ql5xxOawLDWmY)

## The Problem

We've all been there: you buy groceries with good intentions, life gets busy, and suddenly you're throwing away wilted vegetables and expired dairy. For people sharing fridges with flatmates, it's even worse—no one knows who bought what, what's expiring, or what's already been used.

**The result?** Food waste, wasted money, and those awkward "did you eat my yogurt?" conversations.

## The Solution

Fridge Whisperer is a grocery tracking app designed for individuals and flatmates to effortlessly manage what's in their fridge, get timely reminders before food expires, and reduce waste.

### How It Works

1. **Quick Add** - Manually add items in seconds
2. **Smart Tracking** - Set expiry dates and get notifications before food goes bad
3. **Flatmate Collaboration** - Share your fridge inventory with roommates so everyone stays on the same page
4. **Reduce Waste** - See what needs to be used first and plan meals accordingly

## Key Features

- **Simple Item Entry** - Add groceries with name, quantity, and expiry date
- **Expiry Notifications** - Get reminded 2-3 days before food expires
- **Shared Fridge View** - Flatmates can see what's available and who bought what
- **Usage Tracking** - Mark items as consumed to keep inventory accurate
- **Category Organization** - Filter by produce, dairy, meat, etc.

## Product Thinking: Why I Built It This Way

### Trade-offs & Prioritization

**Why manual entry over barcode scanning?**
While barcode scanning would reduce friction, it adds technical complexity and requires device permissions that could deter first-time users. Starting with simple manual entry lowers the barrier to entry and lets users experience value immediately. Barcode scanning can be added later based on user demand.

**Why focus on expiry tracking over recipe suggestions?**
While recipe integration would be nice-to-have, the core pain point is *awareness*—people simply forget what they have. Solving expiry tracking first creates immediate value and builds the foundation for future features like meal planning.

**Why flatmate collaboration over family sharing?**
Flatmate dynamics are unique: shared expenses, unclear ownership, and less communication than families. This feature addresses the specific friction point of "I didn't know that was yours" and enables accountability in shared living situations.

### Success Metrics (What Good Looks Like)

- **User Retention**: % of users who log items 3+ times per week
- **Waste Reduction**: % of items consumed vs. expired over 30 days
- **Collaboration Rate**: % of flatmate households where 2+ people actively use the app
- **Time to Value**: Average time from signup to first expiry notification

## Tech Stack

Built with Google AI Studio (Gemini API) for rapid prototyping and deployment.

---

## Run and Deploy Your Own Version

This contains everything you need to run your app locally.

### Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app: `npm run dev`

### Deploy

The app is already deployed and accessible at the link above. To deploy your own version, follow Google AI Studio's deployment instructions.

---

## What's Next?

Potential future features based on user feedback:
- Barcode scanning for faster item entry
- Recipe suggestions based on expiring ingredients
- Shopping list generation from frequently purchased items
- Waste analytics dashboard (monthly/yearly trends)
- Integration with grocery delivery apps for auto-import

---

Built by [Amisha Shrivastava](https://your-portfolio-link.com) as part of my product management portfolio.
