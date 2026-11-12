// Express creates the web server and lets us define API routes.
const express = require('express');
// CORS allows a frontend running on another local port to call this API.
const cors = require('cors');
// JWT creates and checks the login token used by protected routes.
const jwt = require('jsonwebtoken');

const app = express();
// In production, store this in an environment variable instead of in source code.
const SECRET = 'change-this-secret';

// Allow the frontend at this address to make requests to the API.
app.use(cors({ origin: 'http://localhost:4200' })); // must be before routes
// Parse incoming JSON request bodies so routes can read req.body.
app.use(express.json());

// Example in-memory user data for the user API routes below.
// This resets whenever the server restarts; it is not a database.
let users = [
    { id: 1, name: 'Mahek', email: 'mahek@test.com', phone: '9999999991' },
    { id: 2, name: 'Rahul', email: 'manali@test.com', phone: '9999999992' },
];
let nextId = 3;

// Middleware: check for a valid bearer token before protected routes run.
function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Token missing' });

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// Simple route to confirm that the server is reachable.
app.get('/hello', (req, res) => res.json({ message: 'Hello from Express' }));

// Public login route: the frontend sends { email, password } as JSON.
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@test.com' && password === '123456') {
        // For these demo credentials, return a token that lasts one hour.
        // The frontend should save it and send it as Authorization: Bearer <token>.
        const token = jwt.sign({ email }, SECRET, { expiresIn: '1h' });
        return res.json({ token });
    }
    res.status(401).json({ message: 'Invalid email or password' });
});

// Protected routes: each one runs auth first and needs a valid login token.
app.get('/api/users', auth, (req, res) => res.json(users));

app.get('/api/users/:id', auth, (req, res) => {
    const user = users.find(u => u.id === Number(req.params.id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

app.post('/api/users', auth, (req, res) => {
    const user = { id: nextId++, ...req.body };
    users.push(user);
    res.status(201).json(user);
});

app.put('/api/users/:id', auth, (req, res) => {
    const index = users.findIndex(u => u.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'User not found' });
    users[index] = { ...users[index], ...req.body, id: users[index].id };
    res.json(users[index]);
});

app.delete('/api/users/:id', auth, (req, res) => {
    users = users.filter(u => u.id !== Number(req.params.id));
    res.status(204).send();
});

app.listen(3000, (err) => {
    if (err) return console.error('Failed to start:', err.message);
    console.log('API running on http://localhost:3000');
});
