<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\EmailVerificationCode;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class VerifyEmailCodeController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            $request->validate(['code' => ['required', 'digits:6']]);

            if (! EmailVerificationCode::check($user, $request->string('code')->toString())) {
                throw ValidationException::withMessages(['code' => 'The code is invalid or has expired.']);
            }

            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect()->route('onboarding.show');
    }
}