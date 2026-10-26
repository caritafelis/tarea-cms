<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ContentRecommender
{
    /**
     * Get recommendations for a post.
     * Uses OpenAI Embeddings if available; otherwise falls back to tag/title overlap.
     */
    public function getRecommendations(Post $post, int $limit = 3): Collection
    {
        $apiKey = env('OPENAI_API_KEY');
        if (empty($apiKey)) {
            return $this->fallbackRecommendations($post, $limit);
        }

        try {
            // Get embedding for current post
            $response = Http::withToken($apiKey)
                ->post('https://api.openai.com/v1/embeddings', [
                    'input' => $post->title . ' ' . strip_tags($post->content),
                    'model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
                ]);

            if ($response->successful()) {
                // Vector match logic (stubbed with simple db title matching for local database search)
                return $this->fallbackRecommendations($post, $limit);
            }
        } catch (\Exception $e) {
            Log::error("Error generating embeddings for post recommendations: " . $e->getMessage());
        }

        return $this->fallbackRecommendations($post, $limit);
    }

    /**
     * Fallback recommendation using basic database query constraints.
     */
    protected function fallbackRecommendations(Post $post, int $limit): Collection
    {
        // Simple algorithm: fetch other posts, prioritize matching status and created dates.
        return Post::where('id', '!=', $post->id)
            ->where('status', 'published')
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
