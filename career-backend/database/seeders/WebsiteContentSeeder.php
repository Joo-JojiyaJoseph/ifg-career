<?php

namespace Database\Seeders;

use App\Enums\MediaType;
use App\Models\AboutBlock;
use App\Models\EmployeeStory;
use App\Models\Entity;
use App\Models\Faq;
use App\Models\InterviewStep;
use App\Models\MediaItem;
use App\Models\Recognition;
use App\Models\RecruitmentDrive;
use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class WebsiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'hero' => [
                'motto' => 'Grow your career with Infolks Group',
                'company_line' => 'Engineering, data, design and medical imaging teams, hiring across India.',
                'banner_image' => '/images/placeholders/hero.svg',
            ],
            'company_numbers' => [
                'employees' => 1200,
                'years' => 18,
                'clients' => 240,
            ],
            'about_intro' => [
                'title' => 'About the group',
                'intro' => 'Infolks Group is the parent company of Infolks, Webfolks, Dataways and Medrays.',
            ],
            'social_links' => [
                ['name' => 'LinkedIn', 'url' => 'https://www.linkedin.com/company/infolks-group'],
                ['name' => 'Instagram', 'url' => 'https://www.instagram.com/'],
                ['name' => 'Facebook', 'url' => 'https://www.facebook.com/'],
                ['name' => 'YouTube', 'url' => 'https://www.youtube.com/'],
            ],
            'footer' => [
                'copyright' => 'Infolks Group. All rights reserved.',
            ],
            'promo_card' => [
                'headline' => 'Grow your career with Infolks Group',
                'tagline' => 'Innovate • Learn • Belong',
                'image' => '/images/placeholders/promo.svg',
            ],
            'quick_apply_confirmation_text' => [
                'title' => 'Application received',
                'body' => 'Thank you. A recruiter at Infolks Group will review your profile.',
            ],
        ];

        foreach ($settings as $key => $value) {
            SiteSetting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }

        $blocks = [
            ['How we work', 'Small cross-entity teams ship in the open and review each other’s work.', 'UserGroupIcon'],
            ['What we provide', 'Learning time, mentorship and the tools to do careful work.', 'AcademicCapIcon'],
            ['Our culture', 'A respectful workplace. People stay because the work and the teams are worth it.', 'HeartIcon'],
        ];

        foreach ($blocks as $index => [$title, $body, $icon]) {
            AboutBlock::query()->updateOrCreate(
                ['title' => $title],
                ['body' => $body, 'heroicon_name' => $icon, 'sort_order' => $index + 1, 'is_published' => true],
            );
        }

        $steps = [
            ['Apply', 'Submit your profile and resume for a role, or send a general application.'],
            ['Review', 'A recruiter reads your application. We only write when there is news to share.'],
            ['Conversation', 'A short conversation with the hiring team about the work itself.'],
            ['Decision', 'We tell you the outcome. Selected candidates are handed to HR for the next steps.'],
        ];

        foreach ($steps as $index => [$name, $description]) {
            InterviewStep::query()->updateOrCreate(
                ['name' => $name],
                ['description' => $description, 'sort_order' => $index + 1, 'is_published' => true],
            );
        }

        $entities = Entity::query()->pluck('id', 'slug');
        $stories = [
            ['Ananya Rao', 'Software Engineer', 'infolks', 'I joined for the product work and stayed for the people.'],
            ['Farhan Sheikh', 'Data Analyst', 'dataways', 'The questions we get are real, and so is the support.'],
            ['Diya Menon', 'Designer', 'webfolks', 'Design sits with engineering, not in a separate queue.'],
        ];

        foreach ($stories as $index => [$name, $role, $entity, $quote]) {
            EmployeeStory::query()->updateOrCreate(
                ['name' => $name, 'role' => $role],
                [
                    'entity_id' => $entities[$entity],
                    'quote' => $quote,
                    'photo_path' => '/images/placeholders/story.svg',
                    'publish_permission_confirmed' => true,
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ],
            );
        }

        foreach ([
            ['Kochi campus drive', '2026-08-12', 'Students talking with engineers from Infolks Group.'],
            ['Hyderabad open house', '2026-06-03', 'A Saturday open house at the Hyderabad office.'],
            ['Chennai clinical workshop', '2026-04-18', 'Medrays hosted a workshop with imaging specialists.'],
        ] as $index => [$name, $date, $caption]) {
            RecruitmentDrive::query()->updateOrCreate(
                ['name' => $name],
                [
                    'drive_date' => $date,
                    'caption' => $caption,
                    'photo_path' => '/images/placeholders/drive.svg',
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ],
            );
        }

        foreach ([
            ['Do I need a Google account?', '<p>Yes. Candidates sign in with Google. HR users sign in with email and a password.</p>'],
            ['Can I apply to more than one role?', '<p>Yes. Each job is a separate application. A block applies only to the same role for six months after a rejection that followed a shortlist.</p>'],
            ['Where is the office?', '<p>Teams work from Kochi, Bengaluru, Hyderabad, Pune, Chennai and other Indian cities. Each job lists its location.</p>'],
        ] as $index => [$question, $answer]) {
            Faq::query()->updateOrCreate(
                ['question' => $question],
                ['answer' => $answer, 'sort_order' => $index + 1, 'is_published' => true],
            );
        }

        foreach ([
            ['Great Place to Work', 2025],
            ['ISO 27001', 2024],
        ] as $index => [$name, $year]) {
            Recognition::query()->updateOrCreate(
                ['name' => $name],
                [
                    'year' => $year,
                    'badge_path' => '/images/placeholders/badge.svg',
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ],
            );
        }

        MediaItem::query()->updateOrCreate(
            ['title' => 'Life at the group'],
            [
                'type' => MediaType::Activity,
                'caption' => 'A regular week in the office.',
                'photo_path' => '/images/placeholders/activity.svg',
                'sort_order' => 1,
                'is_published' => true,
            ],
        );
    }
}
