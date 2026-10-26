<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Passkeys\Passkey;

class PasskeyController extends Controller
{
    public function update(Request $request, Passkey $passkey)
    {
        abort_unless(
            $passkey->user_id === $request->user()->id,
            403
        );

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $passkey->update($validated);

        return back();
    }
}
