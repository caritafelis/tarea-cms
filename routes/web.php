<?php

use App\Http\Controllers\Admin\AIInsightsController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\CptController;
use App\Http\Controllers\Admin\CptEntryController;
use App\Http\Controllers\Admin\EmailController;
use App\Http\Controllers\Admin\LanguageController;
use App\Http\Controllers\Admin\LegalController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MediaFolderController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\PluginController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\TemporaryUploadController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\PasskeyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Front\FrontController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Auth\VerifyEmailCodeController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\DownloadController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Http\Middleware\SetCurrentTeamPermissions;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::post('/tokens/create', function (Request $request) {
    $token = $request->user()->createToken($request->token_name);

    return ['token' => $token->plainTextToken];
});

Route::get('downloads/{token}', [DownloadController::class, 'show'])
    ->middleware('throttle:30,1')
    ->name('downloads.show');

Route::post('/email/verify-code', VerifyEmailCodeController::class)
    ->middleware(['auth', 'throttle:6,1'])
    ->name('verification.code');

Route::middleware(['auth', 'verified'])->prefix('onboarding')->group(function () {
    Route::get('/', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/free', [OnboardingController::class, 'free']);
    Route::post('/business', [OnboardingController::class, 'business']);
    Route::post('/checkout', [OnboardingController::class, 'checkout']);
    Route::get('/paypal/return', [OnboardingController::class, 'paypalReturn']);
});

Route::post('/webhooks/{gateway}', WebhookController::class);

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class, SetCurrentTeamPermissions::class, 'onboarding', 'strip.locked'])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::prefix('profile')->name('profile.')->group(function () {
                Route::get('/', [ProfileController::class, 'edit'])->name('edit');
                Route::patch('/', [ProfileController::class, 'update'])->name('update');
                Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
            });
            Route::prefix('security')->name('security.')->group(function () {
                Route::get('/', [SecurityController::class, 'edit'])->name('edit');
                Route::put('password', [SecurityController::class, 'update'])
                    ->middleware('throttle:6,1')->name('user-password.update');
                Route::post('password/send-code', [SecurityController::class, 'sendPasswordChangeCode'])
                    ->middleware('throttle:6,1')->name('password.send-code');
                Route::post('password/verify-code', [SecurityController::class, 'verifyPasswordChangeCode'])
                    ->middleware('throttle:10,1')->name('password.verify-code');
                Route::post('password/cancel', [SecurityController::class, 'cancelPasswordChangeVerification'])
                    ->name('password.cancel');
                Route::delete('devices/{sessionId}', [SecurityController::class, 'destroySession'])
                    ->name('devices.destroy');
            });
        });
        
        Route::middleware(['web'])
            ->name('admin.')
            ->group(function () {
                Route::middleware('module:cms')->group(function () {
                    // Content
                    Route::middleware(['permission:view_any_post'])
                        ->prefix('posts')->name('posts.')->group(function () {
                            Route::get('/', [PostController::class, 'index'])->name('index');
                            Route::post('/', [PostController::class, 'store'])->name('store');
                            Route::get('/create', [PostController::class, 'create'])->name('create');
                            Route::prefix('{post}')->group(function () {
                                Route::get('/edit', [PostController::class, 'edit'])->name('edit');
                                Route::get('/edit-data', [PostController::class, 'editData'])->name('edit-data');
                                Route::put('/', [PostController::class, 'update'])->name('update');
                                Route::delete('/', [PostController::class, 'destroy'])->name('destroy');
                            });
                        });

                    Route::middleware(['permission:view_any_page'])->resource('pages', PageController::class);

                    Route::middleware(['permission:view_any_legal'])
                        ->resource('legals', LegalController::class)->except(['show', 'create', 'edit']);

                        // Dynamic fields
                    Route::middleware(['permission:view_any_cpt'])->group(function () {
                        Route::resource('acf', CptController::class)->names('acf');
                        Route::prefix('cpt')->name('cpt.')->group(function () {
                            Route::prefix('{cpt:slug}')->name('entries.')->group(function () {
                                Route::get('/', [CptEntryController::class, 'index'])->name('index');
                                Route::get('/create', [CptEntryController::class, 'create'])->name('create');
                                Route::post('/', [CptEntryController::class, 'store'])->name('store');
                                Route::get('/{entry}', [CptEntryController::class, 'edit'])->name('edit');
                                Route::put('/{entry}', [CptEntryController::class, 'update'])->name('update');
                                Route::delete('/{entry}', [CptEntryController::class, 'destroy'])->name('destroy');
                            });
                        });
                    });
        
                });
            
                // Languages
                Route::middleware('module:multilanguage')->group(function () {
                    Route::middleware(['permission:view_any_language'])->group(function () {
                        Route::get('languages', [LanguageController::class, 'index'])->name('languages.index');
                        Route::post('languages', [LanguageController::class, 'update'])->name('languages.update');
                    });
                });

                // AI
                Route::middleware('module:ai_insights')->group(function () {
                    Route::middleware(['permission:view_any_ai_insight'])->group(function () {
                        Route::get('ai-insights', [AIInsightsController::class, 'index'])->name('ai-insights.index');
                        Route::post('ai-insights/detect', [AIInsightsController::class, 'detect'])->name('ai-insights.detect');
                    });
                });

                // Analytics
                Route::middleware('module:analytics')->group(function () {
                    Route::middleware(['permission:view_any_analytics'])->group(function () {
                        Route::get('analytics', fn() => inertia('admin/analytics'))->name('analytics.index');
                    });
                });

                // Extensions
                Route::middleware(['permission:view_any_plugin'])->group(function () {
                    Route::get('plugins', [PluginController::class, 'index'])->name('plugins.index');
                    Route::post('plugins/{slug}/toggle', [PluginController::class, 'toggle'])->name('plugins.toggle');
                });
                    
                // Media
                Route::middleware(['permission:view_any_media'])
                    ->prefix('media')->name('media.')->group(function () {
                        Route::get('/', [MediaController::class, 'index'])->name('index');
                        Route::post('/', [MediaController::class, 'store'])->name('store');
                        Route::put('/{media}', [MediaController::class, 'update'])->name('update');
                        Route::post('/{media}/replace', [MediaController::class, 'replace'])->name('replace');
                        Route::patch('/{media}/metadata', [MediaController::class, 'metadata'])->name('metadata');
                        Route::patch('/{media}/crop', [MediaController::class, 'crop'])->name('crop');
                        Route::delete('/{media}', [MediaController::class, 'destroy'])->name('destroy');
                    });

                Route::middleware(['permission:view_any_media_folder'])
                    ->prefix('media-folders')->name('media-folders.')->group(function () {
                        Route::get('/', [MediaFolderController::class, 'index'])->name('index');
                        Route::post('/', [MediaFolderController::class, 'store'])->name('store');
                        Route::put('/{folder}', [MediaFolderController::class, 'update'])->name('update');
                        Route::delete('/{folder}', [MediaFolderController::class, 'destroy'])->name('destroy');
                    });
                Route::middleware(['auth'])->prefix('temporary-uploads')->name('temporary-uploads.')->group(function () {
                    Route::post('/', [TemporaryUploadController::class, 'store'])->name('store');
                    Route::delete('/{mediaLibrary}', [TemporaryUploadController::class, 'destroy'])->name('destroy');
                });

                // Settings
                Route::middleware(['permission:view_any_setting'])->prefix('settings')->name('settings.')->group(function () {
                    Route::get('/', [SettingController::class, 'index'])->name('index');

                    Route::patch('general', [SettingController::class, 'updateGeneral'])->name('general.update');
                    Route::patch('localization', [SettingController::class, 'updateLocalization'])->name('localization.update');

                    Route::patch('seo', [SettingController::class, 'updateSeo'])->name('seo.update');
                    Route::post('seo/generate/{type}', [SettingController::class, 'generateSeoFile'])->name('seo.generate');

                    Route::patch('email', [SettingController::class, 'updateEmail'])->name('email.update');
                    Route::post('email/test', [SettingController::class, 'sendTestEmail'])->name('email.test');

                    Route::patch('storage', [SettingController::class, 'updateStorage'])->name('storage.update');
                    Route::patch('advanced', [SettingController::class, 'updateAdvanced'])->name('advanced.update');
                    Route::patch('integrations', [SettingController::class, 'updateIntegration'])->name('integrations.update');

                    Route::prefix('security')->name('security.')->group(function () {
                        Route::patch('/', [SettingController::class, 'updateSecurity'])->name('update');
                        Route::delete('sessions/{sessionId}', [SettingController::class, 'destroySession'])->name('sessions.destroy');
                    });

                    Route::prefix('api-keys')->name('api-keys.')->group(function () {
                        Route::post('/', [SettingController::class, 'storeApiKey'])->name('store');

                        Route::prefix('{apiKey}')->group(function () {
                            Route::patch('/', [SettingController::class, 'updateApiKey'])->name('update');
                            Route::post('/regenerate', [SettingController::class, 'regenerateApiKey'])->name('regenerate');
                            Route::delete('/', [SettingController::class, 'destroyApiKey'])->name('destroy');
                        });
                    });

                    Route::prefix('webhooks')->name('webhooks.')->group(function () {
                        Route::post('/', [SettingController::class, 'storeWebhook'])->name('store');

                        Route::prefix('{webhook}')->group(function () {
                            Route::patch('/', [SettingController::class, 'updateWebhook'])->name('update');
                            Route::delete('/', [SettingController::class, 'destroyWebhook'])->name('destroy');
                            Route::post('/test', [SettingController::class, 'testWebhook'])->name('test');
                        });
                    });

                    Route::prefix('plugins/{plugin}')->name('plugins.')->group(function () {
                        Route::patch('/toggle', [SettingController::class, 'togglePlugin'])->name('toggle');
                    });

                    Route::prefix('backups')->name('backups.')->group(function () {
                        Route::patch('settings', [SettingController::class, 'updateBackupSettings'])->name('settings');
                        Route::post('run', [SettingController::class, 'runBackup'])->name('run');

                        Route::prefix('{backup}')->group(function () {
                            Route::delete('/', [SettingController::class, 'destroyBackup'])->name('destroy');
                            Route::get('/download', [SettingController::class, 'downloadBackup'])->name('download');
                        });
                    });

                    Route::post('system/{action}', [SettingController::class, 'runSystemAction'])->name('system.run');

                    // Billing & Plans
                    Route::prefix('billing')->name('billing.')->group(function () {
                        Route::patch('auto-renewal', [BillingController::class, 'toggleAutoRenewal'])->name('auto-renewal');
                        Route::post('cancel', [BillingController::class, 'cancelSubscription'])->name('cancel');
                        Route::post('resume', [BillingController::class, 'resumeSubscription'])->name('resume');
                        Route::patch('contact', [BillingController::class, 'updateContact'])->name('contact');

                        Route::prefix('plans')->name('plans.')->group(function () {
                            Route::middleware('superadmin')->group(function () { 
                                Route::post('/', [PlanController::class, 'store'])->name('store');
                                Route::prefix('{plan}')->group(function () {
                                    Route::patch('/', [PlanController::class, 'update'])->name('update');
                                    Route::delete('/', [PlanController::class, 'destroy'])->name('destroy');
                                });
                            });
                            Route::prefix('{plan}')->group(function () {
                                Route::patch('switch', [BillingController::class, 'switchPlan'])->name('switch-plan');
                                Route::post('sync', [PlanController::class, 'sync'])->name('sync');
                            });
                        });

                        Route::prefix('payment-methods')->name('payment-methods.')->group(function () {
                            Route::post('/', [BillingController::class, 'storePaymentMethod'])->name('store');

                            Route::prefix('{paymentMethod}')->group(function () {
                                Route::patch('/default', [BillingController::class, 'setDefaultPaymentMethod'])->name('default');
                                Route::delete('/', [BillingController::class, 'destroyPaymentMethod'])->name('destroy');
                            });
                        });

                        Route::prefix('invoices/{invoice}')->name('invoices.')->group(function () {
                            Route::get('/download', [BillingController::class, 'downloadInvoice'])->name('download');
                        });
                    });
                });

                // Email
                Route::post('email/send-test', [EmailController::class, 'sendTestEmail'])->name('email.send-test');

                // Permissions
                Route::prefix('system')->group(function () {
                    Route::middleware(['permission:view_any_user'])
                        ->resource('users', UserController::class);

                    Route::middleware(['system.permission.sync'])
                        ->post('permissions/generate', [PermissionController::class, 'generateForModel'])
                        ->name('permissions.generate');

                    Route::middleware(['permission:view_any_permission'])
                        ->resource('permissions', PermissionController::class);

                    Route::middleware(['permission:view_any_role'])
                        ->group(function () {
                            Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
                            Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
                            Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
                            Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
                            Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
                            Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
                            Route::patch('/roles/{role}/permissions/{permission}', [RoleController::class, 'togglePermission'])->name('roles.togglePermission');
                        });
                });
            });
    });

Route::get('posts/{slug}', [FrontController::class, 'showPost'])->name('post.show');
Route::get('products/{slug}', [FrontController::class, 'showProduct'])->name('product.show');
Route::get('checkout', [FrontController::class, 'checkout'])->name('checkout');

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::patch('/passkey/{passkey}', [PasskeyController::class, 'update'])->name('passkey.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/ecommerce.php';