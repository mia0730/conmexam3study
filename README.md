# CONM 1200 · Exam 3 Study Lab

A static study site (plain HTML/CSS/JS — no build step) for CONM 1200 Building Construction, Exam 3:
masonry, cavity walls, the CMU lab, wood & engineered wood, framing, and the 525 Huntington sequence.

## Put it on GitHub Pages
1. Create a new GitHub repository (e.g. `conm1200-exam3`).
2. Upload **everything in this folder** to the root of the repo (keep the `css/` and `js/` folders).
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. After a minute the site is live at `https://<your-username>.github.io/conm1200-exam3/`.

## What's inside
| File | What it is |
| --- | --- |
| `index.html` | Home: lesson cards, progress, study plan |
| `masonry-basics.html` … `huntington.html` | 9 visual lessons with interactive diagrams and quick checks |
| `practice.html` | Quiz modes: exam simulation, shuffle, short answer, lightning, review my misses |
| `flashcards.html` | 67 flip cards with diagrams |
| `review.html` | One-page last-minute sheet (prints to one landscape page) |
| `js/quizdata.js` | All questions and flashcards — edit here to add more |

Progress, saved misses and flashcard status are stored in the browser (localStorage), per device.
