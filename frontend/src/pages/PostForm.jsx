import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postApi, attachmentApi } from '../api'
import './PostForm.css'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function PostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ title: '', content: '' })
  const [files, setFiles] = useState([])               // 새로 선택한 파일들
  const [existingFiles, setExistingFiles] = useState([]) // 수정 시 기존 파일들
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    postApi.getDetail(id)
      .then(res => {
        setForm({ title: res.data.title, content: res.data.content })
        setExistingFiles(res.data.attachments || [])
        setLoading(false)
      })
      .catch(() => navigate('/posts'))
  }, [id])

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
    e.target.value = '' // 같은 파일 재선택 허용
  }

  const removeNewFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingFile = async (attachmentId) => {
    if (!window.confirm('이 첨부파일을 삭제하시겠습니까?')) return
    try {
      setDeletingAttachmentId(attachmentId)
      await attachmentApi.delete(attachmentId)
      setExistingFiles(prev => prev.filter(file => file.id !== attachmentId))
    } catch (e) {
      setError(e.response?.data?.message || '기존 첨부파일 삭제에 실패했습니다.')
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        await postApi.update(id, form.title, form.content, files.length > 0 ? files : null)
        navigate(`/posts/${id}`)
      } else {
        const res = await postApi.create(form.title, form.content, files.length > 0 ? files : null)
        navigate(`/posts/${res.data.id}`)
      }
    } catch (e) {
      setError(e.response?.data?.message || '저장 실패. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="spinner" />

  return (
    <div className="post-form-page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '게시글 수정' : '새 게시글 작성'}</h1>
      </div>

      <div className="card post-form-card">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">제목 *</label>
            <input
              type="text"
              className="form-input"
              placeholder="제목을 입력하세요"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={200}
            />
            <div className="char-count">{form.title.length}/200</div>
          </div>

          <div className="form-group">
            <label className="form-label">내용 *</label>
            <textarea
              className="form-input"
              placeholder="내용을 입력하세요"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={14}
            />
          </div>

          {/* 첨부파일 */}
          <div className="form-group">
            <label className="form-label">첨부파일</label>
            <p className="file-hint">이미지(JPG, PNG, GIF), PDF, ZIP, TXT, Word, Excel 업로드 가능 · 파일당 최대 20MB</p>

            {/* 수정 시 기존 파일 표시 */}
            {isEdit && existingFiles.length > 0 && (
              <div className="existing-files">
                <p className="existing-files-label">
                  현재 첨부파일 (필요한 파일만 개별 삭제할 수 있습니다)
                </p>
                <ul className="file-list">
                  {existingFiles.map(f => (
                    <li key={f.id} className="file-item">
                      <span className="file-icon">{f.isImage ? '🖼️' : '📄'}</span>
                      <span className="file-name">{f.originalName}</span>
                      <span className="file-size">{formatFileSize(f.fileSize)}</span>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => removeExistingFile(f.id)}
                        disabled={deletingAttachmentId === f.id}
                        title="첨부파일 삭제"
                      >
                        {deletingAttachmentId === f.id ? '...' : '✕'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 새 파일 선택 */}
            <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
              <span className="file-upload-icon">📎</span>
              <span className="file-upload-text">클릭하여 파일 선택 (여러 개 가능)</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*,.pdf,.zip,.txt,.doc,.docx,.xls,.xlsx"
              />
            </div>

            {/* 새로 선택된 파일 목록 */}
            {files.length > 0 && (
              <ul className="file-list new-file-list">
                {files.map((file, idx) => (
                  <li key={idx} className="file-item">
                    <span className="file-icon">
                      {file.type.startsWith('image/') ? '🖼️' : '📄'}
                    </span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      className="file-remove-btn"
                      onClick={() => removeNewFile(idx)}
                    >✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '저장 중...' : isEdit ? '수정 완료' : '게시글 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
