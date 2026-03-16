from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cv_platform.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime, nullable=True)
    last_logout = db.Column(db.DateTime, nullable=True)

    # Relationship
    cvs = db.relationship('CV', backref='user', lazy=True, cascade='all, delete-orphan')
    activities = db.relationship('UserActivity', backref='user', lazy=True, cascade='all, delete-orphan')

class UserActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # 'login', 'logout', 'created', 'deleted'
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text, nullable=True)

class CV(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    template = db.Column(db.String(50), default='modern')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Stored as JSON string
    content = db.Column(db.Text, default='{}')

    def get_content(self):
        return json.loads(self.content) if self.content else {}

    def set_content(self, data):
        self.content = json.dumps(data)

class Template(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    css_file = db.Column(db.String(100), default='modern.css')
    is_active = db.Column(db.Boolean, default=True)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Admin required decorator
def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Admin access required.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Initialize default templates
def init_templates():
    templates = [
        {'name': 'modern', 'display_name': 'Modern', 'description': 'Clean and professional design', 'css_file': 'modern.css'},
        {'name': 'classic', 'display_name': 'Classic', 'description': 'Traditional resume style', 'css_file': 'classic.css'},
        {'name': 'minimal', 'display_name': 'Minimal', 'description': 'Simple and elegant', 'css_file': 'minimal.css'}
    ]
    for t in templates:
        if not Template.query.filter_by(name=t['name']).first():
            db.session.add(Template(**t))
    db.session.commit()

# Create initial admin user
def create_admin_user():
    admin_email = 'miguelfouenanf@gmail.com'
    if not User.query.filter_by(email=admin_email).first():
        admin = User(
            email=admin_email,
            password_hash=generate_password_hash('admin123'),
            full_name='Fouenang Miguel Bruce',
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print(f'Admin user created: {admin_email} / password: admin123')

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('landing.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        full_name = request.form.get('full_name', '').strip()

        if not email or not password or not full_name:
            flash('All fields are required.', 'error')
            return redirect(url_for('register'))

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return redirect(url_for('register'))

        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return redirect(url_for('register'))

        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            full_name=full_name
        )
        db.session.add(user)
        db.session.commit()

        # Log user creation
        activity = UserActivity(
            user_id=user.id,
            action='created',
            ip_address=request.remote_addr,
            details='Account created'
        )
        db.session.add(activity)
        db.session.commit()

        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        remember = request.form.get('remember', False)

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=remember)
            # Update last login and log activity
            user.last_login = datetime.utcnow()
            activity = UserActivity(
                user_id=user.id,
                action='login',
                ip_address=request.remote_addr,
                details='User logged in'
            )
            db.session.add(activity)
            db.session.commit()
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))

        flash('Invalid email or password.', 'error')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    # Log activity before logout
    activity = UserActivity(
        user_id=current_user.id,
        action='logout',
        ip_address=request.remote_addr,
        details='User logged out'
    )
    current_user.last_logout = datetime.utcnow()
    db.session.add(activity)
    db.session.commit()
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    cvs = CV.query.filter_by(user_id=current_user.id).order_by(CV.updated_at.desc()).all()
    templates = Template.query.filter_by(is_active=True).all()
    return render_template('dashboard.html', cvs=cvs, templates=templates)

@app.route('/cv/new', methods=['POST'])
@login_required
def create_cv():
    title = request.form.get('title', 'Untitled CV').strip()
    template = request.form.get('template', 'modern')

    # Default CV content structure
    default_content = {
        'personal': {
            'fullName': current_user.full_name,
            'email': current_user.email,
            'phone': '',
            'location': '',
            'website': '',
            'summary': '',
            'photo': None  # Profile picture URL
        },
        'experience': [],
        'education': [],
        'skills': [],
        'languages': [],
        'projects': []
    }

    cv = CV(
        user_id=current_user.id,
        title=title,
        template=template
    )
    cv.set_content(default_content)
    db.session.add(cv)
    db.session.commit()

    return redirect(url_for('edit_cv', cv_id=cv.id))

@app.route('/cv/<int:cv_id>/edit')
@login_required
def edit_cv(cv_id):
    cv = CV.query.get_or_404(cv_id)
    if cv.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))

    templates = Template.query.filter_by(is_active=True).all()
    return render_template('editor.html', cv=cv, content=cv.get_content(), templates=templates)

@app.route('/cv/<int:cv_id>/save', methods=['POST'])
@login_required
def save_cv(cv_id):
    cv = CV.query.get_or_404(cv_id)
    if cv.user_id != current_user.id:
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    data = request.get_json()
    cv.set_content(data)
    cv.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'success': True, 'updated_at': cv.updated_at.isoformat()})

@app.route('/cv/<int:cv_id>/preview')
@login_required
def preview_cv(cv_id):
    cv = CV.query.get_or_404(cv_id)
    if cv.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))

    content = cv.get_content()
    return render_template(f'templates/{cv.template}.html', cv=cv, content=content, preview=True)

@app.route('/cv/<int:cv_id>/delete', methods=['POST'])
@login_required
def delete_cv(cv_id):
    cv = CV.query.get_or_404(cv_id)
    if cv.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))

    db.session.delete(cv)
    db.session.commit()
    flash('CV deleted successfully.', 'success')
    return redirect(url_for('dashboard'))

