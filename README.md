# JobPilot.AI - Career Intelligence Platform

A comprehensive MERN full-stack application for intelligent job matching, resume optimization, and career management, powered by Google's Gemini models.

## Features

- **AI-Powered Job Matching**: Intelligent matching algorithm based on skills, experience, and career preferences
- **ATS Score Optimization**: Resume analysis with actionable feedback for ATS compatibility
- **Resume Builder**: Full-featured resume editor with PDF export and content parsing
- **Application Tracking**: Track job applications and interview progress
- **Dashboard Analytics**: Real-time insights into job matches and career metrics
- **Responsive Design**: Mobile-first design with complete mobile support

## Tech Stack

**Frontend:**
- React 19 with Vite
- React Router for navigation
- Zustand for state management
- React Query for data fetching
- Tailwind CSS for styling
- React Hook Form + Zod for validation
- Recharts for data visualization

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT authentication with bcryptjs
- Multer for file uploads
- PDF and DOCX parsing

## Project Structure

```
jobpilot-ai/
├── src/                    # Frontend source
│   ├── components/        # Reusable UI components
│   ├── pages/            # Application pages
│   ├── store/            # Zustand state management
│   ├── styles/           # Global styles
│   └── main.jsx          # React entry point
├── server/               # Backend source
│   ├── src/
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth & validation
│   │   ├── services/     # Business logic
│   │   └── index.js      # Server entry
│   └── uploads/          # Resume file storage
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies
```

## Getting Started

### Prerequisites
- Node.js 16+
- pnpm (or npm/yarn)
- MongoDB (local or Atlas connection string)

### Installation

1. **Clone and install dependencies:**
```bash
pnpm install
```

2. **Configure environment variables:**
Create a `.env` file in the project root:
```env
VITE_API_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/jobpilot
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=3001
```

3. **Start MongoDB:**
```bash
# Using local MongoDB
mongod

# Or using MongoDB Atlas (update MONGODB_URI in .env)
```

### Running the Application

**Development Mode (both frontend and backend):**

In one terminal, start the frontend dev server:
```bash
pnpm dev
```

In another terminal, start the backend server:
```bash
pnpm server:dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

**Production Build:**
```bash
pnpm build
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile

### Resume
- `GET /resume` - List user's resumes
- `GET /resume/:id` - Get specific resume
- `POST /resume/upload` - Upload and parse resume
- `PUT /resume/:id` - Update resume
- `DELETE /resume/:id` - Delete resume

### Jobs
- `GET /jobs` - List all jobs with filters
- `GET /jobs/:id` - Get job details with match analysis
- `POST /jobs` - Create new job (admin)
- `POST /jobs/:id/apply` - Apply to job
- `GET /jobs/user/applications` - List user applications

## Key Features Explained

### ATS Scoring Algorithm
The ATS scoring system evaluates:
- Personal information completeness (10 points)
- Work experience details (25 points)
- Education information (15 points)
- Skills comprehensiveness (25 points)
- Certifications and projects (15 points)
- Technical keywords presence (10 points)

### Job Matching Algorithm
Matches profiles based on:
- Skill overlap analysis (50% weight)
- Years of experience comparison (25% weight)
- Educational background (25% weight)

Results are displayed as match percentages with detailed skill overlap and gap analysis.

### Resume Parsing
Supports parsing of:
- PDF files (using pdf-parse)
- DOCX files (using mammoth)
- Plain text files

Extracts and structures:
- Contact information
- Work experience
- Education
- Skills
- Certifications
- Projects

## Authentication Flow

1. User signs up/logs in with email and password
2. Server validates credentials and generates JWT token
3. Token stored in localStorage (client-side)
4. Token included in Authorization header for protected requests
5. Server validates token middleware on protected routes

## Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  location: String,
  currentRole: String,
  yearsExperience: Number,
  skills: [String],
  resumeId: ObjectId,
  atsScore: Number,
  jobMatches: Array,
  notificationPreferences: Object
}
```

### Resume
```javascript
{
  userId: ObjectId,
  personalInfo: Object,
  summary: String,
  workExperience: Array,
  education: Array,
  skills: [String],
  certifications: Array,
  atsScore: Object,
  extractedContent: Object,
  fileName: String
}
```

### Job
```javascript
{
  title: String,
  company: String,
  location: String,
  locationType: String,
  description: String,
  requiredSkills: [String],
  preferredSkills: [String],
  salary: Object,
  experience: Object,
  applicants: Array,
  isActive: Boolean
}
```

## Deployment

### Frontend (Vercel)
```bash
# Deploy frontend to Vercel
vercel deploy
```

### Backend (Render)
```bash
# Deploy backend to Render
# Push to GitHub and connect repository to Render
```

## Development Notes

- The application uses heuristic-based matching instead of complex AI to keep it lightweight and maintainable
- Resume parsing is basic; production implementations would use more advanced ML-based extraction
- All dummy data is seeded on server startup
- File uploads are stored in `server/uploads/` directory

## Future Enhancements

- Email notifications for job matches
- Advanced resume templates
- Interview scheduling integration
- Salary negotiation guidance
- LinkedIn profile integration
- Real-time job recommendations
- Interview preparation materials

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
