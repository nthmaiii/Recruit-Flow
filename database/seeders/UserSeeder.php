<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $deptIT = Department::where('name', 'IT')->first();
        $deptSales = Department::where('name', 'Sales')->first();

        // Super Admin
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@recruitflow.com',
            'password' => Hash::make('Admin@123'),
            'role' => 'SA',
            'is_active' => true,
        ]);

        // HR users
        User::create([
            'name' => 'Nguyen Thi HR',
            'email' => 'hr1@recruitflow.com',
            'password' => Hash::make('HR@123456'),
            'role' => 'HR',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Tran Van HR',
            'email' => 'hr2@recruitflow.com',
            'password' => Hash::make('HR@123456'),
            'role' => 'HR',
            'is_active' => true,
        ]);

        // HM users
        $hm1 = User::create([
            'name' => 'Le Van IT Manager',
            'email' => 'hm.it@recruitflow.com',
            'password' => Hash::make('HM@123456'),
            'role' => 'HM',
            'department_id' => $deptIT->id,
            'is_active' => true,
        ]);

        $hm2 = User::create([
            'name' => 'Pham Thi Sales Manager',
            'email' => 'hm.sales@recruitflow.com',
            'password' => Hash::make('HM@123456'),
            'role' => 'HM',
            'department_id' => $deptSales->id,
            'is_active' => true,
        ]);

        // Set department managers
        $deptIT->update(['manager_id' => $hm1->id]);
        $deptSales->update(['manager_id' => $hm2->id]);

        // Sample candidates
        $candidateEmails = [
            ['name' => 'Ung Vien A', 'email' => 'candidate.a@example.com', 'phone' => '0901234567'],
            ['name' => 'Ung Vien B', 'email' => 'candidate.b@example.com', 'phone' => '0912345678'],
            ['name' => 'Ung Vien C', 'email' => 'candidate.c@example.com', 'phone' => '0923456789'],
            ['name' => 'Ung Vien D', 'email' => 'candidate.d@example.com', 'phone' => '0934567890'],
            ['name' => 'Ung Vien E', 'email' => 'candidate.e@example.com', 'phone' => '0945678901'],
        ];

        foreach ($candidateEmails as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('Candidate@123'),
                'role' => 'CANDIDATE',
                'must_change_password' => true,
                'is_active' => true,
            ]);

            Candidate::create([
                'user_id' => $user->id,
                'full_name' => $data['name'],
                'phone' => $data['phone'],
            ]);
        }
    }
}
