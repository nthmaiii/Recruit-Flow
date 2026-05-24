import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { jobsApi } from '@/api/jobs'
import { useAuthStore } from '@/store/authStore'
import client from '@/api/client'
import toast from 'react-hot-toast'

export default function JobForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isEdit = Boolean(id)
  const isHM = user?.role === 'hiring_manager'

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(Number(id)).then((r) => r.data),
    enabled: isEdit,
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => client.get('/departments').then((r) => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (job) reset(job)
  }, [job, reset])

  const hasApplications = job?.applications_count > 0

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? jobsApi.update(Number(id), data) : jobsApi.create(data),
    onSuccess: () => {
      const msg = isHM
        ? (isEdit ? t('jobs.hmUpdated') : t('jobs.hmCreated'))
        : (isEdit ? t('jobs.updatedJob') : t('jobs.createdJob'))
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate('/jobs')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('jobs.saveFail')),
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isHM
            ? (isEdit ? t('jobs.updateRequest') : t('jobs.createRequest'))
            : (isEdit ? t('jobs.editJob') : t('jobs.createJob'))}
        </h1>
        <button onClick={() => navigate('/jobs')} className="btn-secondary">{t('common.cancel')}</button>
      </div>

      {isHM && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          {t('jobs.hmInfo')}
        </div>
      )}

      {hasApplications && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          {t('jobs.hasAppsInfo')}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">{t('jobs.jobTitle')} *</label>
              <input
                {...register('title', { required: t('common.required') })}
                disabled={hasApplications}
                className="input disabled:bg-gray-100"
              />
              {errors.title && <p className="form-error">{String(errors.title.message)}</p>}
            </div>

            <div>
              <label className="form-label">{t('jobs.departmentField')} *</label>
              <select
                {...register('department_id', { required: t('common.required') })}
                disabled={hasApplications || isHM}
                className="input disabled:bg-gray-100"
              >
                <option value="">{t('jobs.selectDept')}</option>
                {departments?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {isHM && <p className="text-xs text-gray-400 mt-1">{t('jobs.autoAssignDept')}</p>}
            </div>

            <div>
              <label className="form-label">{t('jobs.locationField')} *</label>
              <input {...register('location', { required: t('common.required') })} className="input" />
            </div>

            <div>
              <label className="form-label">{t('jobs.typeField')} *</label>
              <select
                {...register('type', { required: t('common.required') })}
                disabled={hasApplications}
                className="input disabled:bg-gray-100"
              >
                <option value="">{t('jobs.selectType')}</option>
                <option value="full_time">{t('jobs.fullTime')}</option>
                <option value="part_time">{t('jobs.partTime')}</option>
                <option value="contract">{t('jobs.contract')}</option>
                <option value="internship">{t('jobs.internship')}</option>
              </select>
            </div>

            <div>
              <label className="form-label">{t('jobs.levelField')} *</label>
              <select
                {...register('level', { required: t('common.required') })}
                disabled={hasApplications}
                className="input disabled:bg-gray-100"
              >
                <option value="">{t('jobs.selectLevel')}</option>
                <option value="intern">{t('jobs.intern')}</option>
                <option value="junior">{t('jobs.junior')}</option>
                <option value="mid">{t('jobs.mid')}</option>
                <option value="senior">{t('jobs.senior')}</option>
                <option value="lead">{t('jobs.lead')}</option>
                <option value="manager">{t('jobs.manager')}</option>
              </select>
            </div>

            <div>
              <label className="form-label">{t('jobs.salaryMin')}</label>
              <input {...register('salary_min')} type="number" className="input" />
            </div>

            <div>
              <label className="form-label">{t('jobs.salaryMax')}</label>
              <input {...register('salary_max')} type="number" className="input" />
            </div>

            <div>
              <label className="form-label">{t('jobs.vacancies')}</label>
              <input {...register('vacancies')} type="number" min="1" className="input" />
            </div>

            <div>
              <label className="form-label">{t('jobs.deadlineField')}</label>
              <input {...register('deadline')} type="date" className="input" />
            </div>

            {!isHM && (
              <div>
                <label className="form-label">{t('jobs.statusField')}</label>
                <select {...register('status')} className="input">
                  <option value="draft">{t('jobs.draftStatus')}</option>
                  <option value="published">{t('jobs.publishedStatus')}</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">{t('jobs.descriptionField')} *</label>
            <textarea
              {...register('description', { required: t('common.required') })}
              rows={5}
              className="input"
            />
          </div>

          <div>
            <label className="form-label">{t('jobs.requirementsField')} *</label>
            <textarea
              {...register('requirements', { required: t('common.required') })}
              rows={4}
              className="input"
            />
          </div>

          <div>
            <label className="form-label">{t('jobs.benefitsField')}</label>
            <textarea {...register('benefits')} rows={3} className="input" />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/jobs')} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending
                ? t('jobs.updating')
                : isHM
                  ? (isEdit ? t('jobs.resubmitApproval') : t('jobs.submitToHR'))
                  : (isEdit ? t('common.update') : t('jobs.newJob'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
