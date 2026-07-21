# 🚀 SynapHR: AI-Powered Talent Management Platform

SynapHR is an enterprise-grade AI-Powered Recruitment Platform designed to automate CV screening, resume parsing, candidate-job match scoring, interview scheduling, and recruitment performance analytics. By leveraging Google Gemini 1.5 Flash AI, the platform acts as an automated assistant to streamline hiring decisions and reduce bias.

---

## 📋 System Requirements & Prerequisites

Ensure the following tools are installed on your system before running the project:

1. **.NET 10.0 SDK**: Required to build and execute the backend Web API.
   * [Download .NET 10.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
2. **Node.js (v18.x or later)**: Required for package management and running the frontend development server.
   * [Download Node.js](https://nodejs.org/)
3. **Microsoft SQL Server**: Relational database instance to persist application data.
4. **Google Gemini API Key**: For live AI resume parsing and matching (uses mock offline fallbacks if absent).

---

## 🚀 How to Run the System

### 1️⃣ Run the Backend (ASP.NET Core Web API)
1. Open a terminal in the backend directory (`final_assignment/`):
   ```bash
   # Restore NuGet dependencies
   dotnet restore

   # Run Entity Framework Migrations to create/update database tables
   dotnet ef database update

   # Run the Web API server
   dotnet run
   ```
2. The backend server will start running on: **`http://localhost:5163`**.
3. You can access the interactive **Scalar API testing playground** at: **`http://localhost:5163/scalar/v1`**.

---

### 2️⃣ Run the Frontend (Vite + React + TypeScript)
1. Open a new terminal in the frontend directory (`frontend/final_projct/`):
   ```bash
   # Install npm packages
   npm install

   # Start the React development server
   npm run dev
   ```
2. The frontend web interface will start running on: **`http://localhost:5173`**.
3. Open your browser and navigate to `http://localhost:5173` to interact with the platform.
