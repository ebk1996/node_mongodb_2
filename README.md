# Adult Content Platform

A Node.js web application for user registration, authentication, and content posting with advanced verification features including age verification, face detection, and ID scanning.

## Features

### User Management
- **User Registration**: Secure account creation with email and password
- **User Login**: Session-based authentication
- **Password Security**: Bcrypt password hashing

### Content Posting
- **Create Posts**: Users can create posts with title, description, and images
- **File Upload**: Support for image uploads (JPG, PNG, GIF, PDF)
- **Dashboard**: View all user posts in a grid layout

### Verification Features
- **Age Verification Popup**: "Are you over 18?" modal appears on page load (stored in localStorage for 30 days)
- **Face Scanner**: Automatic face detection using face-api.js library
- **ID Scanner**: Image quality validation for ID documents
- **Age Verifier**: Manual age verification checkbox
- **Verification Badges**: Posts display verification status badges

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Template Engine**: EJS
- **Authentication**: express-session, bcryptjs
- **File Upload**: Multer
- **Face Detection**: face-api.js
- **Styling**: Custom CSS with gradient design

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ebk1996/node_mongodb_2.git
cd node_mongodb_2
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Configure your MongoDB connection in `.env`:
```
MONGODB_URI=mongodb://localhost:27017
SESSION_SECRET=your-secret-key-here
PORT=3000
```

5. Start the server:
```bash
npm start
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Registration
1. Navigate to `/register`
2. Complete the age verification popup
3. Fill in username, email, and password
4. Submit to create your account

### Login
1. Navigate to `/login`
2. Enter your email and password
3. Submit to access your dashboard

### Create a Post
1. From the dashboard, click "Create Post"
2. Fill in the title and description
3. Upload a content image (optional)
4. Complete verification steps:
   - Check the "I am 18+" confirmation (required)
   - Upload a face photo for face detection (optional)
   - Upload an ID document for verification (optional)
   - Check age verification if applicable
5. Submit to create your post

## File Structure

```
node_mongodb_2/
├── public/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   └── js/
│       ├── age-verification.js # Age popup handler
│       ├── face-scanner.js     # Face detection logic
│       └── id-scanner.js       # ID validation logic
├── views/
│   ├── register.ejs            # Registration page
│   ├── login.ejs               # Login page
│   ├── dashboard.ejs           # User dashboard
│   └── create-post.ejs         # Post creation form
├── uploads/                    # User uploaded files
├── db.js                       # Database connection
├── server.js                   # Main server file
├── program.js                  # Legacy MongoDB queries
├── package.json                # Dependencies
└── .env                        # Environment variables (not in repo)
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- Session-based authentication
- File upload validation (type and size limits)
- Age verification modal with localStorage persistence
- Protected routes requiring authentication
- Secure session cookies

## API Routes

### Public Routes
- `GET /` - Redirect to login or dashboard
- `GET /register` - Registration page
- `POST /register` - Create new user
- `GET /login` - Login page
- `POST /login` - Authenticate user

### Protected Routes (require authentication)
- `GET /dashboard` - User dashboard
- `GET /create-post` - Post creation form
- `POST /create-post` - Create new post
- `GET /logout` - End user session

## Database Collections

### users
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  isVerified: Boolean
}
```

### posts
```javascript
{
  _id: ObjectId,
  userId: String,
  username: String,
  title: String,
  description: String,
  contentImage: String,
  faceImage: String,
  idImage: String,
  ageConfirmed: Boolean,
  faceVerified: Boolean,
  idVerified: Boolean,
  ageVerified: Boolean,
  createdAt: Date
}
```

## Development

### Run in development mode:
```bash
npm run dev
```

### Run legacy MongoDB queries:
```bash
npm run legacy
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret key for session encryption
- `PORT` - Server port (default: 3000)

## Browser Compatibility

- Modern browsers with JavaScript enabled
- localStorage support required for age verification
- File API support required for image uploads

## Security

This application implements comprehensive security measures including:

- **CSRF Protection**: Token-based CSRF protection on all POST routes
- **Secure Sessions**: httpOnly, sameSite cookies with production-grade settings
- **Password Security**: Bcrypt hashing with 10 rounds
- **Input Validation**: Comprehensive validation on all user inputs
- **File Upload Security**: Type and size restrictions with validation

For detailed security information, see [SECURITY.md](SECURITY.md).

**Security Scan Results**: ✅ 0 vulnerabilities (CodeQL + npm audit)

## Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production` for secure cookies
2. Use a strong `SESSION_SECRET` (32+ characters)
3. Enable HTTPS/SSL
4. Configure MongoDB with authentication
5. Review security recommendations in SECURITY.md

## License

MIT

## Author

hlywd666@gmail.com
