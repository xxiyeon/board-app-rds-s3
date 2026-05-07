import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import './Layout.css'

export default function Layout() {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/posts')
  }

  return (
    <div className="layout">
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/posts" className="navbar-brand">
            <span className="brand-icon">📋</span>
            <span>Bitstudy</span>
          </Link>
          <nav className="navbar-nav">
            {isLoggedIn ? (
              <>
                <span className="nav-user">
                  <span className="user-badge">{user.role === 'ADMIN' ? '👑' : '👤'}</span>
                  <strong>{user.nickname}</strong>님
                </span>
                <Link to="/posts/new" className="btn btn-primary btn-sm">
                  ✏️ 글쓰기
                </Link>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">로그인</Link>
                <Link to="/register" className="btn btn-primary btn-sm">회원가입</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <span>Bitstudy · Docker + AWS EC2 강의 실습 프로젝트</span>
        </div>
      </footer>
    </div>
  )
}
