# Smart-Parking-System
Automatic parking system with mobile and web integration that uses a check-in kiosks and SQL databases to track and log vehicles, helping to manage congestion, minimize tracking errors,
and streamline the parking process for customers.

# Requirements
Below are the following requirements to run the website reservation system:
* Node.js LTS
* npm — comes with Node.js
* React
* React DOM
* Vite — development/build tool
* Postgre SQL

# Setup and Running the App
1. Install Node.js from the official website: https://nodejs.org/en/download
2. Clone the repo: git clone https://github.com/Jesse-s-Projects/Smart-Parking-System
3. Open cmd(Command Prompt) in the current working directory(CWD) and navigate to the project: cd Smart-Parking-System
4. Install the dependencies: npm install
5. Start the app: npm run dev
6. Copy the local host link from cmd, paste it into the browser, and press enter. This should navigate to the website.

# Configuring the Server
1. To start the backend locally, go back to the project directory: cd C:\Users\$YourUserName$\$ParentFolder$\Smart-Parking-System
2. Once there, navigate to the server folder: cd server
3. Install the dependencies: npm install
4. Start node: node server.js
5. You should see something like: ParkSmart API running on http://localhost:5000. This means the server is now running.

# Running the Kiosk
1. Open Command Prompt, navigate to the project directory, and then the kiosk folder.
2. Install the dependencies: npm install
3. Once there, run the following command: npm run dev -- --port 5174.
4. The kiosk should now be running.
