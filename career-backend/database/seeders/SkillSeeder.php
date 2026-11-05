<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SkillSeeder extends Seeder
{
    public const NAMES = [
        'PHP', 'Laravel', 'JavaScript', 'React', 'HTML', 'CSS', 'Tailwind CSS', 'MySQL', 'REST APIs',
        'Git', 'Python', 'SQL', 'Data modelling', 'ETL', 'Pandas', 'Machine learning', 'Statistics',
        'Power BI', 'Excel', 'DICOM', 'Medical imaging', 'PACS', 'Radiology workflow', 'HL7',
        'Figma', 'UI design', 'UX research', 'Prototyping', 'Design systems', 'Accessibility',
        'Manual testing', 'Test automation', 'Playwright', 'API testing', 'Regression testing',
        'Node.js', 'TypeScript', 'Vue', 'Next.js', 'Redis', 'Docker', 'Linux', 'AWS', 'CI/CD',
        'Communication', 'Stakeholder management', 'Recruitment', 'Technical writing',
        'Android', 'Kotlin', 'Swift', 'React Native', 'PostgreSQL', 'MongoDB', 'Elasticsearch',
        'Tableau', 'dbt', 'Airflow', 'Computer vision', 'NLP', 'Quality systems',
    ];

    public function run(): void
    {
        foreach (self::NAMES as $name) {
            Skill::query()->updateOrCreate(
                ['name' => $name],
                ['slug' => Str::slug($name), 'is_active' => true],
            );
        }
    }
}
