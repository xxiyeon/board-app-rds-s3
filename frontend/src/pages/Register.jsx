import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../store/AuthContext'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', nickname: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { username, password, confirmPassword, nickname, email } = form
    if (!username || !password || !nickname || !email) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (username.length < 4) { setError('아이디는 4자 이상이어야 합니다.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await authApi.register({ username, password, nickname, email })
      const { token, ...userData } = res.data
      login(userData, token)
      navigate('/posts')
    } catch (e) {
      setError(e.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide card">
        <div className="auth-header">
          <div className="auth-logo">📋</div>
          <h1 className="auth-title">Bitstudy</h1>
          <p className="auth-subtitle">새 계정을 만들어 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">아이디 *</label>
              <input type="text" className="form-input" placeholder="4자 이상"
                value={form.username} onChange={set('username')} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">닉네임 *</label>
              <input type="text" className="form-input" placeholder="표시될 이름"
                value={form.nickname} onChange={set('nickname')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">이메일 *</label>
            <input type="email" className="form-input" placeholder="example@email.com"
              value={form.email} onChange={set('email')} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">비밀번호 *</label>
              <input type="password" className="form-input" placeholder="6자 이상"
                value={form.password} onChange={set('password')} />
            </div>
            <div className="form-group">
              <label className="form-label">비밀번호 확인 *</label>
              <input type="password" className="form-input" placeholder="비밀번호 재입력"
                value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="auth-footer">
          <p>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
        </div>
      </div>
    </div>
  )
}
