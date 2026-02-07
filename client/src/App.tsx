import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import useAuth here

import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Write from './pages/Write';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/Admin/AdminLayout';
import UserManagement from './pages/Admin/UserManagement';
import PostManagement from './pages/Admin/PostManagement';
import AdminRoute from './components/AdminRoute';

// 错误边界组件
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 保护路由组件：如果未登录则跳转到登录页
const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>加载中...</div>;
  
  return user ? <Outlet /> : <Navigate to="/login" />;
};

// 导航栏组件
const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const linkStyle = (path: string) => ({
    textDecoration: 'none', 
    color: isActive(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: isActive(path) ? 600 : 400,
    transition: 'all 0.2s ease',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--btn-radius)',
    backgroundColor: isActive(path) ? 'var(--bg-tertiary)' : 'transparent',
  });

  return (
    <nav style={{ 
      padding: '0 2rem', 
      height: 'var(--nav-height)',
      borderBottom: '1px solid var(--border-color)', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      backgroundColor: 'rgba(5, 5, 5, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ fontWeight: '800', fontSize: '1.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Trae Blog</Link>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Link to="/" style={linkStyle('/')}>首页</Link>
        {user ? (
          <>
            <Link to="/write" style={linkStyle('/write')}>写文章</Link>
            <Link to="/profile" style={linkStyle('/profile')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user.username || '').charAt(0).toUpperCase()
                  )}
                </div>
                {user.username}
                {user.role === 'admin' && <span style={{ fontSize: '10px', backgroundColor: '#fbbf24', color: 'black', padding: '2px 4px', borderRadius: '4px' }}>Admin</span>}
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle('/login')}>登录</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '6px 16px', textDecoration: 'none', color: 'white' }}>注册</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            <div className="content" style={{ minHeight: 'calc(100vh - var(--nav-height) - 60px)' }}>
              <Routes>
                {/* 公开路由 */}
                <Route path="/" element={<Home />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 受保护路由 */}
                <Route element={<PrivateRoute />}>
                  <Route path="/write" element={<Write />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* 管理员路由 */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="users" element={<UserManagement />} />
                    <Route path="posts" element={<PostManagement />} />
                  </Route>
                </Route>
              </Routes>
            </div>
            <footer style={{ 
              textAlign: 'center', 
              padding: '20px', 
              borderTop: '1px solid var(--border-color)', 
              color: 'var(--text-tertiary)',
              fontSize: '0.9rem',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              © 2026 Trae Blog. Powered by AI.
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
