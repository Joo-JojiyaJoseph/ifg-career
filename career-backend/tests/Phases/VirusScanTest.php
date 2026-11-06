<?php

use App\Rules\VirusFree;
use App\Services\VirusScanner;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

uses(TestCase::class);

function scannerReturning(string $result): void
{
    app()->instance(VirusScanner::class, new class($result) extends VirusScanner
    {
        public function __construct(private string $result) {}

        public function scan(string $path): string
        {
            return $this->result;
        }
    });
}

it('reads clamd replies', function () {
    expect(VirusScanner::parse("stream: OK\0"))->toBe(VirusScanner::CLEAN)
        ->and(VirusScanner::parse("stream: Eicar-Test-Signature FOUND\0"))->toBe(VirusScanner::INFECTED)
        ->and(VirusScanner::parse('INSTREAM size limit exceeded. ERROR'))->toBe(VirusScanner::UNAVAILABLE);
});

it('treats every file as clean when ClamAV is not configured', function () {
    config(['services.clamav.host' => null, 'services.clamav.socket' => null]);
    $file = UploadedFile::fake()->create('resume.pdf', 10, 'application/pdf');

    expect((new VirusScanner)->scan($file->getRealPath()))->toBe(VirusScanner::CLEAN);
});

it('rejects infected uploads', function () {
    scannerReturning(VirusScanner::INFECTED);
    $validator = Validator::make(['resume' => UploadedFile::fake()->create('resume.pdf', 10)], ['resume' => [new VirusFree]]);

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->first('resume'))->toContain('virus check');
});

it('refuses uploads when the scanner is down unless fail-open is set', function () {
    scannerReturning(VirusScanner::UNAVAILABLE);
    $file = UploadedFile::fake()->create('resume.pdf', 10);

    config(['services.clamav.fail_open' => false]);
    expect(Validator::make(['resume' => $file], ['resume' => [new VirusFree]])->fails())->toBeTrue();

    config(['services.clamav.fail_open' => true]);
    expect(Validator::make(['resume' => $file], ['resume' => [new VirusFree]])->fails())->toBeFalse();
});

it('reports a closed ClamAV port as unavailable', function () {
    config(['services.clamav.host' => '127.0.0.1:1', 'services.clamav.timeout' => 1]);
    $file = UploadedFile::fake()->create('resume.pdf', 10);

    expect((new VirusScanner)->scan($file->getRealPath()))->toBe(VirusScanner::UNAVAILABLE);
});
