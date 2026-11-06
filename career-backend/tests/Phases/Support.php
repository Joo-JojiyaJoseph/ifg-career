<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

if (! function_exists('actingAsHr')) {
    /**
     * Create an active HR portal user with the given role and sign them in on the web guard.
     */
    function actingAsHr(string $role = 'HR', array $attributes = []): User
    {
        test()->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create($attributes + ['is_active' => true]);
        $user->assignRole($role);
        test()->actingAs($user, 'web');

        return $user;
    }
}

if (! function_exists('fakeGoogleServiceAccount')) {
    /**
     * Write a throwaway Google service account key file and point the calendar config at it.
     */
    function fakeGoogleServiceAccount(): string
    {
        $dir = storage_path('framework/testing');
        @mkdir($dir, 0777, true);
        $config = $dir.'/openssl.cnf';
        file_put_contents($config, "[req]\ndistinguished_name=dn\n[dn]\n");
        $options = ['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA, 'config' => $config];
        $key = openssl_pkey_new($options);
        openssl_pkey_export($key, $pem, null, $options);

        $path = $dir.'/google-calendar.json';
        file_put_contents($path, json_encode([
            'client_email' => 'sa@test.iam.gserviceaccount.com',
            'private_key' => $pem,
            'token_uri' => 'https://oauth2.googleapis.com/token',
        ]));

        config([
            'services.google.calendar_id' => 'hr@infolksgroup.com',
            'services.google.calendar_credentials' => $path,
            'services.google.calendar_impersonate' => null,
        ]);

        return $path;
    }
}
