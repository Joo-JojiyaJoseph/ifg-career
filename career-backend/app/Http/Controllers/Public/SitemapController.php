<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Support\CacheVersion;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

/**
 * sitemap.xml for the careers site: the landing page, job search and every open job.
 * Point the careers domain's /sitemap.xml at this route (see docs/DEPLOYMENT.md).
 */
class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = Cache::remember('sitemap:v'.CacheVersion::get('jobs').':'.today()->toDateString(), now()->addHour(), function () {
            $careers = rtrim((string) config('app.frontend_careers_url'), '/');
            $urls = [
                ['loc' => $careers.'/', 'priority' => '1.0'],
                ['loc' => $careers.'/jobs', 'priority' => '0.9'],
                ['loc' => $careers.'/jobs?level=internship', 'priority' => '0.6'],
            ];

            JobPosting::query()->open()->orderByDesc('posted_at')->limit(5000)->get(['id', 'public_id', 'slug', 'updated_at'])
                ->each(function (JobPosting $job) use (&$urls) {
                    $urls[] = ['loc' => $job->url, 'lastmod' => $job->updated_at?->toDateString(), 'priority' => '0.8'];
                });

            $body = collect($urls)->map(fn ($url) => '<url><loc>'.e($url['loc']).'</loc>'
                .(isset($url['lastmod']) ? '<lastmod>'.$url['lastmod'].'</lastmod>' : '')
                .'<priority>'.$url['priority'].'</priority></url>')->implode('');

            return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'.$body.'</urlset>';
        });

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8', 'Cache-Control' => 'public, max-age=3600']);
    }
}
