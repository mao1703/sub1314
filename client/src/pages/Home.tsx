import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  category_name?: string;
  tags?: string[];
  cover?: string;
  created_at: string;
  views?: number;
}

interface Category {
  id: string;
  name: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 筛选状态
  const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // 获取分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('获取分类失败', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          pageSize,
          category: category || undefined,
          keyword: keyword || undefined
        };
        
        // 根据标签页决定调用哪个接口
        const endpoint = activeTab === 'my' ? '/posts/my' : '/posts';
        const response = await api.get(endpoint, { params });
        
        setPosts(response.data.articles);
        setTotalPages(Math.ceil(response.data.total / pageSize));
      } catch (error) {
        console.error('获取文章失败', error);
        setPosts([]); // 失败时清空列表
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page, category, keyword, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    setPage(1);
  };

  const handleTabChange = (tab: 'public' | 'my') => {
    setActiveTab(tab);
    setPage(1);
    // 切换标签时重置分类筛选，或者保留看需求，这里保留
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

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      {/* 顶部标题区 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <motion.h1 
          className="page-title"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ 
            fontSize: '3.5rem', 
            letterSpacing: '-1px',
            marginBottom: '20px'
          }}
        >
          探索代码与
          <span style={{ 
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            animation: 'gradientFlow 3s ease infinite'
          }}> 灵感</span>
        </motion.h1>
        <motion.p 
          style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          分享技术见解，记录生活点滴，发现更多有趣的灵魂。
          <br />
          由 AI 驱动的现代化博客体验。
        </motion.p>
      </motion.div>

      {/* 文章 Tab 切换 (仅登录可见) */}
      {user && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', gap: '20px' }}
        >
          <button 
            onClick={() => handleTabChange('public')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              padding: '10px 20px',
              cursor: 'pointer',
              color: activeTab === 'public' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'public' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            公共文章
          </button>
          <button 
            onClick={() => handleTabChange('my')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              padding: '10px 20px',
              cursor: 'pointer',
              color: activeTab === 'my' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'my' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            我的文章
          </button>
        </motion.div>
      )}

      {/* 搜索栏 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', maxWidth: '600px', gap: '12px', position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            placeholder={activeTab === 'my' ? "搜索我的文章..." : "搜索公共文章..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ 
              borderRadius: '50px', 
              paddingLeft: '24px', 
              paddingRight: '120px',
              height: '56px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
          <motion.button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              position: 'absolute', 
              right: '6px', 
              top: '6px', 
              height: '44px', 
              borderRadius: '40px', 
              padding: '0 24px' 
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            搜索
          </motion.button>
        </form>
      </motion.div>

      {/* 分类标签 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ marginBottom: '50px', display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', justifyContent: 'center' }}
      >
        <motion.button
          onClick={() => handleCategoryChange('')}
          className={`btn ${category === '' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '20px', padding: '8px 24px', fontSize: '14px' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          全部
        </motion.button>
        {categories.map(cat => (
          <motion.button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`btn ${category === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '8px 24px', fontSize: '14px' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {cat.name}
          </motion.button>
        ))}
      </motion.div>

      {/* 文章列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}
          />
        </div>
      ) : posts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '80px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--card-radius)' }}
        >
          {activeTab === 'my' ? '您还没有发布任何文章' : '暂无相关文章'}
          {activeTab === 'my' && (
             <div style={{ marginTop: '20px' }}>
                <Link to="/write" className="btn btn-primary">去写一篇</Link>
             </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
        >
          {posts.map((post) => (
            <motion.div 
              key={post.id} 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="card" 
              style={{ 
                padding: 0, 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                backgroundColor: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* 封面图 */}
              <Link to={`/post/${post.id}`} style={{ display: 'block', height: '220px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', position: 'relative' }}>
                {post.cover ? (
                  <motion.img 
                    src={post.cover} 
                    alt={post.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, var(--bg-secondary), var(--bg-tertiary))' }}>
                    <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-tertiary)', opacity: 0.3 }}>
                      {post.title.charAt(0)}
                    </span>
                  </div>
                )}
                {post.category_name && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    right: '16px', 
                    backgroundColor: 'rgba(0,0,0,0.6)', 
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {post.category_name}
                  </span>
                )}
              </Link>
              
              <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{post.author_name}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                
                <h2 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', lineHeight: 1.3, fontWeight: 600 }}>
                  <Link to={`/post/${post.id}`} style={{ color: 'var(--text-primary)', transition: 'color 0.2s' }}>
                    {post.title}
                  </Link>
                </h2>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {post.content.replace(/[#*`]/g, '').substring(0, 120)}...
                </p>
                
                {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        backgroundColor: getTagColor(tag) + '15',
                        color: getTagColor(tag),
                        border: `1px solid ${getTagColor(tag)}30`,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 500
                      }}>
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to={`/post/${post.id}`} style={{ color: 'var(--accent-primary)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    阅读全文 
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
                  </Link>
                  {post.views !== undefined && (
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{post.views} 阅读</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 分页控制器 */}
      {!loading && totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '80px', marginBottom: '80px', display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}
        >
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
            style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            上一页
          </button>
          <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{page}</span> / {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary"
            style={{ opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            下一页
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
