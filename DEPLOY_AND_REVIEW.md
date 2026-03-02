# MemAI – Simple instructions (backup & first review)

---

## 1. Your Version 1 backup

**Already done.** A zip of this project is saved as **`MemAI-Version1-backup.zip`** in this folder.

- **Copy that zip** to a safe place (e.g. Documents or iCloud).
- **To restore later:** Unzip it into a new folder, open Terminal there, run `npm install`, then `npm run dev`.

---

## 2. Put MemAI on GitHub

### IN BROWSER (GitHub website)

1. Go to **github.com** and sign in.
2. Click **+** (top right) → **New repository**.
3. Name it (e.g. **MemAI**). Choose Public or Private. Do **not** add a README.
4. Click **Create repository**.
5. Leave this tab open – you’ll need the repo URL in the next step.

### ON YOUR COMPUTER (Terminal in Cursor or Mac)

1. Open **Terminal** (in Cursor: Terminal → New Terminal, or the Mac Terminal app).
2. Go to your project folder and run these commands **one at a time** (press Enter after each). Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name.

```bash
cd "/Users/susannakemp/Library/Mobile Documents/com~apple~CloudDocs/AI Projects/AI Projects/chatgpt-convo-tracker"
git init
git add .
git commit -m "Version 1 – MemAI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If it asks for a password, use a **Personal Access Token** from GitHub (Settings → Developer settings → Personal access tokens), not your GitHub password.

---

## 3. Send a link to reviewers

You can do either A or B.

### Option A: Repo link (reviewers run it on their computer)

- **IN BROWSER:** Copy your repo URL: **https://github.com/YOUR_USERNAME/YOUR_REPO**
- Send that link to reviewers. They need to clone the repo, run `npm install` and `npm run dev` on their computer, then open the app in their **browser** at the URL Terminal shows (e.g. http://localhost:5173).

### Option B: Live link with Vercel (reviewers only open a link in the browser)

Reviewers just open one link in their **browser** – no install.

**1. ON YOUR COMPUTER (Terminal):** Run these **one at a time** (press Enter after each). If you see "not a git repository", run Section 2 (Put MemAI on GitHub) first to do `git init` and add your remote.

   ```bash
   cd "/Users/susannakemp/Library/Mobile Documents/com~apple~CloudDocs/AI Projects/AI Projects/chatgpt-convo-tracker"
   git add .
   git commit -m "Add Vercel config"
   git push origin main
   ```

**2. IN BROWSER (Vercel):**

1. Go to **vercel.com** and sign in (use “Continue with GitHub”).
2. Click **Add New…** → **Project**.
3. **Import** your MemAI repo from the list (or paste the repo URL).
4. Leave the settings as they are. Click **Deploy**.
5. Wait for the deploy to finish. You’ll get a live URL like **https://memai-xxxx.vercel.app**.

**3.** Open that URL in your **browser** to check the app, then send that link to reviewers.
---

## 4. What to send reviewers

- **Option A:** The repo link + “Clone, run `npm install` and `npm run dev`, then open the URL in your browser.”
- **Option B:** The live link (e.g. **https://memai-xxxx.vercel.app**). Tell them: “Open this link in your browser.”

You can add: “This is MemAI for first review. Everything stays in your browser. Try saving a conversation, Summarize, Recommendations, and Security & backup. Tell me what’s unclear or what you’d change.”

---

## 5. Restore Version 1 later

- **From the zip:** Unzip `MemAI-Version1-backup.zip` into a new folder. In Terminal: `npm install` then `npm run dev`. Open the URL it shows in your **browser**.
- **From Git:** In Terminal, in the project folder: `git checkout v1.0.0` (only works if you tagged Version 1 earlier).
