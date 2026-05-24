<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('role', 'SA')->first()->id;

        $templates = [
            [
                'type' => 'cv_received',
                'subject' => '[{{company_name}}] Xac nhan nhan ho so - {{job_title}}',
                'body_html' => '
<p>Xin chao {{candidate_name}},</p>
<p>Chung toi da nhan duoc ho so ung tuyen vi tri <strong>{{job_title}}</strong> cua ban.</p>
<p>Chung toi se xem xet va lien he voi ban trong thoi gian som nhat.</p>
<br>
<p>Tran trong,</p>
<p><strong>{{company_name}}</strong></p>
',
            ],
            [
                'type' => 'interview_invitation',
                'subject' => '[{{company_name}}] Moi phong van - {{job_title}}',
                'body_html' => '
<p>Xin chao {{candidate_name}},</p>
<p>Ban duoc moi tham gia phong van vong <strong>{{interview_round}}</strong> cho vi tri <strong>{{job_title}}</strong>.</p>
<p><strong>Thoi gian:</strong> {{interview_date}} ({{duration}} phut)</p>
<p><strong>Hinh thuc:</strong> {{interview_link}}</p>
<p><strong>Dia diem:</strong> {{interview_location}}</p>
<br>
<p>Vui long xac nhan tham gia tai day: <a href="{{confirmation_link}}">Xac nhan</a></p>
<br>
<p>Tran trong,</p>
<p><strong>{{company_name}}</strong></p>
',
            ],
            [
                'type' => 'rejection',
                'subject' => '[{{company_name}}] Thong bao ket qua ung tuyen - {{job_title}}',
                'body_html' => '
<p>Xin chao {{candidate_name}},</p>
<p>Cam on ban da quan tam va ung tuyen vi tri <strong>{{job_title}}</strong> tai {{company_name}}.</p>
<p>Sau khi xem xet, chung toi rat tiec phai thong bao rang ho so cua ban chua phu hop voi yeu cau tuyen dung lan nay.</p>
<p>Chung toi hy vong se co co hoi hop tac voi ban trong tuong lai.</p>
<br>
<p>Tran trong,</p>
<p><strong>{{company_name}}</strong></p>
',
            ],
            [
                'type' => 'offer_letter',
                'subject' => '[{{company_name}}] Thu chao mung - {{job_title}}',
                'body_html' => '
<p>Xin chao {{candidate_name}},</p>
<p>Chung toi vui mung thong bao ban da vuot qua qua trinh tuyen dung vi tri <strong>{{job_title}}</strong>.</p>
<p>Chung toi xin gui thu chao mung va mong muon ban gia nhap doi ngu cua {{company_name}}.</p>
<p>Vui long phan hoi email nay de xac nhan chap thuan.</p>
<br>
<p>Tran trong,</p>
<p><strong>{{company_name}}</strong></p>
',
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::create(array_merge($template, ['updated_by' => $adminId]));
        }
    }
}
