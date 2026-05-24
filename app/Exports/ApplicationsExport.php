<?php

namespace App\Exports;

use App\Models\Application;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ApplicationsExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(private int $jobId, private array $filters = []) {}

    public function query()
    {
        $query = Application::with(['candidate.user'])
            ->where('job_id', $this->jobId);

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        return $query->orderBy('applied_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'ID', 'Họ tên', 'Email', 'Điện thoại',
            'Ngày nộp', 'Trạng thái', 'Điểm TB', 'Tags',
        ];
    }

    public function map($application): array
    {
        return [
            $application->id,
            $application->candidate->full_name,
            $application->candidate->user->email,
            $application->candidate->phone,
            $application->applied_at->format('d/m/Y H:i'),
            $application->status,
            $application->rating_avg ?? '-',
            $application->tags ? implode(', ', $application->tags) : '',
        ];
    }
}
