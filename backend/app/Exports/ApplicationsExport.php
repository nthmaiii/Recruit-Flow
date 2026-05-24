<?php

namespace App\Exports;

use App\Models\Application;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ApplicationsExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(protected array $filters = []) {}

    public function collection()
    {
        $query = Application::with(['job', 'candidate', 'assignedTo']);

        if (!empty($this->filters['job_id'])) {
            $query->where('job_id', $this->filters['job_id']);
        }

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['from_date'])) {
            $query->where('created_at', '>=', $this->filters['from_date']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID', 'Candidate Name', 'Email', 'Phone',
            'Job Title', 'Status', 'Rating',
            'Applied At', 'Assigned To',
        ];
    }

    public function map($application): array
    {
        return [
            $application->id,
            $application->candidate->full_name,
            $application->candidate->email,
            $application->candidate->phone,
            $application->job->title,
            $application->status,
            $application->rating,
            $application->created_at->format('d/m/Y H:i'),
            $application->assignedTo?->name ?? '-',
        ];
    }
}
