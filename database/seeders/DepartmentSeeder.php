<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        Department::insert([
            ['name' => 'IT', 'description' => 'Bo phan Cong nghe Thong tin', 'manager_id' => null],
            ['name' => 'Sales', 'description' => 'Bo phan Kinh doanh', 'manager_id' => null],
            ['name' => 'Marketing', 'description' => 'Bo phan Marketing', 'manager_id' => null],
        ]);
    }
}
