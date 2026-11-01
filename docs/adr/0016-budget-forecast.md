# 0016 · How the budget forecast works

- **Status:** proposed
- **Date:** 2026-11-01
- **Deciders:** Team lastWorche

## Context

A project lead wants to know when an order's budget runs out, in time to order more (stories #10, #14, #34). The figure must take vacations, public holidays and shutdowns into account, and must be explainable. The product must also say so when it does not know.

## Options considered

1. **Walk through the coming days, per consultant** – each consultant's recent pace is added up day by day, skipping their days off, so every assumption is visible and a team member can follow it with a calendar / a stable pace is assumed, so it cannot see a project slowing down or speeding up.
2. **Free budget divided by average weekly pace** – one line of code / it cannot take vacations or holidays into account per person, which the story requires.
3. **A statistical or machine-learning model** – could learn seasonal patterns / far too little data, hard to explain to a project lead or to a jury, and personal working data would feed a model.

## Decision

We choose **walking through the coming days**, in [forecast.ts](../../backend/src/domain/forecast.ts).

- **Pace:** per consultant, booked hours per working day from their first to their last booking in the last 8 weeks.
- **Not enough data:** fewer than 5 booked days in those 8 weeks shows "not enough data", never a date.
- **Days off:** weekends, the company shutdown, the consultant's approved vacation and the public holidays of their federal state count as zero hours.
- **Warning:** when the budget runs out before the project ends, the order date is 4 weeks earlier, and the proposal is the shortfall at the project end, rounded up.
- **Scenarios:** an extra consultant counts 8 h per working day. A scenario arrives with the request and is never stored.

From the warning, a project lead can ask purchasing for that amount. Only purchasing's confirmation raises the budget and extends the order to the project end, so the new budget can be booked. Each order has at most one open request. This keeps contracts out of the product while the decision stays with purchasing.

## Consequences

- The 4-week lead time, 8-week window and 8 h for a new consultant are constants, not settings. They are assumptions from the stories, shown on the screen, and the team should check them with purchasing.
- A long break in bookings lowers the pace, so a forecast can look better than the real plan. The panel states the pace, so a project lead can judge this.
- A forecast is only visible to the order's project lead, because it is built from single consultants' bookings and vacations.
- Public holidays are calculated, not stored, and cover state-wide holidays only. Local ones, such as the Augsburg peace festival, are not included.
