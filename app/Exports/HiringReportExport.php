<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class HiringReportExport implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(private array $filters = []) {}

    public function collection()
    {
        return DB::table('applications')
            ->selectRaw('DATE_FORMAT(applied_at, "%Y-%m") as period')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(status = "hired") as hired')
            ->selectRaw('AVG(CASE WHEN status = "hired" THEN DATEDIFF(updated_at, applied_at) END) as avg_days')
            ->groupByRaw('DATE_FORMAT(applied_at, "%Y-%m")')
            ->orderByRaw('DATE_FORMAT(applied_at, "%Y-%m")')
            ->get();
    }

    public function headings(): array
    {
        return ['Kỳ', 'Tổng hồ sơ', 'Đã tuyển', 'Thời gian TB (ngày)'];
    }

    public function title(): string
    {
        return 'Báo cáo tuyển dụng';
    }
}
