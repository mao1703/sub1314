import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    code: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!formData.email) {
      setError('请先输入邮箱');
      return;
    }
    // 简单的邮箱格式检查
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setSendingCode(true);
    setError('');
    
    try {
      await api.post('/auth/send-code', { email: formData.email });
      // alert('验证码已发送，请查收邮件');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', formData);
      alert('注册成功！请登录您的账号');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2rem' }}>创建账号</h2>
        
        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--btn-radius)', color: '#ef4444', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>用户名</label>
            <input 
              type="text" 
              className="input-field"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              minLength={3}
              maxLength={20}
              placeholder="3-20个字符"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>邮箱</label>
            <input 
              type="email" 
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="example@email.com"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>验证码</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="input-field"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
                placeholder="6位数字验证码"
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap', minWidth: '100px' }}
              >
                {countdown > 0 ? `${countdown}s 后重发` : (sendingCode ? '发送中...' : '获取验证码')}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>密码</label>
            <input 
              type="password" 
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={6}
              placeholder="至少6位"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
          >
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          已有账号？ <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>直接登录</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
