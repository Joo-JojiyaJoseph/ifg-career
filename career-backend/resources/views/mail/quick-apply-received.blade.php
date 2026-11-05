<x-mail::message>
# Application received

{{ $confirmation }}

This was a general application for **{{ $department }}**.

<x-mail::button :url="$careersUrl">
Infolks Group Careers
</x-mail::button>
</x-mail::message>
