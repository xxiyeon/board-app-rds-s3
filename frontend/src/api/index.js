import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// 요청 인터셉터: JWT 토큰 자동 첨부
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터: 401 시 로그아웃
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
}

// Post API - multipart/form-data 로 변경
export const postApi = {
  getList: (page = 0, size = 10, keyword = '') =>
    api.get('/posts', { params: { page, size, keyword } }),
  getDetail: (id) => api.get(`/posts/${id}`),

  // 파일 포함 전송: FormData 사용
  create: (title, content, files) => {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    if (files) {
      files.forEach(file => formData.append('files', file))
    }
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  update: (id, title, content, files) => {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    if (files) {
      files.forEach(file => formData.append('files', file))
    }
    return api.put(`/posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  delete: (id) => api.delete(`/posts/${id}`)
}

// Comment API
export const commentApi = {
  add: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  delete: (commentId) => api.delete(`/posts/comments/${commentId}`)
}

// Attachment API
export const attachmentApi = {
  delete: (attachmentId) => api.delete(`/attachments/${attachmentId}`)
}

export default api
