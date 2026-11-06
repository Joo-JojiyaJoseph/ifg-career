<?php

namespace Database\Seeders;

use App\Enums\JobLevel;
use App\Enums\JobStatus;
use App\Models\Department;
use App\Models\Entity;
use App\Models\JobPosting;
use App\Models\Skill;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class JobPostingSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::query()->where('email', 'admin@infolksgroup.com')->value('id');
        $entities = Entity::query()->pluck('id', 'slug');
        $entityNames = Entity::query()->pluck('name', 'slug');
        $departments = Department::query()->pluck('id', 'name');
        $teams = Team::query()->pluck('id', 'name');
        $skills = Skill::query()->pluck('id', 'name');

        // Demo roles, one set per entity's real business. HQ: Infolks Tower, Mannarkkad, Kerala.
        $rows = [
            ['Data Annotation Specialist', 'infolks', 'Data Operations', 'Annotation', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 21, ['Image annotation', 'Video annotation', 'Attention to detail']],
            ['LiDAR Annotation Analyst', 'infolks', 'Data Operations', 'Annotation', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 18, ['LiDAR annotation', 'Computer vision', 'Attention to detail']],
            ['Annotation Quality Lead', 'infolks', 'Quality Assurance', 'QA Automation', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 14, ['Quality systems', 'Image annotation', 'Communication']],
            ['HR Coordinator', 'infolks', 'Human Resources', 'Talent', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 10, ['Recruitment', 'Communication', 'Excel']],
            ['Data Annotation Intern', 'infolks', 'Data Operations', 'Annotation', JobLevel::Internship, 'Mannarkkad, Kerala', JobStatus::Published, 15, ['Image annotation', 'Attention to detail', 'Excel']],
            ['Laravel Developer', 'webfolks', 'Software Engineering', 'Platform', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 25, ['PHP', 'Laravel', 'MySQL']],
            ['React Developer', 'webfolks', 'Software Engineering', 'Web', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 20, ['React', 'JavaScript', 'Tailwind CSS']],
            ['Mobile App Developer', 'webfolks', 'Software Engineering', 'Mobile', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 30, ['React Native', 'Kotlin', 'REST APIs']],
            ['UI/UX Designer', 'webfolks', 'Design', 'Product Design', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 12, ['Figma', 'UI design', 'Accessibility']],
            ['DevOps Engineer', 'webfolks', 'Software Engineering', 'Platform', JobLevel::AllLevel, 'Remote — India', JobStatus::Published, 5, ['Linux', 'CI/CD', 'AWS']],
            ['Software Engineering Intern', 'webfolks', 'Software Engineering', 'Web', JobLevel::Internship, 'Mannarkkad, Kerala', JobStatus::Published, 16, ['JavaScript', 'HTML', 'Git']],
            ['Data Collection Coordinator', 'dataways', 'Data Operations', 'Data Collection', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 24, ['Data collection', 'Communication', 'Excel']],
            ['Machine Learning Engineer', 'dataways', 'Data & Analytics', 'Data Science', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 28, ['Python', 'Machine learning', 'Computer vision']],
            ['Business Development Associate', 'dataways', 'Business Development', 'Partnerships', JobLevel::AllLevel, 'Remote — India', JobStatus::Published, 22, ['Stakeholder management', 'Communication', 'Excel']],
            ['Data Intern', 'dataways', 'Data & Analytics', 'Data Science', JobLevel::Internship, 'Mannarkkad, Kerala', JobStatus::Published, 4, ['Python', 'SQL', 'Excel']],
            ['Medical Annotation Specialist', 'medrays', 'Data Operations', 'Medical Annotation', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Published, 19, ['Medical imaging', 'Medical terminology', 'Attention to detail']],
            ['Radiologist (Annotation Panel)', 'medrays', 'Medical Imaging', 'Clinical Research', JobLevel::AllLevel, 'Remote — India', JobStatus::Published, 26, ['Radiology workflow', 'DICOM', 'Medical imaging']],
            ['Imaging Platform Engineer', 'medrays', 'Medical Imaging', 'Radiology Products', JobLevel::AllLevel, 'Mannarkkad, Kerala', JobStatus::Draft, 35, ['DICOM', 'Python', 'PACS']],
            ['Design Intern', 'webfolks', 'Design', 'Product Design', JobLevel::Internship, 'Mannarkkad, Kerala', JobStatus::Draft, 40, ['Figma', 'UI design', 'Prototyping']],
            ['Annotation QA Intern', 'infolks', 'Quality Assurance', 'QA Automation', JobLevel::Internship, 'Mannarkkad, Kerala', JobStatus::Closed, -2, ['Manual testing', 'Image annotation', 'Attention to detail']],
            ['Analytics Consultant', 'dataways', 'Data & Analytics', 'Data Science', JobLevel::AllLevel, 'Remote — India', JobStatus::Closed, -5, ['Tableau', 'SQL', 'Statistics']],
        ];

        foreach ($rows as $row) {
            [$title, $entity, $department, $team, $level, $location, $status, $days, $skillNames] = $row;

            $posting = JobPosting::query()->updateOrCreate(
                ['title' => $title],
                [
                    'entity_id' => $entities[$entity],
                    'department_id' => $departments[$department],
                    'team_id' => $teams[$team],
                    'level' => $level,
                    'location' => $location,
                    'summary' => $title.' at '.$entityNames[$entity].', part of Infolks Group. You will work from day one with a team that trains and supports you.',
                    'qualification' => 'A relevant degree, or equivalent experience. Internship roles welcome final-year students.',
                    'experience' => $level === JobLevel::Internship ? '0–1 years' : '2–5 years',
                    'why_join_us' => 'Learn with teams at Infolks, Webfolks, Dataways and Medrays.',
                    'last_date_to_apply' => now()->addDays($days)->toDateString(),
                    'status' => $status,
                    'created_by' => $adminId,
                ],
            );

            $posting->skills()->sync(collect($skillNames)->map(fn ($name) => $skills[$name])->all());
        }
    }
}
