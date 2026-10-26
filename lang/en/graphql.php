<?php

return [
    'title' => ':app GraphQL API',

    'common_fields' => [
        'id' => 'Unique identifier.',
        'createdAt' => 'Creation date.',
        'updatedAt' => 'Last update date.',
        'deletedAt' => 'Deletion date.',
    ],

    'common_args' => [
        'id' => 'Record identifier.',
        'first' => 'Number of results per page.',
        'page' => 'Page number.',
        'input' => 'Input data.',
        'where' => 'Filter conditions.',
        'orderBy' => 'Sorting criteria.',
        'search' => 'Search text.',
    ],

    'types' => [
        'PaginatorInfo' => 'Pagination information for a list.',
        'Address' => 'Postal address attached to a record.',
    ],

    'fields' => [
        'PaginatorInfo' => [
            'count' => 'Number of items on the current page.',
            'currentPage' => 'Current page.',
            'firstItem' => 'Position of the first item on the page.',
            'hasMorePages' => 'Whether more pages exist.',
            'lastItem' => 'Position of the last item on the page.',
            'lastPage' => 'Last available page.',
            'perPage' => 'Items per page.',
            'total' => 'Total number of items.',
        ],
        'Address' => [
            'street' => 'Street and number.',
        ],
    ],

    'operations' => [
        'address' => 'Fetches an address by its identifier.',
        'addresses' => 'Lists addresses with pagination.',
    ],

    'args' => [
        'addresses' => [
            'first' => 'Number of addresses per page.',
        ],
    ],

    'enums' => [
        'SortOrder' => [
            'ASC' => 'Ascending order.',
            'DESC' => 'Descending order.',
        ],
    ],
];