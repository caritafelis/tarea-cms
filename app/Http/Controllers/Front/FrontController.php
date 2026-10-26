<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Product;
use Inertia\Inertia;

class FrontController extends Controller
{
    public function showPost(string $slug)
    {
        $post = Post::where('slug', $slug)->firstOrFail();

        return Inertia::render('Front/PostShow', [
            'post' => $post,
        ]);
    }

    public function showProduct(string $slug)
    {
        $product = Product::where('slug', $slug)->firstOrFail();

        return Inertia::render('Front/ProductShow', [
            'product' => $product,
        ]);
    }

    public function checkout()
    {
        // 'status' no existe en Product tras la consolidación con Core;
        // el equivalente real es is_visible (+ published_at si se quiere
        // exigir que ya esté publicado).
        $products = Product::where('is_visible', true)
            ->where('published_at', '<=', now())
            ->get();

        return Inertia::render('Front/Checkout', [
            'products' => $products,
        ]);
    }
}
