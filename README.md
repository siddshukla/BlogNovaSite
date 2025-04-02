# BlogNova

A powerful and flexible blog management system built with Node.js and Express.

## Overview

BlogNova is a full-featured backend solution for creating and managing blog content. Built on Node.js with Express, this project provides a robust foundation for blog applications with user authentication, content management, and a clean templating system using EJS.

## Features

- **User Authentication**: Secure login and registration system
- **Authorization**: Role-based access control for different user types
- **Session Management**: Persistent user sessions
- **Blog Post Management**: Create, read, update, and delete blog posts
- **Comment System**: Allow users to engage with content
- **Responsive Design**: Mobile-friendly interface built with CSS
- **RESTful API**: Well-structured endpoints for easy integration with frontend applications

## Tech Stack

- **Backend**: Node.js, Express.js
- **View Engine**: EJS (Embedded JavaScript)
- **Database**: [Your Database Choice - e.g., MongoDB, MySQL, PostgreSQL]
- **Authentication**: Passport.js/JWT/Custom Authentication
- **Session Management**: express-session
- **API Testing**: Postman
- **Styling**: CSS

## Prerequisites

- Node.js (v14.x or higher)
- NPM (v6.x or higher)
- [Your Database] installed and running

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/blognova.git
   cd blognova
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   PORT=3000
   DB_URI=your_database_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Start the development server:
   ```
   npm run dev
   ```
   
   This will start the server using nodemon, which will automatically restart when you make changes.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive authentication token
- `GET /api/auth/logout` - Logout and invalidate session

### Blog Posts
- `GET /api/posts` - Get all blog posts
- `GET /api/posts/:id` - Get a specific blog post
- `POST /api/posts` - Create a new blog post (Authentication required)
- `PUT /api/posts/:id` - Update a blog post (Authentication required)
- `DELETE /api/posts/:id` - Delete a blog post (Authentication required)

### User Management
- `GET /api/users/profile` - Get current user profile (Authentication required)
- `PUT /api/users/profile` - Update user profile (Authentication required)

## Project Structure

```
blognova/
│
├── app.js                  # Application entry point
├── config/                 # Configuration files
├── controllers/            # Route controllers
├── middlewares/            # Custom middlewares
├── models/                 # Database models
├── routes/                 # API routes
├── views/                  # EJS templates
│   ├── partials/           # Reusable template parts
│   ├── layouts/            # Page layouts
│   └── pages/              # Individual page templates
├── public/                 # Static assets
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   └── images/             # Image assets
└── tests/                  # Test suites
```

## Usage with Postman

1. Import the provided Postman collection (`BlogNova.postman_collection.json`) 
2. Set up your environment variables in Postman
3. Use the collection to test all API endpoints

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | The port on which the server will run |
| DB_URI | Database connection string |
| SESSION_SECRET | Secret used to sign the session cookie |
| NODE_ENV | Environment mode (development, production) |

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Authentication Flow

BlogNova implements a secure authentication system with the following flow:
1. User registers with email and password
2. Passwords are hashed before storage
3. On login, user receives a session token
4. Protected routes verify the session token
5. Role-based permissions control access to resources

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Express.js team for the excellent web framework
- EJS maintainers for the powerful templating engine
- All open-source contributors whose libraries made this project possible
