import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // 编辑相关状态
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '' });

  // 标签管理相关状态
  const [tagUser, setTagUser] = useState<User | null>(null);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: '加载用户失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该用户吗？此操作不可恢复。')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setMessage({ type: 'success', text: '用户已删除' });
      setUsers(users.filter(user => user.id !== id));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '删除失败' });
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('请输入新密码（留空则生成随机密码）：');
    if (newPassword === null) return;
    
    try {
      await api.put(`/admin/users/${id}`, { password: newPassword || undefined });
      setMessage({ type: 'success', text: '密码已重置' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '重置失败' });
    }
  };

  const handleToggleAdmin = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`确定要将该用户 ${newRole === 'admin' ? '设为管理员' : '降级为普通用户'} 吗？`)) return;

    try {
      await api.put(`/admin/users/${user.id}`, { role: newRole });
      setMessage({ type: 'success', text: '权限修改成功' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '操作失败' });
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({ username: user.username, email: user.email });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser.id}`, editForm);
      setMessage({ type: 'success', text: '用户信息更新成功' });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '更新失败' });
    }
  };

  const handleManageTags = async (user: User) => {
    setTagUser(user);
    try {
      const res = await api.get(`/admin/users/${user.id}/tags`);
      setUserTags(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: '获取标签失败' });
      setUserTags([]);
    }
  };

  const getTagColor = (tag: string) => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
      '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !userTags.includes(tag)) {
      setUserTags([...userTags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setUserTags(userTags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveTags = async () => {
    if (!tagUser) return;
    try {
      await api.put(`/admin/users/${tagUser.id}/tags`, { tags: userTags });
      setMessage({ type: 'success', text: '标签更新成功' });
      setTagUser(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || '标签更新失败' });
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>用户管理</h2>
        {message.text && (
          <div style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: message.type === 'error' ? '#ef4444' : '#10b981'
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* 编辑用户模态框 */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>编辑用户</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>用户名</label>
              <input 
                type="text" 
                className="input-field"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>邮箱</label>
              <input 
                type="email" 
                className="input-field"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary">取消</button>
              <button onClick={handleUpdateUser} className="btn btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 标签管理模态框 */}
      {tagUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>管理标签 - {tagUser.username}</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="输入新标签..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  style={{ flex: 1 }}
                />
                <button onClick={handleAddTag} className="btn btn-secondary">添加</button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '100px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                {userTags.length === 0 && <span style={{ color: 'var(--text-tertiary)' }}>暂无标签</span>}
                {userTags.map(tag => (
                  <span key={tag} style={{
                    backgroundColor: getTagColor(tag) + '20',
                    color: getTagColor(tag),
                    border: `1px solid ${getTagColor(tag)}40`,
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'currentColor',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '16px',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setTagUser(null)} className="btn btn-secondary">取消</button>
              <button onClick={handleSaveTags} className="btn btn-primary">保存标签</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px' }}>用户名</th>
              <th style={{ padding: '12px' }}>邮箱</th>
              <th style={{ padding: '12px' }}>角色</th>
              <th style={{ padding: '12px' }}>注册时间</th>
              <th style={{ padding: '12px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px' }}>{user.username}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: user.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: user.role === 'admin' ? '#fbbf24' : '#60a5fa'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEditClick(user)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>编辑</button>
                  <button onClick={() => handleManageTags(user)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}>标签</button>
                  <button onClick={() => handleResetPassword(user.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>重置密码</button>
                  <button onClick={() => handleToggleAdmin(user)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    {user.role === 'admin' ? '降级' : '提权'}
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;