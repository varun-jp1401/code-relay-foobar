import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/context/AuthContext';
import { useTheme } from '../modules/context/ThemeContext';
import { 
    CheckCircle2, 
    BarChart3, 
    Users, 
    Zap, 
    Shield, 
    Clock,
    ArrowRight,
    LayoutDashboard,
    FolderKanban,
    Moon,
    Sun
} from 'lucide-react';

export default function Landing() {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Redirect authenticated users to dashboard
    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const features = [
        {
            icon: LayoutDashboard,
            title: 'Smart Dashboard',
            description: 'Get real-time insights with interactive charts and analytics'
        },
        {
            icon: FolderKanban,
            title: 'Project Management',
            description: 'Organize work into workspaces and projects with ease'
        },
        {
            icon: Users,
            title: 'Team Collaboration',
            description: 'Work together seamlessly with role-based access control'
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Track progress with detailed statistics and reports'
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Built for speed with optimized performance'
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'Your data is encrypted and protected'
        }
    ];

    const stats = [
        { value: '10K+', label: 'Active Users' },
        { value: '50K+', label: 'Tasks Completed' },
        { value: '99.9%', label: 'Uptime' },
        { value: '24/7', label: 'Support' }
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav glass">
                <div className="nav-container">
                    <div className="nav-logo">
                        <h1>Task<span className="text-primary">Nexus</span></h1>
                    </div>
                    <div className="nav-actions">
                        <button 
                            onClick={toggleTheme} 
                            className="theme-toggle-btn"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link to="/login" className="btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn-primary">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content fade-in">
                    <div className="hero-badge">
                        <Clock size={14} />
                        <span>Plan. Track. Succeed.</span>
                    </div>
                    <h1 className="hero-title">
                        Manage Your Tasks
                        <br />
                        <span className="text-gradient">Like Never Before</span>
                    </h1>
                    <p className="hero-description">
                        The ultimate project management tool that helps teams collaborate, 
                        track progress, and achieve goals faster. Built for modern teams.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn-primary btn-lg">
                            Start Free Trial <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn-ghost btn-lg">
                            Sign In
                        </Link>
                    </div>
                    <div className="hero-stats">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Hero Visual */}
                <div className="hero-visual fade-in-up">
                    <div className="dashboard-preview glass">
                        <div className="preview-header">
                            <div className="preview-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <div className="preview-title">Dashboard Overview</div>
                        </div>
                        <div className="preview-content">
                            <div className="preview-stats">
                                <div className="preview-stat-card">
                                    <CheckCircle2 size={20} color="#10B981" />
                                    <div>
                                        <div className="preview-stat-value">24</div>
                                        <div className="preview-stat-label">Completed</div>
                                    </div>
                                </div>
                                <div className="preview-stat-card">
                                    <Clock size={20} color="#F59E0B" />
                                    <div>
                                        <div className="preview-stat-value">8</div>
                                        <div className="preview-stat-label">In Progress</div>
                                    </div>
                                </div>
                            </div>
                            <div className="preview-chart">
                                <div className="chart-bar" style={{ height: '60%' }}></div>
                                <div className="chart-bar" style={{ height: '85%' }}></div>
                                <div className="chart-bar" style={{ height: '45%' }}></div>
                                <div className="chart-bar" style={{ height: '70%' }}></div>
                                <div className="chart-bar" style={{ height: '90%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Everything You Need</h2>
                    <p>Powerful features to supercharge your productivity</p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card glass fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="feature-icon">
                                <feature.icon size={24} />
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content glass">
                    <h2>Ready to Get Started?</h2>
                    <p>Join thousands of teams already using TaskNexus</p>
                    <Link to="/register" className="btn-primary btn-lg">
                        Create Free Account <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>Task<span className="text-primary">Nexus</span></h3>
                        <p>© 2026 TaskNexus. All rights reserved.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#updates">Updates</a>
                        </div>
                        <div className="footer-column">
                            <h4>Company</h4>
                            <a href="#about">About</a>
                            <a href="#blog">Blog</a>
                            <a href="#careers">Careers</a>
                        </div>
                        <div className="footer-column">
                            <h4>Support</h4>
                            <a href="#help">Help Center</a>
                            <a href="#contact">Contact</a>
                            <a href="#status">Status</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
