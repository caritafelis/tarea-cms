<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\NormalizeTeamCurrencies as NormalizeTeamCurrenciesJob;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CurrencyCorrectionController extends Controller
{
    public function store(Request $request, string $current_team): RedirectResponse
    {
        $teamId = $request->user()->currentTeam->id;

        NormalizeTeamCurrenciesJob::dispatch($teamId);

        return redirect()
            ->route('admin.settings.index', ['current_team' => $current_team])
            ->with('success', 'The normalization of your records has started in the background. We will notify you when it finishes.');
    }
}
