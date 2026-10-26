<?php

use App\Http\Middleware\EnsureCanSyncPermissions;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetCurrentTeamPermissions;
use App\Http\Middleware\SetTeamUrlDefaults;
use App\Http\Middleware\EnsureTeamHasModule;
use App\Http\Middleware\EnsureOnboarding;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\StripLockedFields;
use App\Http\Middleware\CapturePlanIntent;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use LaravelJsonApi\Core\Exceptions\JsonApiException;
use LaravelJsonApi\Exceptions\ExceptionParser;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            SetCurrentTeamPermissions::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetTeamUrlDefaults::class,
            CapturePlanIntent::class,
        ]);
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'set.current.team.permissions' => SetCurrentTeamPermissions::class,
            'system.permission.sync' => EnsureCanSyncPermissions::class,
            'module' => EnsureTeamHasModule::class,
            'onboarding' => EnsureOnboarding::class,
            'superadmin' => EnsureSuperAdmin::class,
            'strip.locked' => StripLockedFields::class,
        ]);

        $middleware->validateCsrfTokens(except: ['webhooks/*']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReport(JsonApiException::class);
        $exceptions->render(ExceptionParser::renderer());
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();