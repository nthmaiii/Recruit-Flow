import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface ChangePasswordForm {
  current_password: string
  password: string
  password_confirmation: string
}

export default function ChangePassword() {
  const navigate = useNavigate()
  const { updateUser, user } = useAuthStore()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordForm>()

  const onSubmit = async (data: ChangePasswordForm) => {
    setLoading(true)
    try {
      await authApi.changePassword(data)
      updateUser({ must_change_password: false })
      toast.success(t('changePassword.title') + ' ' + t('common.done').toLowerCase())
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('changePassword.title')}</h1>
          {user?.must_change_password && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">{t('changePassword.mustChange')}</p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">{t('changePassword.currentPassword')}</label>
              <input {...register('current_password', { required: t('changePassword.required') })} type="password" className="input" />
              {errors.current_password && <p className="form-error">{errors.current_password.message}</p>}
            </div>
            <div>
              <label className="form-label">{t('changePassword.newPassword')}</label>
              <input {...register('password', { required: t('changePassword.required'), minLength: { value: 8, message: t('changePassword.minLength') } })} type="password" className="input" />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <div>
              <label className="form-label">{t('changePassword.confirmPassword')}</label>
              <input {...register('password_confirmation', { required: t('changePassword.required'), validate: (val) => val === watch('password') || t('changePassword.mismatch') })} type="password" className="input" />
              {errors.password_confirmation && <p className="form-error">{errors.password_confirmation.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t('changePassword.saving') : t('changePassword.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
