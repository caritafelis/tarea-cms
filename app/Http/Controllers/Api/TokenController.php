<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Services\Auth\TeamApiTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TokenController extends Controller
{
    public function store(Request $request, TeamApiTokenService $tokens): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'abilities' => ['nullable', 'array'],
            'abilities.*' => ['string', 'max:100', function (string $attribute, mixed $value, \Closure $fail) {
                if (! \App\Support\ApiAbilities::isValid($value)) {
                    $fail("Unknown permission: {$value}.");
                }
            }],
        ]);

        $user = $request->user();
        $team = Team::query()->findOrFail($data['team_id']);
        abort_unless($user->belongsToTeam($team), 403, 'The user does not belong to this team.');
        $abilities = $data['abilities'] ?? ['*'];
        $token = $tokens->create($user, $team, $data['name'], $abilities);

        return response()->json([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
            ],
            'abilities' => $abilities,
        ], 201);
    }

    public function destroy(Request $request, int $tokenId, TeamApiTokenService $tokens): JsonResponse
    {
        $tokens->revoke($request->user(), $tokenId);

        return response()->json([
            'message' => 'Token revoked successfully.',
        ]);
    }
}
