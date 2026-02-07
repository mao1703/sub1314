import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface Post {
  id: string;
  title: string;
  content: string; // Add content
  author_name: string;
  category_name: string;
  created_at: string;
  views: number;
}

interface Category {
  id: string;
  name: string;
}

interface EditFormState {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const PostManagement: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  // const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // 编辑状态
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ title: '', content: '', category: '', tags: [] });

  // 标签和分类状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const closeDropdownTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const closeCategoryDropdownTimer = React.useRef<NodeJS.Timeout | null>(null);

  const fetchPosts = async () => {
    // setLoading(true);
    try {
      const res = await api.get('/admin/posts', {
        params: { page, pageSize }
      });
      setPosts(res.data.articles);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      alert('获取文章列表失败');
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // Fetch categories and tags
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          api.get('/categories'),
          api.get('/users/tags')
        ]);
        setCategories(catRes.data);
        setAvailableTags(tagRes.data);
      } catch (error) {
        console.error('获取初始数据失败', error);
      }
    };
    fetchData();
  }, [page]);

  // Helper functions
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

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleDeleteAvailableTag = async (tagToDelete: string) => {
    if (!window.confirm(`确定要从推荐列表中删除 "${tagToDelete}" 吗？`)) return;
    
    // 仅更新本地状态
    const newAvailableTags = availableTags.filter(t => t !== tagToDelete);
    setAvailableTags(newAvailableTags);

    // 立即同步到后端
    try {
      await api.post('/users/tags', { tags: newAvailableTags });
    } catch (error) {
      console.error('同步标签失败', error);
      alert('删除标签失败，请重试');
    }
  };

  const handleCategoryDropdownEnter = () => {
    if (closeCategoryDropdownTimer.current) {
      clearTimeout(closeCategoryDropdownTimer.current);
      closeCategoryDropdownTimer.current = null;
    }
    setShowCategoryDropdown(true);
  };

  const handleCategoryDropdownLeave = () => {
    closeCategoryDropdownTimer.current = setTimeout(() => {
      setShowCategoryDropdown(false);
    }, 200);
  };

  const handleSelectCategory = (catId: string) => {
    setEditForm(prev => ({ ...prev, category: catId }));
    setShowCategoryDropdown(false);
  };

  const handleDropdownEnter = () => {
    if (closeDropdownTimer.current) {
      clearTimeout(closeDropdownTimer.current);
      closeDropdownTimer.current = null;
    }
    setShowTagDropdown(true);
  };

  const handleDropdownLeave = () => {
    if (document.activeElement === document.getElementById('tag-input-admin')) {
      return;
    }
    closeDropdownTimer.current = setTimeout(() => {
      setShowTagDropdown(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && editForm.tags.length > 0) {
      handleRemoveTag(editForm.tags[editForm.tags.length - 1]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这篇文章吗？')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };

  const handleEditClick = (post: Post) => {
    // 获取文章详情以填充内容（列表接口可能不包含完整内容，或者内容被截断）
    // 这里先尝试直接用列表里的数据，如果列表里没有 content，则需要单独获取
    // 假设列表接口现在返回了 content (adminController.getAllPosts 实际上没有返回 content)
    // 所以我们需要单独请求详情，或者依赖列表里已有的部分信息。
    // 为了稳妥，这里先简单请求一下详情
    api.get(`/posts/${post.id}`).then(res => {
        setEditingPost(res.data);
        setEditForm({ 
          title: res.data.title, 
          content: res.data.content,
          category: res.data.category_id || '',
          tags: Array.isArray(res.data.tags) ? res.data.tags : []
        });
    }).catch(err => {
        console.error(err);
        alert('获取文章详情失败');
    });
  };

  const handleUpdate = async () => {
    if (!editingPost) return;
    try {
      // 提交时保存所有标签（包括新增和删除后的状态）
      const newAvailableTags = Array.from(new Set([...availableTags, ...editForm.tags])).slice(0, 10);
      
      // 总是更新后端标签库
      api.post('/users/tags', { tags: newAvailableTags }).catch(console.error);

      await api.put(`/admin/posts/${editingPost.id}`, editForm);
      alert('文章更新成功');
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert('更新失败');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>文章管理</h2>
      
      {/* 编辑模态框 */}
      {editingPost && (
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
          <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>编辑文章</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>标题</label>
              <input 
                type="text" 
                className="input-field"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '15px', flexWrap: 'wrap' }}>
               {/* 分类选择 */}
               <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>分类</label>
                <div 
                  style={{ position: 'relative' }}
                  onMouseEnter={handleCategoryDropdownEnter}
                  onMouseLeave={handleCategoryDropdownLeave}
                >
                  <div 
                    className="input-field"
                    style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px', 
                      padding: '8px 12px',
                      minHeight: '45px',
                      height: 'auto',
                      alignItems: 'center',
                      cursor: 'pointer',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <span style={{ color: editForm.category ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {categories.find(c => c.id === editForm.category)?.name || '选择分类'}
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.5 }}>▼</span>
                  </div>
                  
                  {showCategoryDropdown && (
                    <ul style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      marginTop: '4px',
                      padding: '0',
                      listStyle: 'none',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                      {categories.map(cat => (
                        <li 
                          key={cat.id}
                          onClick={() => handleSelectCategory(cat.id)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            transition: 'background 0.2s',
                            backgroundColor: editForm.category === cat.id ? 'var(--bg-tertiary)' : 'transparent',
                            color: editForm.category === cat.id ? 'var(--accent-primary)' : 'inherit',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = editForm.category === cat.id ? 'var(--bg-tertiary)' : 'transparent'}
                        >
                          {cat.name}
                          {editForm.category === cat.id && <span style={{ color: 'var(--accent-primary)' }}>✓</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
               </div>

               {/* 标签输入 */}
               <div style={{ flex: '2 1 200px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>标签</label>
                <div 
                  style={{ position: 'relative' }}
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div 
                    className="input-field" 
                    style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px', 
                      padding: '8px 12px',
                      minHeight: '45px',
                      height: 'auto',
                      alignItems: 'center',
                      cursor: 'text'
                    }}
                    onClick={() => {
                      document.getElementById('tag-input-admin')?.focus();
                      handleDropdownEnter();
                    }}
                  >
                    {editForm.tags.map(tag => (
                      <span key={tag} style={{
                        backgroundColor: getTagColor(tag) + '20',
                        color: getTagColor(tag),
                        border: `1px solid ${getTagColor(tag)}40`,
                        borderRadius: '16px',
                        padding: '2px 8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        userSelect: 'none'
                      }}>
                        {tag}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'currentColor',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '14px'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input 
                      id="tag-input-admin"
                      type="text" 
                      placeholder={editForm.tags.length === 0 ? "添加标签..." : ""} 
                      value={tagInput} 
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={handleDropdownEnter}
                      onBlur={() => {
                        if (!closeDropdownTimer.current) {
                           closeDropdownTimer.current = setTimeout(() => {
                              setShowTagDropdown(false);
                           }, 200);
                        }
                      }}
                      style={{ 
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        flex: 1,
                        minWidth: '60px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  {showTagDropdown && (
                    <ul 
                      style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      marginTop: '4px',
                      padding: '0',
                      listStyle: 'none',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                      {availableTags
                        .filter(tag => !editForm.tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase()))
                        .map((tag, index) => (
                          <li 
                            key={index}
                            onClick={() => handleAddTag(tag)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              transition: 'background 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getTagColor(tag)
                              }} />
                              {tag}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAvailableTag(tag);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.6,
                                transition: 'opacity 0.2s, color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.color = '#ef4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.6';
                                e.currentTarget.style.color = 'var(--text-tertiary)';
                              }}
                              title="从推荐列表中删除"
                            >
                              ×
                            </button>
                          </li>
                      ))}
                      {availableTags.filter(tag => !editForm.tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase())).length === 0 && (
                        <li 
                          style={{ padding: '8px 12px', color: tagInput ? 'var(--accent-primary)' : 'var(--text-tertiary)', cursor: 'pointer', fontWeight: 500 }}
                          onClick={() => {
                            if (tagInput.trim()) {
                              handleAddTag(tagInput);
                            } else {
                              document.getElementById('tag-input-admin')?.focus();
                            }
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {tagInput ? `+ 创建标签 "${tagInput}"` : '输入内容并回车以创建新标签'}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
               </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>内容</label>
              <textarea 
                className="input-field"
                style={{ height: '300px', resize: 'vertical' }}
                value={editForm.content}
                onChange={(e) => setEditForm({...editForm, content: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingPost(null)} className="btn btn-secondary">取消</button>
              <button onClick={handleUpdate} className="btn btn-primary">保存修改</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px' }}>标题</th>
              <th style={{ padding: '12px' }}>作者</th>
              <th style={{ padding: '12px' }}>分类</th>
              <th style={{ padding: '12px' }}>发布时间</th>
              <th style={{ padding: '12px' }}>阅读量</th>
              <th style={{ padding: '12px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px' }}>
                  <Link to={`/post/${post.id}`} target="_blank" style={{ color: 'var(--text-primary)' }}>
                    {post.title.length > 20 ? post.title.substring(0, 20) + '...' : post.title}
                  </Link>
                </td>
                <td style={{ padding: '12px' }}>{post.author_name}</td>
                <td style={{ padding: '12px' }}>{post.category_name}</td>
                <td style={{ padding: '12px' }}>{new Date(post.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{post.views}</td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEditClick(post)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>编辑</button>
                  <button onClick={() => handleDelete(post.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 简单分页 */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn btn-secondary"
        >
          上一页
        </button>
        <span style={{ display: 'flex', alignItems: 'center' }}>{page} / {Math.ceil(total / pageSize)}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={page * pageSize >= total}
          className="btn btn-secondary"
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default PostManagement;
