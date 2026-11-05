<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class IneligibleApplicationException extends Exception
{
    /**
     * @param  array{eligible: bool, code: ?string, until: ?string, message: ?string}  $result
     */
    public function __construct(public array $result)
    {
        parent::__construct($result['message'] ?? 'This application cannot be accepted.');
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->result['message'],
            'code' => $this->result['code'],
            'until' => $this->result['until'],
            'errors' => [
                'application' => [$this->result['message']],
            ],
        ], 422);
    }
}
