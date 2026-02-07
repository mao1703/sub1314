import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/users', label: '用户管理' },
    { path: '/admin/posts', label: '文章管理' },
  ];

  return (
    <div className="container" style={{ paddingTop: '20px', display: 'flex', gap: '20px', minHeight: '80vh' }}>
      {/* 侧边栏 */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        <div className="card" style={{ padding: '20px', height: '100%' }}>
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            后台管理
          </h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--btn-radius)',
                  textDecoration: 'none',
                  color: location.pathname === item.path ? 'white' : 'var(--text-secondary)',
                  backgroundColor: location.pathname === item.path ? 'var(--accent-primary)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1 }}>
        <div className="card" style={{ padding: '30px', minHeight: '100%' }}>
           <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
