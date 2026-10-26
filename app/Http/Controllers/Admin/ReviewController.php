<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/reviews/index', [
            'reviews' => Review::query()
                ->with(['reviewrateable', 'author'])
                ->orderBy('id', 'desc')
                ->get(),
        ]);
    }

    public function update(Request $request, string $current_team, Review $review)
    {
        $data = $request->validate([
            'approved' => 'required|boolean',
        ]);

        $review->update($data);

        return redirect()->route('admin.reviews.index', ['current_team' => $current_team])->with('success', 'Review updated successfully.');
    }

    public function destroy(string $current_team, Review $review)
    {
        $review->delete();

        return redirect()->route('admin.reviews.index', ['current_team' => $current_team])->with('success', 'Review deleted successfully.');
    }
}
