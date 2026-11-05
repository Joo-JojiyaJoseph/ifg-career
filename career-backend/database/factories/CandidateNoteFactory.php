<?php

namespace Database\Factories;

use App\Models\Candidate;
use App\Models\CandidateNote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<CandidateNote> */
class CandidateNoteFactory extends Factory
{
    protected $model = CandidateNote::class;

    public function definition(): array
    {
        return [
            'candidate_id' => Candidate::factory(),
            'user_id' => User::factory(),
            'body' => 'Spoke with the candidate about the role and next steps.',
        ];
    }
}
