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
        $departments = Department::query()->pluck('id', 'name');
        $teams = Team::query()->pluck('id', 'name');
        $skills = Skill::query()->pluck('id', 'name');

        $rows = [
            ['Backend Engineer', 'infolks', 'Software Engineering', 'Platform', JobLevel::AllLevel, 'Kochi', JobStatus::Published, 21, ['PHP', 'Laravel', 'MySQL']],
            ['Frontend Engineer', 'webfolks', 'Software Engineering', 'Web', JobLevel::AllLevel, 'Bengaluru', JobStatus::Published, 18, ['React', 'JavaScript', 'Tailwind CSS']],
            ['Mobile Engineer', 'infolks', 'Software Engineering', 'Mobile', JobLevel::AllLevel, 'Hyderabad', JobStatus::Published, 30, ['React Native', 'Kotlin', 'REST APIs']],
            ['QA Engineer', 'infolks', 'Quality Assurance', 'QA Automation', JobLevel::AllLevel, 'Kochi', JobStatus::Published, 14, ['Test automation', 'Playwright', 'API testing']],
            ['Product Designer', 'webfolks', 'Design', 'Product Design', JobLevel::AllLevel, 'Bengaluru', JobStatus::Published, 25, ['Figma', 'UI design', 'Accessibility']],
            ['Data Engineer', 'dataways', 'Data & Analytics', 'Data Engineering', JobLevel::AllLevel, 'Pune', JobStatus::Published, 20, ['Python', 'SQL', 'Airflow']],
            ['Data Analyst', 'dataways', 'Data & Analytics', 'Data Science', JobLevel::AllLevel, 'Pune', JobStatus::Published, 12, ['SQL', 'Power BI', 'Statistics']],
            ['Machine Learning Engineer', 'dataways', 'Data & Analytics', 'Data Science', JobLevel::AllLevel, 'Hyderabad', JobStatus::Published, 28, ['Python', 'Machine learning', 'NLP']],
            ['Imaging Software Engineer', 'medrays', 'Medical Imaging', 'Radiology Products', JobLevel::AllLevel, 'Chennai', JobStatus::Published, 24, ['DICOM', 'Python', 'Medical imaging']],
            ['Clinical Application Specialist', 'medrays', 'Medical Imaging', 'Clinical Research', JobLevel::AllLevel, 'Chennai', JobStatus::Published, 16, ['Radiology workflow', 'HL7', 'Communication']],
            ['DevOps Engineer', 'infolks', 'Software Engineering', 'Platform', JobLevel::AllLevel, 'Kochi', JobStatus::Published, 5, ['Linux', 'CI/CD', 'AWS']],
            ['Technical Writer', 'webfolks', 'Operations', 'People Operations', JobLevel::AllLevel, 'Remote — India', JobStatus::Published, 19, ['Technical writing', 'Communication', 'HTML']],
            ['HR Coordinator', 'infolks', 'Human Resources', 'Talent', JobLevel::AllLevel, 'Kochi', JobStatus::Published, 10, ['Recruitment', 'Communication', 'Excel']],
            ['Business Development Associate', 'dataways', 'Business Development', 'Partnerships', JobLevel::AllLevel, 'Mumbai', JobStatus::Published, 22, ['Stakeholder management', 'Communication', 'Excel']],
            ['Software Engineering Intern', 'infolks', 'Software Engineering', 'Web', JobLevel::Internship, 'Kochi', JobStatus::Published, 15, ['JavaScript', 'HTML', 'Git']],
            ['Data Intern', 'dataways', 'Data & Analytics', 'Data Science', JobLevel::Internship, 'Pune', JobStatus::Published, 4, ['Python', 'SQL', 'Excel']],
            ['Design Intern', 'webfolks', 'Design', 'Product Design', JobLevel::Internship, 'Bengaluru', JobStatus::Draft, 40, ['Figma', 'UI design', 'Prototyping']],
            ['PACS Support Engineer', 'medrays', 'Medical Imaging', 'Radiology Products', JobLevel::AllLevel, 'Chennai', JobStatus::Draft, 35, ['PACS', 'DICOM', 'Linux']],
            ['QA Intern', 'infolks', 'Quality Assurance', 'QA Automation', JobLevel::Internship, 'Kochi', JobStatus::Closed, -2, ['Manual testing', 'API testing', 'Git']],
            ['Analytics Consultant', 'dataways', 'Data & Analytics', 'Data Science', JobLevel::AllLevel, 'Delhi', JobStatus::Closed, -5, ['Tableau', 'SQL', 'Statistics']],
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
                    'summary' => $title.' at '.$entity.'. You will work with people across Infolks Group.',
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
