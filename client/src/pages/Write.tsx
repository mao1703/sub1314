import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';

interface Category {
  id: string;
  name: string;
}

const Write: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]); // Change to array
  const [cover, setCover] = useState('');
  const [loading, setLoading] = useState(false);
const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 标签相关状态
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // 分类下拉框相关状态
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const closeCategoryDropdownTimer = React.useRef<NodeJS.Timeout | null>(null);
  
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setCover(response.data.url);
    } catch (error) {
      console.error('上传失败', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
      // 清空 input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  // 获取分类和标签
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          api.get('/categories'),
          api.get('/users/tags')
        ]);
        setCategories(catRes.data);
        setAvailableTags(Array.isArray(tagRes.data) ? tagRes.data : []);
      } catch (error) {
        console.error('获取初始数据失败', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (editId) {
      const fetchPost = async () => {
        try {
          const response = await api.get(`/posts/${editId}`);
          const { title, content, category_id, tags, cover } = response.data;
          setTitle(title);
          setContent(content);
          setCategory(category_id || '');
          setCover(cover || '');
          if (Array.isArray(tags)) {
            setTags(tags);
          }
        } catch (error) {
          console.error('获取文章失败', error);
          alert('无法加载文章数据');
        }
      };
      fetchPost();
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 同步标签到用户个人标签库
      // 获取旧标签 -> 合并新标签 -> 截取前10个 -> 保存
      try {
        // 使用当前前端维护的 availableTags（包含了用户的删除操作）和 tags 进行合并
        // 不再重新 fetch 后端数据，以保留用户的删除操作
        const mergedTags = Array.from(new Set([...tags, ...availableTags])).slice(0, 10);
        
        await api.post('/users/tags', { tags: mergedTags });
      } catch (tagError) {
        console.error('同步标签失败，但不影响文章发布', tagError);
      }

      // 2. 发布/更新文章
      const postData = {
        title,
        content,
        category: category || null,
        tags: tags,
        cover: cover || null
      };

      let response;
      if (editId) {
        response = await api.put(`/posts/${editId}`, postData);
      } else {
        response = await api.post('/posts', postData);
      }
      
      const articleId = editId || response.data.article.id;
      navigate(`/post/${articleId}`);
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 标签颜色生成器
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
    if (!trimmedTag) return;

    // 1. 数量限制：最多10个
    if (tags.length >= 10) {
      alert('每篇文章最多添加 10 个标签，请删除部分标签后再添加');
      return;
    }

    // 2. 长度限制：单个标签最多20字符
    if (trimmedTag.length > 20) {
      alert('标签长度不能超过 20 个字符');
      return;
    }

    // 3. 安全检查：仅允许汉字、字母、数字、下划线、短横线
    const safePattern = /^[a-zA-Z0-9\u4e00-\u9fa5\-_]+$/;
    if (!safePattern.test(trimmedTag)) {
      alert('标签包含非法字符，仅支持中英文、数字、下划线和短横线');
      return;
    }

    if (!tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleDeleteAvailableTag = (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡，避免触发选择标签
    if (!window.confirm(`确定要从推荐列表中移除 "${tagToDelete}" 吗？(将在发布时同步生效)`)) return;
    setAvailableTags(availableTags.filter(t => t !== tagToDelete));
  };

  // 分类下拉框交互函数
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
    setCategory(catId);
    setShowCategoryDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // 标签输入框聚焦处理
  const handleTagInputFocus = () => {
    setIsInputFocused(true);
    if (availableTags.length > 0) {
      setShowTagDropdown(true);
    }
  };

  // 标签输入框失焦处理
  const handleTagInputBlur = () => {
    setIsInputFocused(false);
    // 延迟关闭下拉，以便能够点击下拉项
    setTimeout(() => {
      setShowTagDropdown(false);
    }, 200);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto', 
      display: 'flex', 
      flexDirection: 'column',
      height: 'calc(100vh - var(--nav-height) - 40px)', // 适配导航栏高度
      boxSizing: 'border-box'
    }}>
      {/* 头部：标题和按钮 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {editId ? '编辑文章' : '创作中心'}
        </h1>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-primary"
          style={{ minWidth: '120px' }}
        >
          {loading ? '保存中...' : (editId ? '更新发布' : '立即发布')}
        </button>
      </div>

      {/* 顶部工具栏：标题、分类等 */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="input-field"
            placeholder="请输入文章标题..." 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            style={{ 
              flex: '2 1 300px',
              fontSize: '18px', 
              fontWeight: 600,
              padding: '14px'
            }}
            required
          />
          <div 
            style={{ flex: '1 1 150px', position: 'relative' }}
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
              <span style={{ color: category ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {categories.find(c => c.id === category)?.name || '选择分类'}
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
                      backgroundColor: category === cat.id ? 'var(--bg-tertiary)' : 'transparent',
                      color: category === cat.id ? 'var(--accent-primary)' : 'inherit',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = category === cat.id ? 'var(--bg-tertiary)' : 'transparent'}
                  >
                    {cat.name}
                    {category === cat.id && <span style={{ color: 'var(--accent-primary)' }}>✓</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* 标签输入组件 */}
          <div 
            style={{ flex: '1 1 200px', position: 'relative' }}
          >
            <div 
              className="input-field" 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                padding: '8px 12px',
                minHeight: '45px',
                height: 'auto',
                alignItems: 'center',
                cursor: 'text',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isInputFocused ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                boxShadow: isInputFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
                backgroundColor: isInputFocused ? 'var(--bg-secondary)' : 'transparent'
              }}
              onClick={() => {
                document.getElementById('tag-input')?.focus();
              }}
            >
              {tags.map(tag => (
                <span key={tag} style={{
                  backgroundColor: getTagColor(tag) + '15', // 更加轻柔的背景
                  color: getTagColor(tag),
                  border: `1px solid ${getTagColor(tag)}30`,
                  borderRadius: '6px', // 方圆角设计，更现代
                  padding: '2px 8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'currentColor',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      opacity: 0.6,
                      borderRadius: '50%',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input 
                id="tag-input"
                type="text" 
                placeholder={tags.length === 0 ? "添加标签 (回车确认)..." : ""} 
                value={tagInput} 
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagDropdown(true);
                }}
                onKeyDown={handleKeyDown}
                onFocus={handleTagInputFocus}
                onBlur={handleTagInputBlur}
                style={{ 
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  flex: 1,
                  minWidth: '120px',
                  fontSize: '14px',
                  padding: '4px 0'
                }}
              />
            </div>
            
            {/* 标签推荐下拉列表 */}
            {showTagDropdown && availableTags.length > 0 && (
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
                {availableTags
                  .filter(tag => !tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase()))
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
                        justifyContent: 'space-between', // 改为两端对齐
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
                        onClick={(e) => handleDeleteAvailableTag(tag, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0.6,
                          fontSize: '14px',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.6';
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="从推荐列表中移除"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                  {availableTags.filter(tag => !tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase())).length === 0 && tagInput && (
                    <li style={{ padding: '8px 12px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                      没有匹配的推荐标签
                    </li>
                  )}
              </ul>
            )}
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cover && (
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '4px', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  <img src={cover} alt="封面预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <span style={{ 
                color: cover ? 'var(--text-primary)' : 'var(--text-tertiary)', 
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {cover ? '已设置封面' : '未设置封面'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {uploading ? '上传中...' : '上传封面'}
            </button>
          </div>
        </div>
      </div>

      {/* 主体区域：编辑器和预览 */}
      <div className="editor-container" style={{ 
        flex: 1, 
        display: 'flex', 
        gap: '20px', 
        minHeight: 0 // 允许 flex 子项滚动
      }}>
        {/* 编辑区 */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
            编辑 (Markdown)
          </div>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="在此处开始您的创作..."
            style={{ 
              flex: 1, 
              padding: '20px', 
              fontSize: '16px', 
              lineHeight: '1.6', 
              border: 'none', 
              resize: 'none',
              fontFamily: "'Fira Code', monospace",
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            required
          />
        </div>

        {/* 预览区 */}
        <div className="preview-pane card" style={{ 
          flex: 1, 
          padding: 0, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
            实时预览
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div className="markdown-content">
              {content ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '100px' }}>
                  预览区域将显示文章的最终效果
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 900px) {
          .editor-container {
            flex-direction: column;
            overflow-y: auto !important; /* 在移动端允许整体滚动 */
          }
          .preview-pane {
            display: none; /* 移动端默认隐藏预览 */
          }
        }
      `}</style>
    </div>
  );
};

export default Write;
