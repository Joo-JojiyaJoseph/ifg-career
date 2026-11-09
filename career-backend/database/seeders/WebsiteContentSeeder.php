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
use Database\Seeders\Support\Photos;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class WebsiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'hero' => [
                'eyebrow' => 'Be part of our heart',
                'title' => 'Infolks Group',
                'motto' => 'A company with a heart',
                'company_line' => 'Founded in 2016 in Mannarkkad, Kerala, as the state’s first data labeling service provider, Infolks Group today brings together four companies: Infolks, Medrays, Webfolks and Dataways.',
                'banner_image' => Photos::INFIESTA,
            ],
            'company_numbers' => [
                'employees' => 1000,
                'years' => 10,
                'clients' => null,
            ],
            'entities_section' => [
                'title' => 'Our story has more than one way in',
                'intro' => null,
            ],
            'about_intro' => [
                'title' => 'Why Join Infolks Group',
                'intro' => "It's the shared laughter, the helping hands, the new things learned, and the little wins along the way that make a workplace special.\n\nA place where you can be yourself, discover what you're capable of, and grow alongside people who cheer you on. Because the best things are built together.",
            ],
            'interview_section' => [
                'eyebrow' => 'How we hire',
                'title' => 'Our Recruitment Process',
                'image' => Photos::WORK_LIFE_BALANCE,
            ],
            'quick_apply_section' => [
                'title' => 'Your story could begin here',
                'intro' => "Not sure which role is right for you? That's okay.\n\nTell us a little about yourself, your interests, and your qualifications. Share your profile with us, and we'll consider you for suitable opportunities across Infolks Group.",
                'image' => Photos::GENDER_EQUALITY,
            ],
            'faq_section' => [
                'title' => 'A few things you might want to know',
            ],
            'social_links' => [
                ['name' => 'Instagram', 'url' => 'https://instagram.com/infolks_group'],
                ['name' => 'Facebook', 'url' => 'https://www.facebook.com/profile.php?id=61575503116851'],
                ['name' => 'LinkedIn', 'url' => 'https://www.linkedin.com/company/infolks-group/'],
                ['name' => 'YouTube', 'url' => 'https://www.youtube.com/channel/UC0siki2wYSW7QZ1UuSDeYsQ'],
            ],
            'footer' => [
                // Removed from the page in the October 2026 corrections; HR can add a heading again in Website Content.
                'closing_title' => null,
                'closing_text' => 'Every new person brings a new perspective, a new possibility, and another story to be part of. We look forward to discovering yours.',
                'copyright' => 'Infolks Group. All Rights Reserved.',
                'tagline' => 'A company with a heart',
                'contact_email' => 'recruitment@infolksgroup.com',
                'contact_phone' => '+91 70258 89922',
                'address' => 'Head Office, Infolks Tower, Mannarkkad, Kerala, India 678583',
            ],
            'promo_card' => [
                'headline' => 'Be part of our heart',
                'tagline' => 'A company with a heart',
                'image' => Photos::INFIESTA,
            ],
            'quick_apply_confirmation_text' => [
                'title' => 'Thank you for sharing your profile with us!',
                'body' => "We've received your application. Our HR team will review your details and get in touch if a suitable opportunity matches your profile.",
            ],
        ];

        foreach ($settings as $key => $value) {
            SiteSetting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }

        $this->publishOnly(AboutBlock::class, 'title', [
            ['How We Work', ['body' => 'We believe everyone deserves an equal opportunity to learn, contribute, and move forward. With open communication, fair practices, and trust in individual abilities, we encourage people to do their best work in their own way.', 'heroicon_name' => 'UserGroupIcon']],
            ['What We Provide', ['body' => 'Your growth matters beyond your work. From learning opportunities and employee benefits to health support and a balanced workday, we care about making your professional journey fulfilling.', 'heroicon_name' => 'AcademicCapIcon']],
            ['Our Culture', ['body' => 'Work is only one part of what brings us together. Festival celebrations, football tournaments, company trips, birthday celebrations, and everyday conversations make up our worklife. We find reasons to celebrate, moments to connect, and many ways to make memories together.', 'heroicon_name' => 'HeartIcon']],
        ]);

        $this->publishOnly(InterviewStep::class, 'name', [
            ['Apply', ['description' => 'Found a role that interests you? Send us your application and tell us about your experience, skills, and what makes you a good fit.']],
            ['Screening', ['description' => 'Our HR team reviews your application, qualifications, and experience to understand how well your profile matches the role.']],
            ['Round 1: Skill Test', ['description' => 'A role-specific test or task that gives us a closer look at your skills, knowledge, and approach to work.']],
            ['Round 2: HR Round', ['description' => 'A conversation with our HR team to get to know you better, understand your experience, and hear about your interests and career goals.']],
            ['Final Result', ['description' => 'Once the interview process is complete, our HR team will share the outcome. For selected candidates, this is where the journey towards becoming part of Infolks Group begins.']],
        ]);

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

        $this->publishOnly(Faq::class, 'question', [
            ['How can I explore current job openings at Infolks Group?', ['answer' => '<p>Visit our Job Search page to explore available opportunities across Infolks, Webfolks, Dataways, and Medrays. You can view the details and apply for positions that match your interests and qualifications.</p>']],
            ['Can I apply without selecting a specific job?', ['answer' => '<p>Yes. You can use our Quick Apply section to submit your profile without choosing a particular vacancy. Our HR team can consider your profile for suitable opportunities across the group.</p>']],
            ['Does Infolks Group offer internship opportunities?', ['answer' => '<p>Yes. You can explore available internship opportunities through the Internship option in the top bar of our Careers page.</p>']],
            ['Can I apply for more than one position?', ['answer' => '<p>Yes. You can apply for positions that match your qualifications and interests. Please ensure that your application details are accurate.</p><p>If you were shortlisted for a role and then not selected, you can apply for that same role again after 6 months. All other roles remain open to you.</p>']],
            ['How will I know the status of my application?', ['answer' => '<p>Sign in with your Google account and select Candidate profile in the top bar. It shows the current status of each application you have made. Our HR team does not contact candidates for every update, so please check your status there.</p>']],
            ['Can I create a profile for future opportunities?', ['answer' => '<p>Yes. Sign in using your Google account to create a candidate profile and stay connected with future opportunities.</p>']],
            ['What happens after I submit my application?', ['answer' => '<p>Once you submit, you will receive a confirmation email, and your details will be available to our HR team for review. If your profile matches a suitable opportunity, the team will contact you.</p>']],
        ]);

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

        // Culture photos shown beside "Why Join Infolks Group". HR replaces them with real team photos.
        MediaItem::query()->where('title', 'Life at the group')->update(['is_published' => false]);

        foreach (['Festival celebrations', 'Everyday conversations', 'Company trips', 'Reasons to celebrate'] as $stock) {
            MediaItem::query()->where('title', $stock)->update(['is_published' => false]);
        }

        foreach ([
            ['Infiesta, our annual day', 'The whole group together at Infiesta, the annual celebration.', Photos::INFIESTA],
            ['Infolks Football League', 'Teams from across the group compete in the Infolks Football League.', Photos::FOOTBALL_LEAGUE],
            ['Annual team outings', 'Trips that turn teammates into friends.', Photos::TEAM_OUTINGS],
            ['Celebration corner', 'Birthdays, festivals and little wins, celebrated together.', Photos::CELEBRATION_CORNER],
            ['Our football team', 'The Infolks Group football team.', Photos::FOOTBALL_TEAM],
        ] as $index => [$title, $caption, $photo]) {
            MediaItem::query()->updateOrCreate(
                ['title' => $title],
                [
                    'type' => MediaType::Activity,
                    'caption' => $caption,
                    'photo_path' => $photo,
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ],
            );
        }
    }

    /**
     * Creates or updates the given items in this order and hides any other published items of the same kind,
     * so the page shows exactly the career page copy. Nothing is deleted.
     *
     * @param  class-string<Model>  $model
     * @param  list<array{0: string, 1: array<string, mixed>}>  $items
     */
    private function publishOnly(string $model, string $key, array $items): void
    {
        foreach ($items as $index => [$name, $attributes]) {
            $model::query()->updateOrCreate([$key => $name], $attributes + ['sort_order' => $index + 1, 'is_published' => true]);
        }

        $model::query()->whereNotIn($key, array_column($items, 0))->update(['is_published' => false]);
    }
}
