<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class EmailVerificationCode
{
    private const TTL_MINUTES = 15;
    private const MAX_ATTEMPTS = 5;

    private static function key(User $user): string
    {
        return "email_verify_code:{$user->id}";
    }

    private static function digest(string $code): string
    {
        return hash_hmac('sha256', $code, config('app.key'));
    }

    public static function issue(User $user): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put(self::key($user), ['digest' => self::digest($code), 'attempts' => 0], now()->addMinutes(self::TTL_MINUTES));

        return $code;
    }

    public static function check(User $user, string $input): bool
    {
        $data = Cache::get(self::key($user));

        if (! $data || $data['attempts'] >= self::MAX_ATTEMPTS) {
            return false;
        }

        if (hash_equals($data['digest'], self::digest($input))) {
            Cache::forget(self::key($user));

            return true;
        }

        $data['attempts']++;
        Cache::put(self::key($user), $data, now()->addMinutes(self::TTL_MINUTES));

        return false;
    }
}