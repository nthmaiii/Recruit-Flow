<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\Candidate;
use App\Models\Interview;
use App\Models\InterviewEvaluation;
use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Seeder;

class ApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $hr = User::where('role', 'HR')->first();
        $hm = User::where('role', 'HM')->first();
        $publishedJobs = Job::where('status', 'published')->get();
        $candidates = Candidate::all();

        $statuses = ['new', 'viewed', 'interview_scheduled', 'interviewed', 'offer', 'hired', 'rejected'];

        $usedPairs = [];
        $created = 0;

        foreach ($publishedJobs as $job) {
            foreach ($candidates->shuffle()->take(4) as $candidate) {
                $key = "{$job->id}-{$candidate->id}";
                if (in_array($key, $usedPairs)) continue;
                $usedPairs[] = $key;

                $status = $statuses[array_rand($statuses)];

                $application = Application::create([
                    'job_id' => $job->id,
                    'candidate_id' => $candidate->id,
                    'cv_path' => "cvs/{$job->id}/sample_cv.pdf",
                    'cover_letter' => 'Toi rat quan tam den vi tri nay va mong muon duoc ong y.',
                    'status' => $status,
                    'applied_at' => now()->subDays(rand(1, 30)),
                ]);

                ApplicationStatusHistory::create([
                    'application_id' => $application->id,
                    'from_status' => null,
                    'to_status' => 'new',
                    'note' => 'Ho so moi nop',
                    'changed_by' => $hr->id,
                ]);

                if (in_array($status, ['viewed', 'interview_scheduled', 'interviewed', 'offer', 'hired', 'rejected'])) {
                    ApplicationStatusHistory::create([
                        'application_id' => $application->id,
                        'from_status' => 'new',
                        'to_status' => 'viewed',
                        'note' => 'Da xem xet ho so',
                        'changed_by' => $hr->id,
                    ]);
                }

                if (in_array($status, ['interview_scheduled', 'interviewed', 'offer', 'hired'])) {
                    $interview = Interview::create([
                        'application_id' => $application->id,
                        'round' => 1,
                        'interviewer_id' => $hm->id,
                        'scheduled_at' => now()->addDays(rand(1, 10)),
                        'duration_minutes' => 60,
                        'location' => 'Phong hop A',
                        'status' => 'confirmed',
                        'confirmed_at' => now(),
                        'created_by' => $hr->id,
                    ]);

                    if (in_array($status, ['interviewed', 'offer', 'hired'])) {
                        InterviewEvaluation::create([
                            'interview_id' => $interview->id,
                            'technical_score' => rand(3, 5),
                            'soft_score' => rand(3, 5),
                            'comment' => 'Ung vien co ky nang tot, phu hop voi yeu cau.',
                            'recommendation' => 'pass',
                            'evaluated_by' => $hm->id,
                        ]);

                        $application->update(['rating_avg' => rand(30, 50) / 10]);
                    }
                }

                $created++;
            }
        }

        echo "Created {$created} sample applications.\n";
    }
}
