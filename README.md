# BotForces — cf-tool Integration Branch

This branch replaces the browser extension with a server-side submission pipeline powered by the `cf-tool` CLI binary. Code is submitted directly to Codeforces from the Next.js backend, with no browser extension required.

For the production-ready, extension-based version see the `main` branch.

## Core Features

*   **Automated Submission Synchronization:** Connects with the Codeforces API to fetch user profiles and recent submission histories.
*   **Server-side Code Submission:** Submits code to Codeforces via the `cf-tool` CLI binary running on the backend. No browser extension required.
*   **AI Code Analysis:** Utilizes Google Gemini to analyze failed submissions and provide contextual coaching feedback.
*   **Intelligent Insights:** Correlates problem tags with algorithms and data structures to deliver specific study recommendations.
*   **Integrated Code Editor:** A full Monaco-based code editor supporting C++, Python, Java, JavaScript, Kotlin, Rust, Go, and C.

## How Submission Works

1.  You log in to Codeforces once via the dashboard login card. This drives the local `cf-tool` binary to authenticate and store a session in `~/.cf/`.
2.  When you click Submit in the editor, the backend writes your code to a temporary file and spawns `cf submit`, parsing the real-time stdout for the verdict.
3.  The result is saved to your MongoDB database and displayed inline in the editor.

## Technical Architecture

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Database:** MongoDB via Mongoose
*   **Styling:** Tailwind CSS
*   **AI Integration:** Google GenAI SDK (Gemini)
*   **Submission:** xalanq/cf-tool v1.0.0 (Linux x64 binary at `bin/cf`)

## Setup and Testing Instructions

### 1. Repository Configuration

Clone the repository, switch to this branch, and install dependencies:

```bash
git checkout cftools-integration
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root of the project:

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup (MongoDB Atlas)

1.  Create an account or log in to MongoDB Atlas.
2.  Create a new project and deploy a free cluster.
3.  Under "Database Access", create a database user and save the password.
4.  Under "Network Access", add your current IP address to the whitelist.
5.  Click "Connect", select "Drivers", and copy the connection string. Replace `<password>` with your database user's password.
6.  Paste the string as `MONGODB_URI` in your `.env.local` file.

### 4. API Setup (Google Gemini)

1.  Navigate to Google AI Studio and generate a new API key.
2.  Paste it as `GEMINI_API_KEY` in your `.env.local` file.
3.  If left as `gemini-placeholder-key`, the application uses a local stub for development.

### 5. Running the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` and enter your Codeforces handle.

### 6. Connecting cf-tool

Once on the dashboard, a login card will appear in the top bar. Enter your Codeforces handle and password. This authenticates the local `bin/cf` binary and stores a session at `~/.cf/session`. You will only need to do this once per machine.

After logging in, you can open any contest problem, write your solution in the editor, and click Submit. The backend will handle the rest.

## Security Note

This implementation requires your Codeforces password to be sent to the local Next.js backend so the `cf-tool` binary can authenticate. This is acceptable when running locally on your own machine. It is not suitable for a public multi-user deployment, where the browser extension approach on the `main` branch should be used instead.
