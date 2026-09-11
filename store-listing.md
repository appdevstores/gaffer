# Gaffer — App Store Connect Listing Content

Copy-paste ready. All text below assumes **no data collection** (Gaffer is 100% offline).

---

## App Information (App Store Connect → App Information)

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Name**               | Gaffer                                                  |
| **Subtitle**           | Soccer Match-Day Manager                                |
| **Primary Category**   | Sports                                                  |
| **Secondary Category** | (leave empty)                                           |
| **Age Rating**         | 4+                                                      |
| **App Privacy**        | "Data Not Collected" — answer **No** to every data type |

## Promotional Text (max 170 chars)

> Fair-play coaching, made simple. Live tactical pitch, instant subs, cards, and equal playing-time tracking — all offline, on your sideline.

## Description (max 4000 chars)

> **Gaffer is the sideline command center for youth soccer coaches.** Plan your season, build your roster, and run every match from a live tactical canvas — completely offline, with no accounts and no data collection. Your team's info never leaves the device.
>
> **SEASONS & ROSTERS**
> Create a season, remember your team, and rapid-fire add players — the app keeps focus on the name field so you can type a whole squad in seconds.
>
> **LIVE MATCH CANVAS**
> Your formation, drawn on a real pitch. Tap a bench player, tap a spot on the field — substitutions are two taps, no finger covering the screen. The bench auto-sorts so late arrivals jump to the front of the queue.
>
> **FAIR-PLAY ROTATION**
> Gaffer tracks every player's game time live and shows the equal-playing-time target for the match. Green-to-red energy meters on each player make it obvious who needs a rest and who needs more minutes.
>
> **REFEREE-FRIENDLY CLOCK**
> The whistle drives everything: start the match, half-time break timer, second half, extra time for playoff games — stoppage time turns the clock red. Sides flip automatically when a new half kicks off.
>
> **CARDS & EVENTS**
> Long-press any player to show a yellow, convert a second yellow to red, or send a player off. Cards stay visible on the player for the whole game and appear in the match report.
>
> **MATCH REPORTS**
> Full-time summary with playing time, goals, and cards — emailed straight from your device in one tap. Manage storage by wiping old matches when you're done.
>
> Built for coaches, by people who stand on sideline. No subscriptions, no servers, no login — just coaching.

## Keywords (max 100 chars, comma-separated)

`soccer, football, coach, lineup, substitution, match, youth, game, rotation, team`

## Support / Marketing / Privacy URLs

| Field                  | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **Support URL**        | `https://appdevstores.github.io/gaffer/support.html`        |
| **Marketing URL**      | `https://appdevstores.github.io/gaffer/` (optional)         |
| **Privacy Policy URL** | `https://appdevstores.github.io/gaffer/privacy-policy.html` |

---

## Privacy Policy (host at a public URL, link it in App Store Connect)

> **Gaffer Privacy Policy**
>
> Effective date: [insert date]
>
> Gaffer is an offline-first app designed for youth soccer coaching. It does not collect, store, transmit, or share any personal data.
>
> - **No accounts:** Gaffer requires no sign-up, login, or profile.
> - **No servers:** All data — seasons, rosters, match records — is stored locally on your device and nowhere else.
> - **No tracking:** Gaffer contains no analytics, advertising, or third-party tracking SDKs.
> - **No data collection:** Gaffer does not collect or transmit any personal information, location data, or usage statistics.
> - **Email reports (optional):** If you choose to email a match summary, the report is composed and sent using your device's own mail app. Gaffer itself never sees or stores that email.
> - **Data control:** Deleting the app removes all locally stored data. You can also delete individual matches or entire seasons inside the app's Storage Management screen.
>
> Because Gaffer collects no data, there is nothing to access, correct, or delete on our side. If you have questions, contact: [your email].

---

## TestFlight — "What to Test" (paste into TestFlight → Build → What to Test)

> Suggested test flow for this build:
>
> 1. Start a new season (enter your team name) and add a full roster.
> 2. Start a match, verify the formation appears, and kick off the 1st half.
> 3. Substitute players with the two-tap flow (bench → pitch, pitch → pitch swap).
> 4. Check live game-time badges and the energy/rotation meters against the "target" time.
> 5. Long-press a player to give a yellow, then a second yellow → confirm auto red card and that they cannot re-enter.
> 6. Verify half-time break timer runs but pauses player minutes; start 2nd half and confirm sides flip.
> 7. On a playoff setup, run extra time (ET1 → ET break → ET2).
> 8. Finish the match, check the summary, and test the email report + storage purge.
> 9. Kill and reopen the app mid-match — confirm the match resumes with clock, cards, and minutes intact.

---

## TestFlight group invite blurb (send to testers)

> You're invited to test **Gaffer** — the offline soccer match-day manager.
> Track playing time live, run two-tap substitutions, manage cards, and email match reports from the sideline. No account needed.
>
> Install the TestFlight app, accept the invite, and let me know how it goes on the sideline!

---

## Where each piece goes (App Store Connect)

1. **App Store → App Information** — name, subtitle, category, age rating, privacy URLs
2. **App Store → Privacy** — "Data Not Collected" (all No)
3. **App Store → Prepare for Submission** (after a build is uploaded) — description, promotional text, keywords, screenshots, version notes
4. **TestFlight → App Store Connect users** — internal testers; **TestFlight → External groups** — external testers (needs privacy policy URL set first)
