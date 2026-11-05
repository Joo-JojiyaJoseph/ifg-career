<x-mail::message>
# Application received

We received your application for **{{ $role }}** at **{{ $entityName }}**.

Thank you for applying to Infolks Group. We will be in touch if there is news to share.

<x-mail::button :url="$applicationsUrl">
View your applications
</x-mail::button>
</x-mail::message>
