import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Add Link

const Profile: React.FC = () => {
  const { user, logout, login } = useAuth(); // login 用于更新本地用户信息
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 个人资料状态
  // 初始化时，如果 user 还没加载好，给默认值
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    avatar: ''
  });

  // 监听 user 变化，同步更新 profileData
  // 这解决了 "首次提交头像黑屏" 问题，因为当 user 更新时，profileData 也会更新
  // 同时处理了 user 初始为 null 的情况
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);

  // 密码修改状态
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // 如果 user 为空，可能是正在加载或未登录
  // 这里可以加一个 loading 状态判断，或者简单的 null check
  if (!user) {
      // 可以在这里返回一个加载中的占位符，而不是直接显示“未登录”
      // 因为 AuthProvider 初始化时 user 可能是 null
      return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>加载中...</div>;
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const response = await api.put('/users/profile', profileData);
      const token = localStorage.getItem('token');
      if (token) {
        // 更新全局状态，这会触发上面的 useEffect 更新本地 profileData
        login(token, response.data.user);
      }
      setProfileMessage({ type: 'success', text: '个人资料更新成功' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.response?.data?.message || '更新失败' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      await api.put('/users/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMessage({ type: 'success', text: '密码修改成功' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || '修改失败' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 前端简单验证
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const token = localStorage.getItem('token');
      if (token) {
        // 更新全局状态
        login(token, response.data.user);
        // 注意：这里不需要手动 setProfileData，因为 useEffect 会监听 user 变化并自动更新
        // 但为了更快的 UI 响应（避免等待 useEffect），手动更新也是可以的，
        // 不过最关键的是上面的 useEffect 确保了数据一致性
      }
      setProfileMessage({ type: 'success', text: '头像上传成功' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.response?.data?.message || '头像上传失败' });
    } finally {
      setAvatarUploading(false);
      // 清空 input，允许重复选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '40px', paddingBottom: '60px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card" 
        style={{ padding: '40px', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '30px' }}>
          <div 
            style={{ 
              position: 'relative',
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'var(--bg-tertiary)', 
              color: 'var(--accent-primary)',
              fontSize: '32px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border-color)',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={handleAvatarClick}
            title="点击更换头像"
          >
            {avatarUploading ? (
              <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            ) : user.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user.username || '').charAt(0).toUpperCase()
            )}
            
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              background: 'rgba(0,0,0,0.6)', 
              color: 'white', 
              fontSize: '10px', 
              textAlign: 'center', 
              padding: '4px 0',
              opacity: 0,
              transition: 'opacity 0.2s'
            }}
            className="avatar-overlay"
            >
              更换
            </div>
            <style>{`.avatar-overlay:hover { opacity: 1 !important; }`}</style>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            style={{ display: 'none' }} 
            accept="image/*"
          />

          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{user.username}</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 0',
              color: activeTab === 'info' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'info' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            基本资料
          </button>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 0',
              color: activeTab === 'password' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'password' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            修改密码
          </button>
          {user.role === 'admin' && (
            <Link
              to="/admin/users"
              style={{
                textDecoration: 'none',
                padding: '10px 0',
                color: 'var(--text-secondary)',
                borderBottom: '2px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ color: '#fbbf24' }}>🛡️</span> 后台管理
            </Link>
          )}
        </div>

        {/* Info Form */}
        {activeTab === 'info' && (
          <motion.form 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleProfileUpdate}
          >
            {profileMessage.text && (
              <div style={{ 
                padding: '12px', 
                borderRadius: 'var(--btn-radius)', 
                marginBottom: '20px',
                backgroundColor: profileMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: profileMessage.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${profileMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                {profileMessage.text}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>用户名</label>
              <input 
                type="text" 
                className="input-field"
                value={profileData.username}
                onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                minLength={3}
                maxLength={20}
              />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>邮箱</label>
              <input 
                type="email" 
                className="input-field"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              />
            </div>
            {/* 删除了原有的头像 URL 输入框，改为顶部点击头像上传 */}
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={profileLoading}
              style={{ padding: '10px 30px' }}
            >
              {profileLoading ? '保存中...' : '保存修改'}
            </button>
          </motion.form>
        )}

        {/* Password Form */}
        {activeTab === 'password' && (
          <motion.form 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handlePasswordUpdate}
          >
            {passwordMessage.text && (
              <div style={{ 
                padding: '12px', 
                borderRadius: 'var(--btn-radius)', 
                marginBottom: '20px',
                backgroundColor: passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: passwordMessage.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                {passwordMessage.text}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>当前密码</label>
              <input 
                type="password" 
                className="input-field"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>新密码</label>
              <input 
                type="password" 
                className="input-field"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                required
                minLength={6}
                placeholder="至少 6 位"
              />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>确认新密码</label>
              <input 
                type="password" 
                className="input-field"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                required
                minLength={6}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={passwordLoading}
              style={{ padding: '10px 30px' }}
            >
              {passwordLoading ? '修改中...' : '修改密码'}
            </button>
          </motion.form>
        )}
        
        <div style={{ marginTop: '60px', borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
           <button 
            onClick={() => {
              if (window.confirm('确定要退出登录吗？')) {
                logout();
                window.location.href = '/login';
              }
            }}
            className="btn btn-danger"
            style={{ width: '100%' }}
          >
            退出登录
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
