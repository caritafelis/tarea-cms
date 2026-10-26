<?php

namespace App\Http\Controllers\Teams;

use App\Actions\Teams\CreateTeam;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\DeleteTeamRequest;
use App\Http\Requests\Teams\SaveTeamRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('teams/index', [
            'teams' => $request->user()->toUserTeams(includeCurrent: true),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('teams/create', [
            'plan' => $request->user()->currentTeam?->activeSubscription()?->plan?->name ?? 'Free',
            'marketingUrl' => config('app.marketing_url'),
        ]);
    }

    public function store(Request $request, CreateTeam $createTeam): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'organization_type' => ['required', 'in:company,individual'],
            'billing_address' => ['nullable', 'string', 'max:500'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'icon' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
        ]);

        $team = $createTeam->handle($request->user(), $data['name']);

        $team->update([
            'organization_type' => $data['organization_type'],
            'billing_address' => $data['billing_address'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'icon_path' => $request->file('icon')?->store('team-icons', 'public'),
        ]);

        $request->user()->switchTeam($team);

        return to_route('onboarding.show');
    }

    public function edit(Request $request, Team $team): Response
    {
        $user = $request->user();

        return Inertia::render('teams/edit', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
                'isPersonal' => $team->is_personal,
            ],
            'logoUrl' => $team->logo_url,
            'members' => $team->members()->get()->map(fn($member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'avatar' => $member->avatar ?? null,
                'role' => $member->pivot->role,
                'role_label' => ucfirst(strtolower($member->pivot->role)),
            ]),
            'invitations' => $team->invitations()
                ->whereNull('accepted_at')
                ->get()
                ->map(fn($invitation) => [
                    'code' => $invitation->code,
                    'email' => $invitation->email,
                    'role' => $invitation->role,
                    'role_label' => ucfirst(strtolower($invitation->role)),
                    'created_at' => $invitation->created_at->toISOString(),
                ]),
            'permissions' => $user->toTeamPermissions($team),
            'availableRoles' => Role::where('team_id', $team->id)
                ->where('name', '!=', 'Owner')
                ->pluck('name'),
        ]);
    }

    public function update(SaveTeamRequest $request, Team $team): RedirectResponse
    {
        Gate::authorize('update', $team);

        $team = DB::transaction(function () use ($request, $team) {
            $team = Team::whereKey($team->id)->lockForUpdate()->firstOrFail();
            $team->update(['name' => $request->validated('name')]);

            if ($request->hasFile('logo')) {
                $team->addMediaFromRequest('logo')->toMediaCollection('logo');
            } elseif ($request->boolean('remove_logo')) {
                $team->clearMediaCollection('logo');
            }

            return $team;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team updated.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }

    public function switch(Request $request, Team $team): RedirectResponse
    {
        abort_unless($request->user()->belongsToTeam($team), 403);

        $request->user()->switchTeam($team);

        return back();
    }

    public function destroy(DeleteTeamRequest $request, Team $team): RedirectResponse
    {
        $user = $request->user();
        $fallbackTeam = $user->isCurrentTeam($team)
            ? $user->fallbackTeam($team)
            : null;

        DB::transaction(function () use ($user, $team) {
            User::where('current_team_id', $team->id)
                ->where('id', '!=', $user->id)
                ->each(fn(User $affectedUser) => $affectedUser->switchTeam($affectedUser->personalTeam()));

            $team->invitations()->delete();
            $team->memberships()->delete();

            Role::where('team_id', $team->id)->each(function (Role $role) {
                $role->users()->detach();
                $role->permissions()->detach();
                $role->delete();
            });

            $team->delete();
        });

        if ($fallbackTeam) {
            $user->switchTeam($fallbackTeam);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team deleted.')]);

        return to_route('teams.index');
    }
}