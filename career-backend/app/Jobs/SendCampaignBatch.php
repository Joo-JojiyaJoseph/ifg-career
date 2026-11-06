<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendCampaignBatch implements ShouldQueue
{
    use Batchable, Queueable;

    public int $timeout = 600;

    /**
     * @param  list<int>  $memberIds
     */
    public function __construct(public int $campaignId, public array $memberIds) {}

    public function handle(CampaignService $campaigns): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $campaign = Campaign::query()->find($this->campaignId);

        if ($campaign) {
            $campaigns->sendChunk($campaign, $this->memberIds);
        }
    }
}
