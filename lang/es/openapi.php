<?php

return [
    'info' => [
        'title' => 'Especificación CMS JSON:API v1',
        'description' => 'Especificación OpenAPI 3.0 completa de los endpoints JSON:API v1, generada dinámicamente a partir de los schemas del servidor.',
    ],
    'server' => 'Servidor de producción JSON:API v1',
    'auth' => ['bearer' => 'Ingresa tu token de API Bearer (Sanctum)'],
    'tag_description' => 'Operaciones de :label.',

    // Nombres legibles de cada grupo (opcional). Si falta, se usa el tipo en formato título.
    'tags' => [
        // 'posts' => 'Publicaciones',
        // 'categories' => 'Categorías',
    ],

    'param' => [
        'filter' => 'Filtrar :type por :key',
        'page_number' => 'Número de página',
        'page_size' => 'Cantidad de elementos por página',
        'include' => 'Incluir recursos relacionados (separados por coma)',
        'include_allowed' => 'Incluir recursos relacionados (separados por coma). Permitidos: :list',
        'sort' => 'Campos de ordenamiento (prefijo - para orden descendente)',
        'id' => 'Identificador único de :type',
    ],

    'list' => [
        'summary' => 'Listar :type',
        'description' => 'Obtiene una lista paginada de recursos :type según la especificación JSON:API.',
        'ok' => 'Lista de :type obtenida correctamente',
    ],
    'create' => [
        'summary' => 'Crear :type',
        'description' => 'Crea un nuevo recurso :type.',
        'ok' => ':type creado correctamente',
    ],
    'show' => [
        'summary' => 'Obtener un :type',
        'description' => 'Obtiene un :type por su ID.',
        'ok' => ':type obtenido correctamente',
    ],
    'update' => [
        'summary' => 'Actualizar :type',
        'description' => 'Actualiza los atributos o relaciones de un :type existente.',
        'ok' => ':type actualizado correctamente',
    ],
    'delete' => [
        'summary' => 'Eliminar :type',
        'description' => 'Elimina un recurso :type por su ID.',
        'ok' => ':type eliminado correctamente',
    ],

    'errors' => [
        'unauthorized' => 'El token de autenticación falta o no es válido',
        'forbidden' => 'Permisos insuficientes o el equipo del token no coincide',
        'not_found' => 'No se encontró el recurso solicitado',
        'validation' => 'Error de validación JSON:API',
    ],
];