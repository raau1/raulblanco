# Study Buddy

A Spring Boot application with Firebase for students to find study partners by year, module, and preferences.

## Features

- User authentication with Firebase Auth
- Cloud Firestore database for data persistence
- Create study sessions with customizable details
- Browse and filter sessions by year and module
- Join request system for sessions
- User profiles with ratings and stats

## Tech Stack

- **Backend**: Spring Boot 3.2, Spring Security
- **Database**: Firebase Cloud Firestore
- **Authentication**: Firebase Authentication
- **Frontend**: HTML, CSS, JavaScript (vanilla)

## Project Structure

```
├── src/main/java/com/studybuddy/
│   ├── StudyBuddyApplication.java    # Main application
│   ├── config/                       # Firebase & Security config
│   ├── controller/                   # REST controllers
│   ├── dto/                          # Data Transfer Objects
│   └── service/                      # Business logic (Firestore)
├── src/main/resources/
│   ├── application.properties        # App configuration
│   ├── firebase-service-account.json # Firebase credentials (create this)
│   └── static/                       # Frontend files
│       ├── index.html
│       ├── css/styles.css
│       └── js/
├── pom.xml                           # Maven dependencies
└── README.md
```

## Setup Instructions

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- Firebase project with Authentication and Firestore enabled

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LeicesterCS-Hackathon-2025-2026---Team-11
```

### 2. Set Up Firebase

#### Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** > Sign-in method > Email/Password
4. Create **Firestore Database** (Start in test mode)

#### Get Service Account Key (for Backend)
1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Save the downloaded JSON file as:
   ```
   src/main/resources/firebase-service-account.json
   ```

#### Get Web Config (for Frontend)
1. In Firebase Console, go to **Project Settings** > **General**
2. Under **Your apps**, click **Add app** > **Web**
3. Copy the config values and update `src/main/resources/static/js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDLknCYpP-WmEdfC8cjx1y-Hf_sRFCOF9o",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Build and Run

```bash
# Using Maven
mvn spring-boot:run

# Or build JAR and run
mvn clean package
java -jar target/study-buddy-1.0.0.jar
```

### 4. Access the Application

- **Web App**: http://localhost:8080

## API Endpoints

### Authentication

```
POST /api/auth/signup    - Register new user (creates Firestore profile)
```

### Sessions

```
GET    /api/sessions              - Get all sessions (with filters)
GET    /api/sessions/{id}         - Get session by ID
POST   /api/sessions              - Create new session (auth required)
DELETE /api/sessions/{id}         - Delete session (creator only)
GET    /api/sessions/my-sessions  - Get user's created sessions
GET    /api/sessions/joined       - Get user's joined sessions
POST   /api/sessions/{id}/request - Request to join session
POST   /api/sessions/{id}/accept/{userId}  - Accept join request
POST   /api/sessions/{id}/decline/{userId} - Decline join request
```

### Users

```
GET  /api/users/me        - Get current user profile
GET  /api/users/me/stats  - Get user statistics
GET  /api/users/{id}      - Get user by ID
PUT  /api/users/me/modules - Update user's modules
```

## Firestore Data Structure

### Users Collection
```javascript
users/{uid}: {
    name: string,
    email: string,
    year: string,
    modules: string[],
    createdAt: number,
    updatedAt: number
}
```

### Sessions Collection
```javascript
sessions/{sessionId}: {
    title: string,
    module: string,
    year: string,
    date: string,
    time: string,
    duration: number,
    location: string,
    maxParticipants: number,
    preferences: string[],
    description: string,
    creatorId: string,
    creatorName: string,
    participants: string[],
    requests: string[],
    status: 'open' | 'full' | 'completed' | 'cancelled',
    createdAt: number,
    updatedAt: number
}
```

### Ratings Collection
```javascript
ratings/{ratingId}: {
    fromUserId: string,
    toUserId: string,
    sessionId: string,
    score: number,
    comment: string,
    createdAt: number
}
```

## Day 1 Deliverables

### Backend Team
- [x] Spring Boot project setup with Maven
- [x] Firebase Admin SDK integration
- [x] Firestore service layer
- [x] REST controllers for all endpoints
- [x] Firebase Auth token verification
- [x] Session CRUD operations
- [x] Join request system

### Frontend Team
- [x] Single-page application structure
- [x] Responsive navigation with routing
- [x] Firebase Auth integration (login/signup)
- [x] Session creation form
- [x] Browse sessions page with filters
- [x] Session card component
- [x] User profile page skeleton
- [x] API integration with Firebase ID tokens

## How Authentication Works

1. **Frontend**: User signs up/logs in using Firebase Auth SDK
2. **Frontend**: Gets Firebase ID token from authenticated user
3. **Frontend**: Sends ID token in `Authorization: Bearer <token>` header
4. **Backend**: Verifies token using Firebase Admin SDK
5. **Backend**: Extracts user UID and processes request

## Team

- Team 11 - Leicester CS Hackathon 2025-2026

## License

MIT
