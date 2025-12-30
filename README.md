# 🍳 FridgeChef - The Anti-Food Waste App

> Your AI-powered cooking companion that helps reduce food waste, one recipe at a time.

![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 📖 Overview

**Fridge Chef** is a full-stack web application that tackles food waste by helping users cook with what they already have. Using AI-powered ingredient detection and intelligent recipe generation, FridgeChef makes it easy to turn pantry items into delicious meals while tracking your environmental impact.

### 🌟 Key Features

- **📷 AI Ingredient Detection** - Upload a photo of your fridge/pantry, and Gemini Vision AI identifies ingredients
- **🤖 Smart Recipe Generation** - Two modes:
  - **Cook Now:** Recipes using only available ingredients
  - **Gap Analysis:** Recipes needing 1-2 extra items (with shopping list integration)
- **👤 Personalized Profiles** - Set allergies, dietary restrictions, skill level, and cuisine preferences
- **📚 Recipe History** - Track all cooked recipes with ratings, notes, and timestamps
- **❤️ Favorites** - Save and organize your favorite recipes
- **🛒 Smart Shopping List** - Auto-generated from missing ingredients, with check-off functionality
- **📊 Analytics Dashboard** - Interactive charts showing:
  - Monthly cooking trends
  - Cuisine distribution
  - Sustainability metrics
- **🌍 Sustainability Tracking** - See how much food waste and CO₂ you've saved

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication
- **Gemini AI / Groq Api** - Vision & text models for ingredient detection and recipe generation
- **Multer** - Image upload handling
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Icon library

---

## 📂 Project Structure

```
FridgeChef/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/            # Database, Multer config
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth middleware
│   │   ├── utils/             # Helper functions (Gemini, sustainability)
│   │   └── server.js          # Express app entry point
│   ├── uploads/               # Uploaded images
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React Context (Auth)
│   │   ├── services/          # API service layer
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── public/
│   ├── package.json
│   └── index.html
│
└── Documentation/              # Phase-by-phase explanations
    ├── PHASE_1_EXPLANATION.md
    ├── PHASE_2_EXPLANATION.md
    ├── ...
    └── PHASE_8_EXPLANATION.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **Gemini API Key** - Each user provides their own ([Get free key](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd FridgeChef
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and add your credentials
   npm run dev
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

<!-- ## 📸 Screenshots

### Home Dashboard
Beautiful home page with quick stats and sustainability metrics.

### Ingredient Detection
Upload a photo and let AI identify your ingredients.

### Recipe Generation
Get 3 recipe options based on your available ingredients.

### Shopping List
Manage missing ingredients with check-off functionality.

### Analytics Dashboard
Track your cooking progress with interactive charts.

--- -->

## 🎯 Core Workflows

### 1. First-Time User Flow
```
Register → Set Profile (allergies, diet) → Add Gemini API Key →
Upload Photo → Detect Ingredients → Generate Recipes →
Save Favorite → Check Dashboard
```

### 2. Cooking Flow
```
Upload Fridge Photo → Review Detected Ingredients →
Choose Mode (Cook Now / Gap Analysis) → Browse Recipe Cards →
Select Recipe → View Full Recipe → Save to History →
Rate & Add Notes
```

### 3. Shopping Flow
```
Generate Recipe (Gap Analysis) → Missing Ingredients Detected →
Auto-Added to Shopping List → Go Shopping → Check Off Items →
Clear Purchased
```

---

## 🔒 Security Features

### User API Key Management
- **User-Provided Keys:** Each user provides their own Gemini API key for AI features
- **AES-256-GCM Encryption:** All API keys encrypted before database storage
- **Never Exposed:** Keys never returned to frontend after storage
- **Validation:** Backend validates keys before storage with test API call
- **No Logging:** API keys never appear in logs or error messages

### Authentication
- **JWT Tokens:** Secure authentication with 30-day expiration
- **Password Hashing:** bcryptjs with salting
- **Protected Routes:** All sensitive endpoints require authentication

See [API_KEY_SECURITY.md](./API_KEY_SECURITY.md) for detailed security documentation.

---

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/FridgeChef
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d
# REQUIRED: Encryption secret for user API keys
ENCRYPTION_SECRET=generate_with_crypto_randomBytes_32_hex
# OPTIONAL: Fallback API key for development (users provide their own in production)
GEMINI_API_KEY=
FRONTEND_URL=http://localhost:5173
```

**Important:**
- Users provide their own Gemini API keys via Profile settings
- `ENCRYPTION_SECRET` is required for encrypting stored API keys
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Frontend (Vite Proxy)
Vite automatically proxies `/api` and `/uploads` to the backend, no additional config needed.

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update preferences
- `PUT /api/profile/account` - Update name/email
- `POST /api/profile/api-key` - Set/update Gemini API key
- `GET /api/profile/api-key/status` - Check if API key configured
- `POST /api/profile/api-key/validate` - Validate stored API key
- `DELETE /api/profile/api-key` - Remove API key

### Ingredients
- `POST /api/ingredients/detect` - Upload image and detect ingredients
- `GET /api/ingredients/history` - Get detection history
- `GET /api/ingredients/detection/:id` - Get single detection

### Recipes
- `POST /api/recipes/generate` - Generate multiple recipes
- `POST /api/recipes/generate-one` - Generate single recipe

### History
- `GET /api/history` - Get recipe history (with pagination)
- `POST /api/history` - Save recipe to history
- `GET /api/history/favorites` - Get favorite recipes
- `GET /api/history/:id` - Get single recipe
- `PUT /api/history/:id` - Update recipe (rating, notes)
- `DELETE /api/history/:id` - Delete recipe
- `PATCH /api/history/:id/favorite` - Toggle favorite

### Shopping List
- `GET /api/shopping` - Get shopping list
- `POST /api/shopping` - Add items
- `PUT /api/shopping/item/:itemId` - Update item
- `DELETE /api/shopping/item/:itemId` - Delete item
- `DELETE /api/shopping/purchased` - Clear purchased items
- `DELETE /api/shopping/all` - Clear all items

### Dashboard
- `GET /api/dashboard` - Get complete dashboard data
- `GET /api/dashboard/sustainability` - Get sustainability metrics only

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🧪 Testing

### Manual Testing
1. Register a new account
2. Set profile preferences (allergies, dietary restrictions)
3. Upload a test image of food
4. Generate recipes and save one
5. Rate the recipe and add notes
6. Check dashboard for updated stats
7. Add items to shopping list
8. Mark items as purchased

### Test Images
Use images with clear, identifiable food items:
- Well-lit photos
- Multiple ingredients visible
- Common pantry items work best

---

## 🌍 Sustainability Calculations

FridgeChef estimates environmental impact based on:

- **Food Saved:** ~0.2 kg per ingredient used
- **CO₂ Saved:** ~0.5 kg per ingredient (production + waste emissions)

These are conservative estimates. Actual impact varies by ingredient type.

---

## 🔒 Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **JWT Authentication:** 30-day expiration (configurable)
- **Input Validation:** Server-side validation on all inputs
- **File Upload Limits:** 5MB max, images only
- **CORS Protection:** Configured for frontend origin
- **MongoDB Injection Prevention:** Mongoose schema validation

---

## 🚢 Deployment

### Backend Deployment (Railway, Render, Heroku)
1. Set environment variables on platform
2. Connect MongoDB Atlas
3. Deploy from GitHub
4. Update `FRONTEND_URL` in .env

### Frontend Deployment (Vercel, Netlify)
1. Update `api.js` with production backend URL
2. Deploy from GitHub
3. Set environment variables if needed

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Ingredient detection not working
- **Solution:** Check Gemini API key is valid
- Ensure image is < 5MB and supported format

**Issue:** Recipes not respecting dietary restrictions
- **Solution:** Verify profile settings are saved
- Check backend logs for AI response

**Issue:** MongoDB connection failed
- **Solution:** Verify MongoDB is running (local) or connection string (Atlas)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Google Gemini AI** - For powering ingredient detection and recipe generation
- **Recharts** - For beautiful, responsive charts
- **Tailwind CSS** - For rapid UI development
- **Lucide React** - For clean, modern icons

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

## 🎯 Future Enhancements

Potential features for future versions:
- 🔄 Swipe UI for recipe selection (Tinder-style)
- 📱 Mobile app (React Native)
- 🗣️ Voice commands for hands-free cooking
- 🌐 Multi-language support
- 👥 Social features (share recipes)
- 🎥 Video instructions
- 🏪 Grocery store integration
- 📊 Nutrition information
- 🎨 Recipe photos
- 💬 Community comments

---

<div align="center">

**Built with ❤️ to fight food waste**

⭐ Star this repo if you found it helpful!

</div>