@app.route('/cv/<int:cv_id>/duplicate', methods=['POST'])
@login_required
def duplicate_cv(cv_id):
    original = CV.query.get_or_404(cv_id)
    if original.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))

    new_cv = CV(
        user_id=current_user.id,
        title=f"{original.title} (Copy)",
        template=original.template,
        content=original.content
    )
    db.session.add(new_cv)
    db.session.commit()

    return redirect(url_for('edit_cv', cv_id=new_cv.id))

# API endpoints for autosave
@app.route('/api/cv/<int:cv_id>', methods=['GET'])
@login_required
def get_cv_data(cv_id):
    cv = CV.query.get_or_404(cv_id)
    if cv.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403

    return jsonify({
        'id': cv.id,
        'title': cv.title,
        'template': cv.template,
        'content': cv.get_content(),
        'updated_at': cv.updated_at.isoformat()
    })

@app.route('/api/templates')
def get_templates():
    templates = Template.query.filter_by(is_active=True).all()
    return jsonify([{
        'name': t.name,
        'display_name': t.display_name,
        'description': t.description
    } for t in templates])

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/cv/<int:cv_id>/upload-photo', methods=['POST'])
@login_required
def upload_photo(cv_id):
    cv = CV.query.get_or_404(cv_id)
    if cv.user_id != current_user.id:
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    if 'photo' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    file = request.files['photo']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        # Create user-specific folder
        user_folder = os.path.join(app.config['UPLOAD_FOLDER'], f'user_{current_user.id}')
        os.makedirs(user_folder, exist_ok=True)

        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f'cv_{cv_id}_photo.{ext}'
        filepath = os.path.join(user_folder, filename)

        # Remove old photo if exists
        content = cv.get_content()
        if content.get('personal', {}).get('photo'):
            old_photo = os.path.join(app.root_path, content['personal']['photo'].lstrip('/'))
            if os.path.exists(old_photo):
                os.remove(old_photo)

        # Save new photo
        file.save(filepath)

        # Update CV content with photo URL
        if 'personal' not in content:
            content['personal'] = {}
        content['personal']['photo'] = f'/static/uploads/user_{current_user.id}/{filename}'
        cv.set_content(content)
        db.session.commit()

        return jsonify({
            'success': True,
            'photo_url': content['personal']['photo']
        })

    return jsonify({'success': False, 'error': 'Invalid file type'}), 400

@app.route('/cv/<int:cv_id>/remove-photo', methods=['POST'])
@login_required
def remove_photo(cv_id):
    cv = CV.query.get_or_404(cv_id)
    if cv.user_id != current_user.id:
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    content = cv.get_content()
    if content.get('personal', {}).get('photo'):
        # Delete file
        photo_path = os.path.join(app.root_path, content['personal']['photo'].lstrip('/'))
        if os.path.exists(photo_path):
            os.remove(photo_path)

        # Remove from content
        content['personal']['photo'] = None
        cv.set_content(content)
        db.session.commit()

    return jsonify({'success': True})

# Admin Routes
@app.route('/admin')
@admin_required
def admin_dashboard():
    total_users = User.query.count()
    total_cvs = CV.query.count()
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    recent_activities = UserActivity.query.order_by(UserActivity.timestamp.desc()).limit(10).all()
    return render_template('admin/dashboard.html',
                         total_users=total_users,
                         total_cvs=total_cvs,
                         recent_users=recent_users,
                         recent_activities=recent_activities)

@app.route('/admin/users')
@admin_required
def admin_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=users)

@app.route('/admin/user/<int:user_id>')
@admin_required
def admin_user_detail(user_id):
    user = User.query.get_or_404(user_id)
    activities = UserActivity.query.filter_by(user_id=user_id).order_by(UserActivity.timestamp.desc()).all()
    return render_template('admin/user_detail.html', user=user, activities=activities)

@app.route('/admin/user/<int:user_id>/toggle-admin', methods=['POST'])
@admin_required
def admin_toggle_admin(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash('Cannot modify your own admin status.', 'error')
        return redirect(url_for('admin_user_detail', user_id=user_id))
    user.is_admin = not user.is_admin
    activity = UserActivity(
        user_id=user.id,
        action='admin_toggled',
        ip_address=request.remote_addr,
        details=f'Admin status changed to {user.is_admin} by {current_user.full_name}'
    )
    db.session.add(activity)
    db.session.commit()
    flash(f'User {user.full_name} admin status updated.', 'success')
    return redirect(url_for('admin_user_detail', user_id=user_id))

@app.route('/admin/user/<int:user_id>/delete', methods=['POST'])
@admin_required
def admin_delete_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash('Cannot delete your own account.', 'error')
        return redirect(url_for('admin_users'))
    # Log deletion before deleting
    activity = UserActivity(
        user_id=user.id,
        action='deleted',
        ip_address=request.remote_addr,
        details=f'User deleted by admin {current_user.full_name}'
    )
    db.session.add(activity)
    db.session.commit()
    db.session.delete(user)
    db.session.commit()
    flash(f'User {user.full_name} has been deleted.', 'success')
    return redirect(url_for('admin_users'))

@app.route('/admin/activities')
@admin_required
def admin_activities():
    activities = UserActivity.query.order_by(UserActivity.timestamp.desc()).all()
    return render_template('admin/activities.html', activities=activities)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        init_templates()
        create_admin_user()
    app.run(debug=True, port=5000)
