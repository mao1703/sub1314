import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const AdminRoute = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        // 虽然 user 对象里可能还没更新 role 字段（取决于登录接口），
        // 但我们可以尝试调用一个 admin 接口来验证
        try {
          await api.get('/admin/users'); // 尝试访问受保护的 admin 接口
          setIsAdmin(true);
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    if (!loading) {
      if (!user) {
        setIsAdmin(false);
      } else {
        // 如果 user 对象里已经有 role 且是 admin，直接通过
        // 但目前 User 接口定义里还没加 role，且后端登录返回的可能也没有
        // 所以最稳妥的是请求一次后端
        checkAdmin();
      }
    }
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>正在验证权限...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;
