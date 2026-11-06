<?php

namespace App\Notifications;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationType;
use App\Models\Application;

class NewApplicationReceived extends HrNotification
{
    public function __construct(public Application $application)
    {
        $this->afterCommit();
    }

    public function type(): string
    {
        return match (true) {
            $this->application->type === ApplicationType::General => 'new_quick_apply',
            $this->application->referred || $this->application->source === ApplicationSource::Referral => 'referred_application',
            default => 'new_application',
        };
    }

    protected function payload(): array
    {
        $application = $this->application->loadMissing(['candidate', 'entity', 'jobPosting', 'department']);
        $who = $application->candidate?->name ?? 'A candidate';
        $role = $application->display_role;

        return [
            'title' => match ($this->type()) {
                'new_quick_apply' => 'New Quick apply application',
                'referred_application' => 'New referred application',
                default => 'New application',
            },
            'message' => $who.' applied for '.$role.($application->entity ? ' at '.$application->entity->name : '').'.',
            'url' => '/applications?candidate='.$application->candidate?->public_id,
            'level' => 'info',
            'application_id' => $application->public_id,
        ];
    }
}
