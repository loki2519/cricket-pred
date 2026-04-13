# 🏏 AuctionOracle — Cricket Player Auction Prediction System

A full-stack mobile application built with **React Native (Expo)** and a **Python (FastAPI)** ML backend, integrated with **Supabase** for authentication and real-time data. Predict cricket player auction prices, manage teams, and run IPL-style auctions.

---

## 📋 Table of Contents
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Step 1 — Set Up Supabase](#-step-1--set-up-supabase)
- [Step 2 — Set Up the ML Backend](#-step-2--set-up-the-ml-backend)
- [Step 3 — Set Up the React Native Frontend](#-step-3--set-up-the-react-native-frontend)
- [Step 4 — Run the App](#-step-4--run-the-app)
- [Roles & Credentials](#-roles--credentials)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo (SDK 54) |
| Backend API | Python FastAPI + Uvicorn |
| ML Model | scikit-learn (Random Forest) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Navigation | React Navigation (Stack + Drawer) |

---

## 📁 Project Structure

```
cricket-pred/
├── auction-prediction-app/     # React Native / Expo frontend
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Auth/           # Login, Register, Forgot Password
│   │   │   ├── Admin/          # Admin dashboard, player management
│   │   │   ├── Manager/        # Manager views
│   │   │   └── User/           # User dashboard, predict price
│   │   ├── navigation/         # App navigation config
│   │   ├── lib/                # Supabase client
│   │   └── styles/             # Global theme & styles
│   ├── FINAL_DATABASE_SETUP.sql   # ✅ Use this SQL to set up DB
│   ├── app.json
│   └── package.json
├── ml-backend/                 # Python FastAPI ML backend
│   ├── main.py
│   └── requirements.txt
└── Data.xlsx                   # Training data for the ML model
```

---

## ✅ Prerequisites

Make sure the following are installed on your machine **before** you start:

| Tool | Version | Download |
|---|---|---|
| Node.js | v18 or above | https://nodejs.org |
| Python | 3.9 or above | https://python.org |
| Expo CLI | Latest | `npm install -g expo-cli` |
| Expo Go App | Latest | Install on your phone from App Store / Play Store |
| Git | Any | https://git-scm.com |

---

## 🗄 Step 1 — Set Up Supabase

> Supabase is the database and authentication backend. You must do this step first.

1. **Create a Supabase account** at https://supabase.com and create a **new project**.

2. Once the project is ready, go to the **SQL Editor** (left sidebar).

3. **Copy and paste** the entire contents of `auction-prediction-app/FINAL_DATABASE_SETUP.sql` into the SQL Editor.

4. Click **Run** to create all tables, enable Row Level Security, and insert sample data.

5. Go to **Project Settings → API** and copy:
   - `Project URL` (e.g. `https://xxxx.supabase.co`)
   - `anon / public` key

6. Open the file `auction-prediction-app/src/lib/supabase.js` and replace the values:

   ```js
   const supabaseUrl = 'YOUR_PROJECT_URL';
   const supabaseAnonKey = 'YOUR_ANON_KEY';
   ```

7. **Create a test Admin user** in Supabase:
   - Go to **Authentication → Users → Add User**
   - Create a user with email and password
   - Note their **User UID**
   - Then go to **SQL Editor** and run:
     ```sql
     INSERT INTO users (auth_id, username, role)
     VALUES ('<PASTE_USER_UID_HERE>', 'Admin', 'admin');
     ```

---

## 🐍 Step 2 — Set Up the ML Backend

> The ML backend is a Python FastAPI server that trains and serves the price prediction model.

### 2a. Open a terminal and navigate to the backend folder:

```bash
cd ml-backend
```

### 2b. Create a virtual environment (recommended):

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 2c. Install dependencies:

```bash
pip install -r requirements.txt
```

### 2d. Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### 2e. Train the ML model (first time only):

Open your browser and go to:
```
http://127.0.0.1:8000/docs
```

Click **POST /train → Try it out → Execute**. This reads `Data.xlsx` and trains the model. You only need to do this once — the model is saved as `model.pkl`.

> ⚠️ **Important:** The `Data.xlsx` file must be present at the root of the project (one level above `ml-backend/`). Do **not** move it.

---

## 📱 Step 3 — Set Up the React Native Frontend

### 3a. Open a new terminal and navigate to the frontend folder:

```bash
cd auction-prediction-app
```

### 3b. Install Node.js dependencies:

```bash
npm install
```

> This may take a few minutes the first time.

### 3c. (If testing on physical device via tunnel) Install ngrok:

```bash
npm install -g @expo/ngrok
```

---

## 🚀 Step 4 — Run the App

### Option A — Run on Physical Device (Recommended)

> Make sure your ML backend from Step 2 is already running.

```bash
cd auction-prediction-app
npx expo start --tunnel
```

- A **QR code** will appear in the terminal.
- Open the **Expo Go** app on your phone.
- Scan the QR code.
- The app will load on your device.

> 📌 Your phone and PC do **not** need to be on the same Wi-Fi when using `--tunnel`.

---

### Option B — Run on Web Browser

```bash
cd auction-prediction-app
npx expo start --web
```

Then press `W` in the terminal or open `http://localhost:8081` in your browser.

---

### Option C — Run on Android Emulator

Make sure Android Studio and an AVD (emulator) are running, then:

```bash
cd auction-prediction-app
npx expo start --android
```

---

## 👥 Roles & Credentials

The app has **3 user roles**. You set the role in the Supabase `users` table.

| Role | Access |
|---|---|
| `admin` | Manage players, teams, train model, view all predictions |
| `manager` | View players, manage their assigned team |
| `user` (default) | View dashboard, predict player prices |

To create users, register through the app's **Register screen** or create them in **Supabase → Authentication → Users**.

To change a user's role, run this in the Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE auth_id = '<USER_UID>';
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `Cannot connect to Metro` | Use `--tunnel` flag instead of LAN mode |
| `Model not trained yet` | Hit `POST /train` at `http://localhost:8000/docs` first |
| `Data file not found` | Make sure `Data.xlsx` is in the **root** folder (not inside `ml-backend/`) |
| `Database error on register` | Ensure you ran `FINAL_DATABASE_SETUP.sql` in Supabase SQL Editor |
| `Auth loop / Google login hangs` | Use email/password login instead; Google OAuth needs a deployed redirect URI |
| Expo QR not scanning | Try `npx expo start --tunnel` and ensure Expo Go app is up to date |
| `npm install` fails | Delete `node_modules/` and run `npm install` again |

---

## 📞 Support

If you run into issues, check:
- Supabase dashboard logs: **Logs → API / Auth**
- FastAPI logs in your terminal (Step 2 terminal)
- Expo logs in the Metro terminal (Step 4 terminal)
