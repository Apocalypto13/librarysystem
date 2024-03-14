const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const user = { id: 123, username: 'example' };
const token = jwt.sign(user, 'your-secret-key', { expiresIn: '1h' });
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'library'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});



// REGISTER USER ACCOUNTS
app.post('/register', (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  // Check if the passwords match
  // if (password !== confirm_password) {
  //   return res.status(400).json({ message: 'Passwords do not match' });
  // }

  // Hash the password using bcrypt
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ message: 'Error registering user' });
    }
    // Store the hashed password in your database
    const query = `INSERT INTO accounts (name, email, password) VALUES (?, ?, ?)`;
    connection.query(query, [name, email, hash], (error, results) => {
      if (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'Error registering user' });
      }
      res.json({ message: 'User registered successfully' });
    });
  });
});
// LOGIN ACCOUNTS
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT * FROM accounts WHERE email = ?`;
  connection.query(query, [email], (error, results) => {
    if (error) {
      console.error('Error querying database:', error);
      return res.status(500).json({ message: 'Error logging in' });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = results[0];
    // Compare the provided password with the hashed password in the database
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      // User authenticated successfully, issue JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, 'your_secret_key', { expiresIn: '1h' });
      res.json({ message: 'Login successful', token });
    });
  });
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
