<x-mail::message>
# {{ $subjectLine }}

Hello {{ $recipientName }},

{!! $bodyHtml !!}

<x-mail::button :url="$careersUrl">
Visit Infolks Group Careers
</x-mail::button>

<x-mail::subcopy>
You are receiving this because you joined the Infolks Group talent community. [Unsubscribe]({{ $unsubscribeUrl }}) from job alerts and updates at any time. Application confirmations are still sent.
</x-mail::subcopy>
</x-mail::message>
