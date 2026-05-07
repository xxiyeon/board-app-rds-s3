import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postApi } from '../api'
import { useAuth } from '../store/AuthContext'
import './PostList.css'

function formatDate(dateStr) {
  if (!dateStr) return ''
  // UTC로 명시적 변환
  const date = new Date(dateStr.replace(' ', 'T') + 'Z')
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '방금 전'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function PostList() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await postApi.getList(page, 10, keyword)
      setPosts(res.data.content)
      setTotalPages(res.data.totalPages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, keyword])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setKeyword(searchInput)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">게시판</h1>
        {isLoggedIn && (
          <button className="btn btn-primary" onClick={() => navigate('/posts/new')}>
            ✏️ 글쓰기
          </button>
        )}
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          className="form-input search-input"
          placeholder="제목 또는 내용으로 검색..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">검색</button>
        {keyword && (
          <button type="button" className="btn btn-outline"
            onClick={() => { setSearchInput(''); setKeyword(''); setPage(0) }}>
            초기화
          </button>
        )}
      </form>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="spinner" />
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>{keyword ? `"${keyword}" 검색 결과가 없습니다.` : '첫 번째 글을 작성해보세요!'}</p>
        </div>
      ) : (
        <div className="card post-table-wrap">
          <table className="post-table">
            <thead>
              <tr>
                <th className="col-no">번호</th>
                <th className="col-title">제목</th>
                <th className="col-author">작성자</th>
                <th className="col-date">날짜</th>
                <th className="col-views">조회</th>
                <th className="col-attach">첨부</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id} className="post-row">
                  <td className="col-no">{page * 10 + idx + 1}</td>
                  <td className="col-title">
                    <Link to={`/posts/${post.id}`} className="post-title-link">
                      {post.title}
                      {post.commentCount > 0 && (
                        <span className="comment-badge">[{post.commentCount}]</span>
                      )}
                    </Link>
                  </td>
                  <td className="col-author">{post.authorNickname}</td>
                  <td className="col-date">{formatDate(post.createdAt)}</td>
                  <td className="col-views">👁 {post.viewCount}</td>
                  <td className="col-attach">{post.attachmentCount > 0 ? `📎${post.attachmentCount}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline btn-sm" onClick={() => setPage(0)} disabled={page === 0}>처음</button>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹ 이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i}
              className={`btn btn-sm ${i === page ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPage(i)}>
              {i + 1}
            </button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>다음 ›</button>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>끝</button>
        </div>
      )}
    </div>
  )
}
