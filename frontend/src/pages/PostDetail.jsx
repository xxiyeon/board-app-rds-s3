import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { postApi, commentApi } from '../api'
import { useAuth } from '../store/AuthContext'
import './PostDetail.css'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchPost = async () => {
    try {
      const res = await postApi.getDetail(id)
      setPost(res.data)
    } catch {
      navigate('/posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPost() }, [id])

  const handleDelete = async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return
    try {
      await postApi.delete(id)
      navigate('/posts')
    } catch (e) {
      alert(e.response?.data?.message || '삭제 실패')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await commentApi.add(id, { content: commentText })
      setCommentText('')
      await fetchPost()
    } catch (e) {
      setError(e.response?.data?.message || '댓글 등록 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await commentApi.delete(commentId)
      await fetchPost()
    } catch (e) {
      alert(e.response?.data?.message || '삭제 실패')
    }
  }

  const isAuthor = post && user && post.authorUsername === user.username
  const isAdmin = user && user.role === 'ADMIN'

  if (loading) return <div className="spinner" />
  if (!post) return null

  return (
    <div className="post-detail">
      {/* 헤더 */}
      <div className="detail-header card">
        <div className="detail-meta-top">
          <span className="detail-category">게시판</span>
        </div>
        <h1 className="detail-title">{post.title}</h1>
        <div className="detail-meta">
          <span className="meta-author">✍️ {post.authorNickname}</span>
          <span className="meta-divider">·</span>
          <span className="meta-date">🕐 {formatDate(post.createdAt)}</span>
          <span className="meta-divider">·</span>
          <span className="meta-views">👁 조회 {post.viewCount}</span>
          {post.attachments?.length > 0 && (
            <>
              <span className="meta-divider">·</span>
              <span className="meta-attach">📎 {post.attachments.length}개 첨부</span>
            </>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="card detail-body">
        <div className="post-content">{post.content}</div>

        {/* 첨부파일(이미지 인라인 미리보기 + 일반 파일 다운로드 링크) */}
        {post.attachments?.length > 0 && (
          <div className="file-download-section">
            <p className="attach-section-title">📎 첨부파일 ({post.attachments.length})</p>
            <ul className="download-list">
              {post.attachments.map(file => {
                const isImageFile = file.contentType?.startsWith('image/')
                return (
                <li key={file.id} className="download-item">
                  <div className="download-info">
                    <span className="download-name">{file.originalName}</span>
                    <span className="download-size">{formatFileSize(file.fileSize)}</span>
                  </div>
                  {isImageFile ? (
                    <a href={file.fileUrl} target="_blank" rel="noreferrer">
                      <img
                        src={file.fileUrl}
                        alt={file.originalName}
                        style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }}
                      />
                    </a>
                  ) : (
                    <a
                      href={file.fileUrl}
                      download={file.originalName}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      ⬇ 다운로드
                    </a>
                  )}
                </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="detail-actions">
        <Link to="/posts" className="btn btn-outline">← 목록</Link>
        <div style={{ display: 'flex', gap: 8 }}>
          {(isAuthor || isAdmin) && (
            <>
              <Link to={`/posts/${id}/edit`} className="btn btn-outline">✏️ 수정</Link>
              <button className="btn btn-danger" onClick={handleDelete}>🗑 삭제</button>
            </>
          )}
        </div>
      </div>

      {/* 댓글 */}
      <div className="card comments-section">
        <h3 className="comments-title">
          댓글 <span className="comments-count">{post.comments?.length || 0}</span>
        </h3>

        {post.comments && post.comments.length > 0 ? (
          <ul className="comment-list">
            {post.comments.map(comment => (
              <li key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">👤 {comment.authorNickname}</span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <div className="comment-body">
                  <p className="comment-content">{comment.content}</p>
                  {(user?.username === comment.authorUsername || isAdmin) && (
                    <button className="btn btn-sm comment-delete-btn"
                      onClick={() => handleCommentDelete(comment.id)}>
                      삭제
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-comments">첫 댓글을 작성해보세요!</p>
        )}

        {isLoggedIn ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="comment-input-row">
              <textarea
                className="form-input comment-textarea"
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={3}
              />
              <button type="submit" className="btn btn-primary comment-submit-btn"
                disabled={submitting || !commentText.trim()}>
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        ) : (
          <div className="comment-login-prompt">
            <Link to="/login" className="btn btn-outline">로그인하고 댓글 달기</Link>
          </div>
        )}
      </div>

    </div>
  )
}
