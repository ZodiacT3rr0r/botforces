# BotForces

BotForces is an advanced, AI-powered competitive programming analysis platform. It integrates directly with the Codeforces API to synchronize user submissions and leverages Google Gemini to provide intelligent, contextual feedback on failed attempts. The platform is designed to act as an automated competitive programming coach, identifying conceptual mistakes, analyzing time/space complexities, and providing tailored study recommendations.

## Core Features

*   **Automated Submission Synchronization:** Connects with the Codeforces API to securely fetch user profiles and recent submission histories.
*   **AI Code Analysis:** Utilizes Google Gemini to analyze failed submissions (e.g., Wrong Answer, Time Limit Exceeded) against problem constraints and provides actionable feedback.
*   **Intelligent Insights:** Correlates problem tags with algorithms and data structures to deliver specific topic recommendations for improvement.
*   **Browser Extension Integration:** Includes a companion browser extension to allow for direct submission from the BotForces integrated code editor to Codeforces.
*   **Integrated Code Editor:** A full Monaco-based code environment supporting multiple languages.

## Technical Architecture

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Database:** MongoDB via Mongoose
*   **Styling:** Tailwind CSS
*   **AI Integration:** Google GenAI SDK (Gemini)

## Setup and Testing Instructions

To run this project locally, you will need Node.js installed on your machine, a MongoDB database, and a Google Gemini API key.

### 1. Repository Configuration

Clone the repository and install the dependencies:

```bash
npm install
```

### 2. Environment Variables

Create a file named `.env.local` in the root of the project. This file is required to connect to your database and the Gemini API.

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup (MongoDB Atlas)

To configure the MongoDB connection:

1.  Create an account or log in to MongoDB Atlas.
2.  Create a new project and deploy a free cluster.
3.  Under "Database Access", create a new database user and securely store the password.
4.  Under "Network Access", add your current IP address to the whitelist to allow connections.
5.  Click "Connect", select "Drivers", and copy the provided connection string. Replace `<password>` with your database user's password.
6.  Paste this string as the `MONGODB_URI` in your `.env.local` file.

### 4. API Setup (Google Gemini)

To configure the AI analysis:

1.  Navigate to Google AI Studio.
2.  Generate a new API key.
3.  Paste this key as the `GEMINI_API_KEY` in your `.env.local` file.
4.  If the key is left as `gemini-placeholder-key`, the application will default to a local stubbing mechanism for development purposes.

### 5. Running the Development Server

Start the application:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. Enter any valid Codeforces handle to view the dashboard and trigger the initial synchronization pipeline.

### 6. Installing the Browser Extension

To enable integrated submissions:

1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Enable "Developer mode" in the top right corner.
3.  Click "Load unpacked".
4.  Select the `extension` directory located within this project.
5.  Ensure you are logged into Codeforces in your browser to authenticate submissions.
