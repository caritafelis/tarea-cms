<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AIInsight;
use App\Models\Page;
use App\Models\Post;
use App\Services\LLMDetector;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AIInsightsController extends Controller
{
    protected $detector;

    public function __construct(LLMDetector $detector)
    {
        $this->detector = $detector;
    }

    public function index(string $current_team)
    {
        $insights = AIInsight::with(['post', 'page'])->orderBy('created_at', 'desc')->get();
        $posts = Post::orderBy('created_at', 'desc')->get();
        $pages = Page::orderBy('created_at', 'desc')->get();

        return Inertia::render('admin/ai-insights/index', [
            'insights' => $insights,
            'posts' => $posts,
            'pages' => $pages,
        ]);
    }

    public function detect(Request $request, string $current_team)
    {
        $request->validate([
            'post_id' => 'nullable|exists:posts,id',
            'page_id' => 'nullable|exists:pages,id',
        ]);

        if (! $request->post_id && ! $request->page_id) {
            return redirect()->back()->withErrors(['error' => 'You must select a post or a page.']);
        }

        $text = '';
        if ($request->post_id) {
            $post = Post::find($request->post_id);
            $text = $post->title."\n".strip_tags($post->content);
        } else {
            $page = Page::find($request->page_id);
            $text = $page->title."\n".strip_tags($page->content);
        }

        $result = $this->detector->detect($text);

        if (! $result['success']) {
            return redirect()->back()->withErrors(['error' => $result['result']]);
        }

        AIInsight::create([
            'post_id' => $request->post_id,
            'page_id' => $request->page_id,
            'llm_score' => $result['score'],
            'llm_detection_result' => $result['result'],
            'recommendations' => [],
        ]);

        return redirect()->route('admin.ai-insights.index', ['current_team' => $current_team])->with('success', 'AI Insights analysis complete.');
    }
}
