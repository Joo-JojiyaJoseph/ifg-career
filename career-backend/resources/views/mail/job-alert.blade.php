<x-mail::message>
# New roles at Infolks Group

Hello {{ $recipientName }},

@if ($bodyHtml)
{!! $bodyHtml !!}
@else
Here are new openings you might like.
@endif

@foreach ($jobs as $job)
<x-mail::panel>
**[{{ $job['title'] }}]({{ $job['url'] }})**<br>
{{ collect([$job['entity'], $job['location'], $job['level']])->filter()->implode(' · ') }}
@if ($job['closes'])
<br>Apply by {{ $job['closes'] }}
@endif
</x-mail::panel>
@endforeach

<x-mail::button :url="$careersUrl">
See all open roles
</x-mail::button>

<x-mail::subcopy>
You are receiving this because you joined the Infolks Group talent community. [Unsubscribe]({{ $unsubscribeUrl }}) from job alerts and updates at any time. Application confirmations are still sent.
</x-mail::subcopy>
</x-mail::message>
