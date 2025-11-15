require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const connect = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// CSRF Token Generation
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CSRF Protection Middleware
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

function verifyCSRF(req, res, next) {
  const token = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
  if (token && token === req.session.csrfToken) {
    next();
  } else {
    res.status(403).send('CSRF token validation failed');
  }
}

// Database connection
let db;
let client;

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', verifyCSRF, async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  try {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render('register', { error: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.render('register', { error: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      return res.render('register', { error: 'Password must be at least 6 characters' });
    }
    
    const users = db.collection('users');
    
    // Check if user already exists
    const existingUser = await users.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.render('register', { error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await users.insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isVerified: false
    });
    
    // Auto login after registration
    req.session.userId = result.insertedId.toString();
    req.session.username = username;
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { error: 'An error occurred during registration' });
  }
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

app.post('/login', verifyCSRF, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.render('login', { error: 'All fields are required' });
    }
    
    const users = db.collection('users');
    const user = await users.findOne({ email });
    
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.render('login', { error: 'Invalid email or password' });
    }
    
    // Set session
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'An error occurred during login' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const posts = db.collection('posts');
    const userPosts = await posts.find({ userId: req.session.userId }).sort({ createdAt: -1 }).toArray();
    
    res.render('dashboard', { 
      username: req.session.username,
      posts: userPosts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

app.get('/create-post', requireAuth, (req, res) => {
  res.render('create-post', { error: null, success: null });
});

app.post('/create-post', requireAuth, verifyCSRF, upload.fields([
  { name: 'contentImage', maxCount: 1 },
  { name: 'faceImage', maxCount: 1 },
  { name: 'idImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, ageConfirmed, faceVerified, idVerified, ageVerified } = req.body;
    
    // Validation
    if (!title || !description) {
      return res.render('create-post', { 
        error: 'Title and description are required',
        success: null 
      });
    }
    
    if (ageConfirmed !== 'true') {
      return res.render('create-post', { 
        error: 'You must confirm you are over 18',
        success: null 
      });
    }
    
    const posts = db.collection('posts');
    
    const postData = {
      userId: req.session.userId,
      username: req.session.username,
      title,
      description,
      contentImage: req.files['contentImage'] ? req.files['contentImage'][0].filename : null,
      faceImage: req.files['faceImage'] ? req.files['faceImage'][0].filename : null,
      idImage: req.files['idImage'] ? req.files['idImage'][0].filename : null,
      ageConfirmed: ageConfirmed === 'true',
      faceVerified: faceVerified === 'true',
      idVerified: idVerified === 'true',
      ageVerified: ageVerified === 'true',
      createdAt: new Date()
    };
    
    await posts.insertOne(postData);
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Create post error:', error);
    res.render('create-post', { 
      error: 'An error occurred while creating the post',
      success: null 
    });
  }
});

// Initialize server
async function startServer() {
  try {
    const conn = await connect();
    db = conn.db;
    client = conn.client;
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

startServer();
