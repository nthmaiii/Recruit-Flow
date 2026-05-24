<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\EmailTemplate;
use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Departments
        $techDept = Department::create(['name' => 'Engineering', 'description' => 'Software development team']);
        $hrDept = Department::create(['name' => 'Human Resources', 'description' => 'HR and recruitment team']);

        // Super Admin
        $sa = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@recruitflow.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_SA,
        ]);

        // HR users
        $hr1 = User::create([
            'name' => 'HR Manager',
            'email' => 'hr@recruitflow.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_HR,
            'department_id' => $hrDept->id,
        ]);

        $hr2 = User::create([
            'name' => 'HR Staff',
            'email' => 'hr2@recruitflow.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_HR,
            'department_id' => $hrDept->id,
        ]);

        // Hiring Managers
        $hm1 = User::create([
            'name' => 'Tech Lead',
            'email' => 'hm@recruitflow.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_HM,
            'department_id' => $techDept->id,
        ]);

        $hm2 = User::create([
            'name' => 'Product Manager',
            'email' => 'hm2@recruitflow.local',
            'password' => Hash::make('password'),
            'role' => User::ROLE_HM,
            'department_id' => $techDept->id,
        ]);

        // Update department managers
        $techDept->update(['manager_id' => $hm1->id]);
        $hrDept->update(['manager_id' => $hr1->id]);

        // Email Templates
        EmailTemplate::insert([
            [
                'name' => 'Application Received',
                'code' => 'application_received',
                'subject' => 'We received your application for {job_title}',
                'body' => '<p>Dear {candidate_name},</p><p>Thank you for applying for <strong>{job_title}</strong>. We will review your application and get back to you soon.</p><p>Best regards,<br>{company_name}</p>',
                'variables' => json_encode(['candidate_name', 'job_title', 'company_name']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Interview Invitation',
                'code' => 'interview_invitation',
                'subject' => 'Thư mời phỏng vấn - {job_title}',
                'body' => '<p>Kính gửi {candidate_name},</p><p>Chúng tôi trân trọng mời bạn tham dự buổi phỏng vấn cho vị trí <strong>{job_title}</strong> tại <strong>{company_name}</strong>.</p><h3 style="margin:16px 0 8px">Thông tin lịch phỏng vấn:</h3><table style="border-collapse:collapse;width:100%"><tr><td style="padding:6px 0;color:#666;width:140px">📅 Thời gian:</td><td style="padding:6px 0;font-weight:bold">{interview_date}</td></tr><tr><td style="padding:6px 0;color:#666">⏱ Thời lượng:</td><td style="padding:6px 0">{interview_duration}</td></tr><tr><td style="padding:6px 0;color:#666">📍 Hình thức:</td><td style="padding:6px 0">{interview_type}</td></tr><tr><td style="padding:6px 0;color:#666">🏢 Địa điểm:</td><td style="padding:6px 0">{interview_location}</td></tr><tr><td style="padding:6px 0;color:#666">🔗 Link họp:</td><td style="padding:6px 0"><a href="{meeting_link}">{meeting_link}</a></td></tr></table>{custom_message}<p style="margin-top:20px">Vui lòng <strong>xác nhận tham dự hoặc từ chối</strong> lịch phỏng vấn bằng cách nhấn nút bên dưới:</p><p><a href="{confirmation_link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Xác nhận / Từ chối lịch phỏng vấn</a></p><p>Trân trọng,<br><strong>{company_name}</strong></p>',
                'variables' => json_encode(['candidate_name', 'job_title', 'company_name', 'interview_date', 'interview_duration', 'interview_type', 'interview_location', 'meeting_link', 'confirmation_link', 'custom_message']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Offer Letter',
                'code' => 'offer_letter',
                'subject' => 'Job Offer - {job_title}',
                'body' => '<p>Dear {candidate_name},</p><p>Congratulations! We are delighted to offer you the position of <strong>{job_title}</strong>.</p><p>{custom_message}</p><p>Best regards,<br>{company_name}</p>',
                'variables' => json_encode(['candidate_name', 'job_title', 'company_name', 'custom_message']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Rejection Notice',
                'code' => 'rejection',
                'subject' => 'Update on your application for {job_title}',
                'body' => '<p>Dear {candidate_name},</p><p>Thank you for your interest in the <strong>{job_title}</strong> position. After careful consideration, we have decided to move forward with other candidates.</p><p>We wish you the best in your job search.</p><p>Best regards,<br>{company_name}</p>',
                'variables' => json_encode(['candidate_name', 'job_title', 'company_name']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Welcome / Hired',
                'code' => 'hired',
                'subject' => 'Welcome to {company_name}!',
                'body' => '<p>Dear {candidate_name},</p><p>We are thrilled to welcome you to the team! Your journey at <strong>{company_name}</strong> begins now.</p><p>Best regards,<br>{company_name} HR Team</p>',
                'variables' => json_encode(['candidate_name', 'company_name']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Interview Reminder',
                'code' => 'interview_reminder',
                'subject' => 'Reminder: Interview for {job_title} tomorrow',
                'body' => '<p>Dear {candidate_name},</p><p>This is a reminder of your interview for <strong>{job_title}</strong> scheduled tomorrow.</p><p>Best regards,<br>{company_name}</p>',
                'variables' => json_encode(['candidate_name', 'job_title', 'company_name']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Jobs
        $job1 = Job::create([
            'title' => 'Senior Backend Developer',
            'slug' => 'senior-backend-developer',
            'department_id' => $techDept->id,
            'created_by' => $sa->id,
            'description' => 'We are looking for an experienced backend developer to join our team.',
            'requirements' => '5+ years PHP/Laravel experience. Strong knowledge of MySQL and Redis.',
            'benefits' => 'Competitive salary, health insurance, 15 days annual leave.',
            'location' => 'Ho Chi Minh City',
            'type' => 'full_time',
            'level' => 'senior',
            'salary_min' => 2000,
            'salary_max' => 3500,
            'status' => 'published',
            'vacancies' => 2,
        ]);

        $job2 = Job::create([
            'title' => 'Frontend Developer (React)',
            'slug' => 'frontend-developer-react',
            'department_id' => $techDept->id,
            'created_by' => $hr1->id,
            'description' => 'Join our frontend team to build amazing user interfaces.',
            'requirements' => '3+ years React experience. TypeScript, Tailwind CSS knowledge.',
            'benefits' => 'Remote-friendly, flexible hours, learning budget.',
            'location' => 'Remote',
            'type' => 'full_time',
            'level' => 'mid',
            'salary_min' => 1500,
            'salary_max' => 2500,
            'status' => 'published',
            'vacancies' => 1,
        ]);

        $job3 = Job::create([
            'title' => 'DevOps Engineer',
            'slug' => 'devops-engineer',
            'department_id' => $techDept->id,
            'created_by' => $sa->id,
            'description' => 'Manage and improve our cloud infrastructure.',
            'requirements' => 'Experience with AWS, Docker, Kubernetes, CI/CD.',
            'benefits' => 'Stock options, remote work.',
            'location' => 'Hanoi',
            'type' => 'full_time',
            'level' => 'senior',
            'salary_min' => 2500,
            'salary_max' => 4000,
            'status' => 'published',
            'vacancies' => 1,
        ]);

        $job4 = Job::create([
            'title' => 'Mobile Developer (Flutter)',
            'slug' => 'mobile-developer-flutter',
            'department_id' => $techDept->id,
            'created_by' => $hr1->id,
            'description' => 'Build cross-platform mobile applications.',
            'requirements' => '2+ years Flutter development.',
            'benefits' => null,
            'location' => 'Ho Chi Minh City',
            'type' => 'full_time',
            'level' => 'junior',
            'salary_min' => 1000,
            'salary_max' => 1800,
            'status' => 'draft',
            'vacancies' => 2,
        ]);

        // Candidates
        $candidates = [
            ['full_name' => 'Nguyen Van A', 'email' => 'nguyenvana@example.com', 'phone' => '0901234567'],
            ['full_name' => 'Tran Thi B', 'email' => 'tranthib@example.com', 'phone' => '0912345678'],
            ['full_name' => 'Le Van C', 'email' => 'levanc@example.com', 'phone' => '0923456789'],
            ['full_name' => 'Pham Thi D', 'email' => 'phamthid@example.com', 'phone' => '0934567890'],
            ['full_name' => 'Hoang Van E', 'email' => 'hoangvane@example.com', 'phone' => '0945678901'],
            ['full_name' => 'Do Thi F', 'email' => 'dothif@example.com', 'phone' => '0956789012'],
        ];

        $createdCandidates = collect($candidates)->map(fn($c) => Candidate::create($c));

        // Applications with varied statuses
        $applications = [
            ['job_id' => $job1->id, 'candidate_id' => $createdCandidates[0]->id, 'status' => 'new'],
            ['job_id' => $job1->id, 'candidate_id' => $createdCandidates[1]->id, 'status' => 'reviewing'],
            ['job_id' => $job1->id, 'candidate_id' => $createdCandidates[2]->id, 'status' => 'interview_scheduled'],
            ['job_id' => $job2->id, 'candidate_id' => $createdCandidates[3]->id, 'status' => 'interviewed'],
            ['job_id' => $job2->id, 'candidate_id' => $createdCandidates[4]->id, 'status' => 'offer_sent'],
            ['job_id' => $job3->id, 'candidate_id' => $createdCandidates[5]->id, 'status' => 'hired'],
        ];

        foreach ($applications as $appData) {
            $app = Application::create(array_merge($appData, [
                'cv_path' => 'cvs/sample.pdf',
                'cv_original_name' => 'cv_' . $appData['candidate_id'] . '.pdf',
                'assigned_to' => $hm1->id,
            ]));

            ApplicationStatusHistory::create([
                'application_id' => $app->id,
                'from_status' => null,
                'to_status' => 'new',
                'changed_by' => $sa->id,
                'note' => 'Initial application',
            ]);
        }
    }
}
