# ⚖️ LexAI — Premium AI Legal Assistant 

**LexAI** is a Next-Generation AI-powered legal guidance platform designed to demystify Indian law. By leveraging the fast inference of the **Groq API**, LexAI provides plain-english breakdowns of complex legal queries, actionable next steps, and document context analysis, all wrapped within a premium *Glassmorphism* user interface.

*(Built as a portfolio project demonstrating full-stack architecture, clean UI/UX, and LLM orchestration).*


---

## ✨ Key Features
- **🧠 Instant Legal Explanations:** Ask any legal question (e.g., Eviction laws, contract breaches) and get structured advice citing applicable Acts.
- **📄 Document Analysis (Multimodal):** Upload legal documents securely and perform context-aware chat analysis natively.
- **🔒 Secure Authentication:** Fully custom JWT-based authentication system ensuring privacy of session data.
- **🗂️ Persistent Consultation History:** Automatically saves and retrieves your past legal queries.
- **🖨️ PDF Generation:** Export any AI-generated legal report directly to a formatted PDF.
- **🎨 Premium UI/UX:** Built with a "Modern SaaS" aesthetic featuring animated glassmorphism panels, interactive typing indicators, and seamless page routing (No page refreshing).

---

## 🛠️ Technology Stack
- **Backend:** Django, Django REST Framework, SimpleJWT
- **Database:** SQLite (Development) / PostgreSQL Ready 
- **Frontend:** Vanilla JS, HTML5, Vanilla CSS (Zero CSS frameworks for maximum control)
- **AI/LLM Engine:** Groq API (Running blazing fast open-source models)
- **Utilities:** `jsPDF` for client-side document generation, `marked.js` for markdown parsing, `Lucide` icons.

---

## 🚀 Running LexAI Locally

### 1. Clone the Repository
```bash
git clone https://github.com/athulyakrishna853/lexai.git
cd lexai
```

### 2. Set up the Environment
Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Provide API Keys
Create a `.env` file in the root directory (where `manage.py` is located) and add your Groq API key:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 5. Run Migrations & Start Server
```bash
# Initialize the database
python manage.py migrate

# Boot up the development server
python manage.py runserver
```

**Access the application at:** `http://localhost:8000/`

---

## 📸 Project Gallery
*Add screenshots of your application here before you share your portfolio!*
- `Landing Page Screenshot`
- `Auth Interface Screenshot`
- `Chat & Document Upload Screenshot`

*(Check the demo flow locally for a full look at the platform).*

---

## 🚧 Roadmap / Future Improvments
- [ ] Connect users with verified regional lawyers (Premium Tier).
- [ ] Implement RAG (Retrieval-Augmented Generation) mapping to the formal Indian Bare Acts.
- [ ] OAuth integration (Google & GitHub login).

---

**Disclaimer:** LexAI provides AI-generated guidance and is **not** a substitute for formal, professional legal advice. Users are strongly encouraged to consult human law professionals before taking actionable legal steps.