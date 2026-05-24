<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Seeder;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $hr = User::where('role', 'HR')->first();
        $deptIT = Department::where('name', 'IT')->first();
        $deptSales = Department::where('name', 'Sales')->first();

        $jobs = [
            [
                'title' => 'Senior Laravel Developer',
                'department_id' => $deptIT->id,
                'quantity' => 2,
                'description' => '<p>Chung toi dang tim kiem Senior Laravel Developer co kinh nghiem.</p>',
                'requirements' => '<ul><li>5+ nam kinh nghiem PHP/Laravel</li><li>Hieu biet ve MySQL, Redis</li><li>Kinh nghiem voi RESTful API</li></ul>',
                'location' => 'Van phong HCM',
                'salary_range' => '30-50 trieu',
                'deadline' => now()->addDays(30)->toDateString(),
                'status' => 'published',
                'created_by' => $hr->id,
            ],
            [
                'title' => 'React Frontend Developer',
                'department_id' => $deptIT->id,
                'quantity' => 1,
                'description' => '<p>Tim kiem Frontend Developer co kinh nghiem voi React.</p>',
                'requirements' => '<ul><li>3+ nam kinh nghiem React</li><li>Hieu biet TypeScript</li><li>Kinh nghiem Tailwind CSS</li></ul>',
                'location' => 'Van phong HCM',
                'salary_range' => '20-35 trieu',
                'deadline' => now()->addDays(25)->toDateString(),
                'status' => 'published',
                'created_by' => $hr->id,
            ],
            [
                'title' => 'Sales Manager B2B',
                'department_id' => $deptSales->id,
                'quantity' => 1,
                'description' => '<p>Vi tri Sales Manager phu trach khach hang doanh nghiep.</p>',
                'requirements' => '<ul><li>5+ nam kinh nghiem Sales B2B</li><li>Ky nang dam phan tot</li></ul>',
                'location' => 'Van phong HCM',
                'salary_range' => '25-40 trieu + hoa hong',
                'deadline' => now()->addDays(20)->toDateString(),
                'status' => 'published',
                'created_by' => $hr->id,
            ],
            [
                'title' => 'DevOps Engineer',
                'department_id' => $deptIT->id,
                'quantity' => 1,
                'description' => '<p>Tim kiem DevOps Engineer co kinh nghiem Docker, Kubernetes.</p>',
                'requirements' => '<ul><li>3+ nam kinh nghiem DevOps</li><li>Docker, Kubernetes, CI/CD</li><li>AWS/GCP kinh nghiem</li></ul>',
                'location' => 'Remote',
                'salary_range' => '30-45 trieu',
                'deadline' => now()->addDays(15)->toDateString(),
                'status' => 'draft',
                'created_by' => $hr->id,
            ],
            [
                'title' => 'Sales Executive',
                'department_id' => $deptSales->id,
                'quantity' => 3,
                'description' => '<p>Vi tri nhan vien kinh doanh phat trien thi truong.</p>',
                'requirements' => '<ul><li>1-2 nam kinh nghiem Sales</li><li>Kha nang giao tiep tot</li></ul>',
                'location' => 'Van phong HCM',
                'salary_range' => '10-15 trieu + hoa hong',
                'deadline' => now()->addDays(45)->toDateString(),
                'status' => 'draft',
                'created_by' => $hr->id,
            ],
        ];

        foreach ($jobs as $jobData) {
            Job::create($jobData);
        }
    }
}
