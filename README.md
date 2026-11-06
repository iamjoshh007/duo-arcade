# DUO ARCADE — 5 online 2-player games

A static frontend for GitHub Pages with Firebase Realtime Database room sync.

## Games
1. Tic-Tac-Toe
2. Connect 4
3. Rock Paper Scissors (first to 3 points)
4. Dots & Boxes (3×3 boxes)
5. Battleship (small 3-ship grid)

## Before playing online
GitHub Pages hosts the website, but multiplayer room state is stored in Firebase.

### Firebase setup
1. Go to https://console.firebase.google.com/ and create a project.
2. Add a Web App. Copy the Firebase config.
3. In Firebase Console → Build → Realtime Database → Create database.
4. For quick testing only, use test mode. Do not leave an open test database publicly accessible.
5. Paste your config into `js/firebase.js`.
6. Deploy this folder to a public GitHub repository and enable Settings → Pages → Deploy from branch → `main` → `/root`.

### Important security note
This demo intentionally uses simple anonymous room access and is not production-secure. Before public use, add Firebase Authentication, validate turns/players/game rules with Firebase Security Rules or trusted server functions, set database rules to deny unauthorized writes, and consider room expiration. Never publish private credentials. Firebase web config is client-visible by design; security comes from rules and auth, not hiding the config.

### GitHub Pages
- Create a public repository.
- Upload all files preserving the folder structure.
- Settings → Pages → Deploy from branch → `main` → `/root`.
- Wait for deployment, then open the Pages URL.

### Local testing
Because Firebase uses ES modules, serve the folder from a local web server (VS Code Live Server is easiest). Opening `index.html` directly with `file://` may fail module imports.

## Known demo limitations
- Firebase config must be filled before room creation.
- Battleship is a compact demo board, not a full classic fleet game. Players place three ships, mark ready, then take turns firing.
- Rematch resets the board. A production version should reset only when both players agree.
- The starter app does not include login, moderation, room expiration, or robust anti-cheat.
