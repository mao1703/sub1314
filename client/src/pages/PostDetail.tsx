import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  category_name?: string;
  tags?: string[];
  created_at: string;
  views: number;
}

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/posts/${id}`);
        setPost(response.data);
      } catch (error) {
        console.error('获取文章详情失败', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return;
    }

    try {
      await api.delete(`/posts/${id}`);
      alert('文章已删除');
      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const handleEdit = () => {
    navigate(`/write?id=${id}`);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
      <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!post) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>文章未找到</div>;

  const isAuthor = user && user.id === post.author_id;

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

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '40px', paddingBottom: '60px' }}>
      <div className="card" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {post.category_name && (
              <span style={{ 
                display: 'inline-block',
                backgroundColor: 'var(--bg-tertiary)', 
                color: 'var(--accent-primary)',
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {post.category_name}
              </span>
            )}
            {post.tags && Array.isArray(post.tags) && post.tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-block',
                backgroundColor: getTagColor(tag) + '20',
                color: getTagColor(tag),
                border: `1px solid ${getTagColor(tag)}40`,
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                #{tag}
              </span>
            ))}
          </div>
          
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', lineHeight: 1.2 }}>{post.title}</h1>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            color: 'var(--text-secondary)', 
            fontSize: '14px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{post.author_name}</span>
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>{post.views} 阅读</span>
            </div>

            {isAuthor && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleEdit}
                  className="btn btn-secondary"
                  style={{ padding: '6px 16px' }}
                >
                  编辑
                </button>
                <button 
                  onClick={handleDelete}
                  className="btn btn-danger"
                  style={{ padding: '6px 16px' }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="markdown-content" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
