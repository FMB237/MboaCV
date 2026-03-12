# CV Builder Platform

A simple, full-featured CV/Resume builder built with Flask, HTML/CSS/JS. Create professional resumes with multiple templates and export as PDF.

## Features

- **User Authentication**: Register, login, logout with secure password hashing
- **CV Editor**: Real-time preview with auto-save
- **Multiple Templates**: Modern, Classic, and Minimal designs
- **PDF Export**: Download your CV as a high-quality PDF
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Sections**: Personal info, Experience, Education, Skills, Languages, Projects

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLite
- **Frontend**: Bootstrap 5, Vanilla JavaScript
- **PDF Generation**: html2pdf.js (client-side)

## Project Structure

```
cv_platform/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/            # Jinja2 templates
│   ├── base.html        # Base layout
│   ├── landing.html     # Home page
│   ├── login.html       # Login page
│   ├── register.html    # Registration page
│   ├── dashboard.html   # User dashboard
│   ├── editor.html      # CV editor
│   └── templates/       # CV templates
│       ├── modern.html
│       ├── classic.html
│       └── minimal.html
└── static/              # Static assets
    ├── css/
    │   ├── style.css    # Main styles
    │   ├── editor.css   # Editor-specific styles
    │   └── templates/   # Template-specific styles
    │       ├── modern.css
    │       ├── classic.css
    │       └── minimal.css
    └── js/
        └── editor.js    # Editor functionality
```

## Installation

1. **Clone or download the project**:
```bash
cd cv_platform
```

2. **Create a virtual environment** (recommended):
```bash
python -m venv venv
```

3. **Activate the virtual environment**:

On macOS/Linux:
```bash
source venv/bin/activate
```

On Windows:
```bash
venv\Scripts\activate
```

4. **Install dependencies**:
```bash
pip install -r requirements.txt
```

## Running the Application

1. **Start the Flask server**:
```bash
python app.py
```

2. **Open your browser** and navigate to:
```
http://localhost:5000
```

3. **Register a new account** and start building your CV!

## Usage

1. **Register/Login**: Create an account or sign in
2. **Create CV**: Click "Create New CV" on the dashboard
3. **Choose Template**: Select from Modern, Classic, or Minimal
4. **Edit Content**: Fill in your personal info, experience, education, skills, etc.
5. **Preview**: See changes in real-time
6. **Download**: Export as PDF

## Template Styles

### Modern
- Clean gradient header
- Blue accent colors
- Skill tags with colored backgrounds
- Professional and contemporary

### Classic
- Traditional resume format
- Serif fonts (Times New Roman)
- Centered header
- Time-tested layout

### Minimal
- Simple and elegant
- Sans-serif fonts
- Lots of white space
- Focus on content

## Database

The application uses SQLite with the following tables:

- **User**: id, email, password_hash, full_name, created_at
- **CV**: id, user_id, title, template, content (JSON), created_at, updated_at
- **Template**: id, name, display_name, description, css_file, is_active

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page |
| GET/POST | `/register` | User registration |
| GET/POST | `/login` | User login |
| GET | `/logout` | User logout |
| GET | `/dashboard` | User dashboard |
| POST | `/cv/new` | Create new CV |
| GET | `/cv/<id>/edit` | Edit CV |
| POST | `/cv/<id>/save` | Save CV data |
| GET | `/cv/<id>/preview` | Preview CV |
| POST | `/cv/<id>/delete` | Delete CV |
| POST | `/cv/<id>/duplicate` | Duplicate CV |

## Customization

### Adding New Templates

1. Create a new HTML file in `templates/templates/`
2. Create a new CSS file in `static/css/templates/`
3. Add template to database via `init_templates()` in `app.py`

### Changing Colors

Edit the CSS files in `static/css/templates/` to customize colors.

## Security

- Passwords are hashed using Werkzeug
- CSRF protection via Flask-Login
- User data isolation (users can only access their own CVs)

## Development

To run in development mode with auto-reload:

```bash
FLASK_ENV=development python app.py
```

## Production Deployment

For production deployment:

1. Change `SECRET_KEY` in `app.py` to a secure random string
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Set up a reverse proxy (Nginx, Apache)
4. Use PostgreSQL instead of SQLite for production

Example with Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## License

MIT License - feel free to use this for personal or commercial projects.

## Credits

- Bootstrap 5: https://getbootstrap.com
- Font Awesome: https://fontawesome.com
- html2pdf.js: https://ekoopmans.github.io/html2pdf.js/
