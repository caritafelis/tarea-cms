<?php

return [
    'modules' => [
        'cms',
        'ecommerce',
        'multilanguage',
        'ai_insights',
        'analytics',
        'workflows',
        'environments',
        'audit_log',
        'sso',
    ],
    'locked_fields' => [
        'workflows'     => ['workflow_status', 'workflow_*'],
        'ai_insights'   => ['ai_description', 'ai_*'],
        'audit_log'     => ['audit_retention'],
        'analytics'     => ['analytics_*'],
    ],
];
