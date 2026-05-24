<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('email_templates')->updateOrInsert(
            ['code' => 'offer_letter'],
            [
                'name' => 'Thông báo tuyển dụng thành công',
                'subject' => 'Chúc mừng! Bạn đã được tuyển dụng - {job_title}',
                'body' => '<p>Kính gửi <strong>{candidate_name}</strong>,</p>
<p>Chúng tôi rất vui mừng thông báo rằng bạn đã <strong>vượt qua vòng phỏng vấn</strong> và được chính thức nhận vào vị trí <strong>{job_title}</strong> tại <strong>{company_name}</strong>.</p>
<p>Để hoàn tất thủ tục nhận việc và được hướng dẫn các bước tiếp theo, vui lòng liên hệ với bộ phận HR của chúng tôi qua:</p>
<p style="text-align:center; font-size:18px;"><strong>Zalo: 0901 234 567</strong></p>
<p>Chúng tôi rất mong chào đón bạn gia nhập đội ngũ!</p>
<p>Trân trọng,<br><strong>{company_name}</strong></p>',
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void {}
};
