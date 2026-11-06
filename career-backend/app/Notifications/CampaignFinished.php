<?php

namespace App\Notifications;

use App\Enums\CampaignStatus;
use App\Models\Campaign;

class CampaignFinished extends HrNotification
{
    public function __construct(public Campaign $campaign) {}

    public function type(): string
    {
        return 'campaign_finished';
    }

    protected function payload(): array
    {
        $failed = $this->campaign->status === CampaignStatus::Failed;

        return [
            'title' => $failed ? 'Campaign could not be sent' : 'Campaign sent',
            'message' => '"'.$this->campaign->subject.'" '
                .($failed ? 'failed. ' : 'was sent to '.$this->campaign->sent_count.' members. ')
                .($this->campaign->failed_count ? $this->campaign->failed_count.' emails failed.' : ''),
            'url' => '/talent?view=campaigns&campaign='.$this->campaign->public_id,
            'level' => $failed ? 'danger' : ($this->campaign->failed_count ? 'warning' : 'success'),
            'campaign_id' => $this->campaign->public_id,
        ];
    }
}
