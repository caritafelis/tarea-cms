<?php

return [
    'title' => 'API GraphQL de :app',
    
    'common_fields' => [
        'id' => 'Identificador único.',
        'createdAt' => 'Fecha de creación.',
        'updatedAt' => 'Fecha de la última actualización.',
        'deletedAt' => 'Fecha de eliminación.',
    ],
    
    'common_args' => [
        'id' => 'Identificador del registro.',
        'first' => 'Cantidad de resultados por página.',
        'page' => 'Número de página.',
        'input' => 'Datos de entrada.',
        'where' => 'Condiciones de filtrado.',
        'orderBy' => 'Criterios de ordenamiento.',
        'search' => 'Texto de búsqueda.',
    ],
    
    'types' => [
        'PaginatorInfo' => 'Información de paginación de una lista.',
        'Address' => 'Dirección postal asociada a un registro.',
    ],
    
    'fields' => [
        'PaginatorInfo' => [
            'count' => 'Cantidad de elementos en la página actual.',
            'currentPage' => 'Página actual.',
            'firstItem' => 'Posición del primer elemento de la página.',
            'hasMorePages' => 'Indica si hay más páginas.',
            'lastItem' => 'Posición del último elemento de la página.',
            'lastPage' => 'Última página disponible.',
            'perPage' => 'Elementos por página.',
            'total' => 'Total de elementos.',
        ],
        'Address' => [
            'street' => 'Calle y número.',
        ],
    ],
    
    'operations' => [
        'address' => 'Obtiene una dirección por su identificador.',
        'addresses' => 'Lista las direcciones con paginación.',
    ],
    
    'args' => [
        'addresses' => [
            'first' => 'Cantidad de direcciones por página.',
        ],
    ],

    'enums' => [
        'SortOrder' => [
            'ASC' => 'Orden ascendente.',
            'DESC' => 'Orden descendente.',
        ],
    ],
];