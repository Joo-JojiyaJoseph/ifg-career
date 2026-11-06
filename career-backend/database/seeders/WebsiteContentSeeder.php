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
                'company_line' => 'A company with a heart. Four companies and around 1,000 people, growing together since 2016.',
                'banner_image' => '/images/placeholders/hero.svg',
            ],
            'company_numbers' => [
                'employees' => 1000,
                'years' => 10,
                'clients' => null,
            ],
            'about_intro' => [
                'title' => 'About the group',
                'intro' => 'One of India’s fastest growing business groups. Infolks Group started in 2016 in Mannarkkad, Kerala, as the state’s first data labeling service provider, and today runs Infolks, Webfolks, Dataways and Medrays.',
            ],
            'social_links' => [
                ['name' => 'LinkedIn', 'url' => 'https://www.linkedin.com/company/infolks-group/'],
                ['name' => 'Instagram', 'url' => 'https://instagram.com/infolks_group'],
                ['name' => 'Facebook', 'url' => 'https://www.facebook.com/profile.php?id=61575503116851'],
                ['name' => 'X', 'url' => 'https://twitter.com/Infolks_Group'],
                ['name' => 'YouTube', 'url' => 'https://www.youtube.com/channel/UC0siki2wYSW7QZ1UuSDeYsQ'],
            ],
            'footer' => [
                'copyright' => 'Infolks Group. All rights reserved.',
                'tagline' => 'A company with a heart',
                'contact_email' => 'recruitment@infolksgroup.com',
                'contact_phone' => '+91 70258 89922',
                'address' => 'Head Office, Infolks Tower, Mannarkkad, Kerala, India 678583',
            ],
            'promo_card' => [
                'headline' => 'Grow your career with Infolks Group',
                'tagline' => 'A company with a heart',
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
            ['How we work', 'Data labeling, AI data collection, medical annotation and software, delivered by teams that share one head office and one way of working.', 'UserGroupIcon'],
            ['What we provide', 'Training from day one, mentors who have done the work, and room to grow from six people to a thousand, as the group itself did.', 'AcademicCapIcon'],
            ['Our culture', 'A company with a heart. A respectful workplace where people stay because the work and the teams are worth it.', 'HeartIcon'],
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
            ['Ananya Rao', 'Annotation Specialist', 'infolks', 'I started with image annotation and now lead a LiDAR team.'],
            ['Farhan Sheikh', 'Data Collection Coordinator', 'dataways', 'The datasets we collect train real AI models, and the support is real too.'],
            ['Diya Menon', 'Frontend Developer', 'webfolks', 'Design and engineering sit together, so ideas ship quickly.'],
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
            ['Mannarkkad walk-in drive', '2026-08-12', 'Walk-in interviews at Infolks Tower, Mannarkkad.', 'drive-walkin'],
            ['Campus drive', '2026-06-03', 'Final-year students meeting teams from across Infolks Group.', 'drive-campus'],
            ['Medrays doctors panel day', '2026-04-18', 'Medrays met doctors joining its medical labeling panel.', 'drive-doctors'],
        ] as $index => [$name, $date, $caption, $image]) {
            RecruitmentDrive::query()->updateOrCreate(
                ['name' => $name],
                [
                    'drive_date' => $date,
                    'caption' => $caption,
                    'photo_path' => "/images/placeholders/{$image}.svg",
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ],
            );
        }

        foreach ([
            ['Do I need a Google account?', '<p>Yes. Candidates sign in with Google. HR users sign in with email and a password.</p>'],
            ['Can I apply to more than one role?', '<p>Yes. Each job is a separate application. A block applies only to the same role for six months after a rejection that followed a shortlist.</p>'],
            ['Where is the office?', '<p>Our head office is Infolks Tower, Mannarkkad, Kerala, India 678583. Each job lists its own location.</p>'],
        ] as $index => [$question, $answer]) {
            Faq::query()->updateOrCreate(
                ['question' => $question],
                ['answer' => $answer, 'sort_order' => $index + 1, 'is_published' => true],
            );
        }

        foreach ([
            ['ISO 27001:2013', null],
            ['EU GDPR', null],
            ['HIPAA', null],
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
