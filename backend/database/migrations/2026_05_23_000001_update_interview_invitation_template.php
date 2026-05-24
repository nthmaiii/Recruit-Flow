<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $body = '<p>Kính gửi {candidate_name},</p>'
            . '<p>Chúng tôi trân trọng mời bạn tham dự buổi phỏng vấn cho vị trí <strong>{job_title}</strong> tại <strong>{company_name}</strong>.</p>'
            . '<h3 style="margin:16px 0 8px">Thông tin lịch phỏng vấn:</h3>'
            . '<table style="border-collapse:collapse;width:100%">'
            . '<tr><td style="padding:6px 0;color:#666;width:140px">📅 Thời gian:</td><td style="padding:6px 0;font-weight:bold">{interview_date}</td></tr>'
            . '<tr><td style="padding:6px 0;color:#666">⏱ Thời lượng:</td><td style="padding:6px 0">{interview_duration}</td></tr>'
            . '<tr><td style="padding:6px 0;color:#666">📍 Hình thức:</td><td style="padding:6px 0">{interview_type}</td></tr>'
            . '<tr><td style="padding:6px 0;color:#666">🏢 Địa điểm:</td><td style="padding:6px 0">{interview_location}</td></tr>'
            . '<tr><td style="padding:6px 0;color:#666">🔗 Link họp:</td><td style="padding:6px 0"><a href="{meeting_link}">{meeting_link}</a></td></tr>'
            . '</table>'
            . '<p>{custom_message}</p>'
            . '<p style="margin-top:20px">Vui lòng <strong>xác nhận tham dự hoặc từ chối</strong> lịch phỏng vấn bằng cách nhấn nút bên dưới:</p>'
            . '<p><a href="{confirmation_link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Xác nhận / Từ chối lịch phỏng vấn</a></p>'
            . '<p>Trân trọng,<br><strong>{company_name}</strong></p>';

        DB::table('email_templates')
            ->where('code', 'interview_invitation')
            ->update([
                'subject'    => 'Thư mời phỏng vấn - {job_title}',
                'body'       => $body,
                'variables'  => json_encode([
                    'candidate_name', 'job_title', 'company_name',
                    'interview_date', 'interview_duration', 'interview_type',
                    'interview_location', 'meeting_link', 'confirmation_link',
                    'custom_message',
                ]),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('email_templates')
            ->where('code', 'interview_invitation')
            ->update([
                'subject'   => 'Interview Invitation for {job_title}',
                'body'      => '<p>Dear {candidate_name},</p><p>We are pleased to invite you for an interview for the position of <strong>{job_title}</strong>.</p><p>{custom_message}</p><p>Best regards,<br>{company_name}</p>',
                'variables' => json_encode(['candidate_name', 'job_title', 'company_name', 'custom_message']),
                'updated_at' => now(),
            ]);
    }
};
