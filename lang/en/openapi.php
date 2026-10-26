<?php

return [
    'info' => [
        'title' => 'CMS JSON:API v1 Specification',
        'description' => 'Complete OpenAPI 3.0 specification for the JSON:API v1 endpoints, dynamically generated from server schema definitions.',
    ],
    'server' => 'JSON:API v1 Production Server',
    'auth' => ['bearer' => 'Enter your Bearer Sanctum API Token'],
    'tag_description' => 'Operations for :label.',

    // Nombres legibles de cada grupo (opcional). Si falta, se usa el tipo en formato título.
    'tags' => [
        // 'posts' => 'Posts',
        // 'categories' => 'Categories',
    ],

    'param' => [
        'filter' => 'Filter :type by :key',
        'page_number' => 'Page number for pagination',
        'page_size' => 'Number of items per page',
        'include' => 'Include related resources (comma-separated)',
        'include_allowed' => 'Include related resources (comma-separated). Allowed: :list',
        'sort' => 'Sort fields (prefix with - for descending order)',
        'id' => 'Unique identifier of the :type',
    ],

    'list' => [
        'summary' => 'List all :type',
        'description' => 'Retrieve a paginated list of :type resources according to the JSON:API specification.',
        'ok' => 'List of :type retrieved successfully',
    ],
    'create' => [
        'summary' => 'Create a new :type',
        'description' => 'Create a new :type resource.',
        'ok' => ':type created successfully',
    ],
    'show' => [
        'summary' => 'Fetch a single :type',
        'description' => 'Retrieve a single :type by ID.',
        'ok' => ':type retrieved successfully',
    ],
    'update' => [
        'summary' => 'Update a :type',
        'description' => 'Update attributes or relationships of an existing :type.',
        'ok' => ':type updated successfully',
    ],
    'delete' => [
        'summary' => 'Delete a :type',
        'description' => 'Delete a :type resource by ID.',
        'ok' => ':type deleted successfully',
    ],

    'errors' => [
        'unauthorized' => 'Authentication token is missing or invalid',
        'forbidden' => 'Insufficient permissions or token team mismatch',
        'not_found' => 'The requested resource was not found',
        'validation' => 'JSON:API validation error',
    ],
];