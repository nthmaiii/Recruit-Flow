import axios from 'axios'
import toast from 'react-hot-toast'

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này.')
    } else if (error.response?.status >= 500) {
      toast.error('Lỗi server. Vui lòng thử lại sau.')
    }
    return Promise.reject(error)
  }
)

export default client
