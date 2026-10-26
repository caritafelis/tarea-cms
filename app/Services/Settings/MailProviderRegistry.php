<?php

namespace App\Services\Settings;

/**
 * Fuente única de verdad sobre qué campos necesita cada proveedor de correo.
 * El frontend recibe este catálogo tal cual y renderiza el formulario
 * dinámicamente, en vez de asumir SMTP para todos.
 */
class MailProviderRegistry
{
    public function all(): array
    {
        return [
            'smtp' => [
                'label' => 'SMTP',
                'description' => 'Cualquier servidor SMTP estándar (Mailtrap, tu propio servidor, etc.).',
                'fields' => [
                    ['key' => 'host', 'label' => 'Host', 'type' => 'text', 'placeholder' => 'smtp.mailtrap.io'],
                    ['key' => 'port', 'label' => 'Puerto', 'type' => 'number', 'placeholder' => '587'],
                    ['key' => 'encryption', 'label' => 'Encriptación', 'type' => 'select', 'options' => [
                        ['value' => 'tls', 'label' => 'TLS'],
                        ['value' => 'ssl', 'label' => 'SSL'],
                        ['value' => 'none', 'label' => 'Ninguna'],
                    ]],
                    ['key' => 'username', 'label' => 'Usuario', 'type' => 'text'],
                    ['key' => 'password', 'label' => 'Contraseña', 'type' => 'password'],
                ],
            ],
            'ses' => [
                'label' => 'Amazon SES',
                'description' => 'Envío vía Amazon Simple Email Service.',
                'fields' => [
                    ['key' => 'key', 'label' => 'Access Key ID', 'type' => 'text'],
                    ['key' => 'secret', 'label' => 'Secret Access Key', 'type' => 'password'],
                    ['key' => 'region', 'label' => 'Región', 'type' => 'text', 'placeholder' => 'us-east-1'],
                ],
            ],
            'postmark' => [
                'label' => 'Postmark',
                'description' => 'Envío transaccional vía Postmark.',
                'fields' => [
                    ['key' => 'token', 'label' => 'Server Token', 'type' => 'password'],
                ],
            ],
            'resend' => [
                'label' => 'Resend',
                'description' => 'Envío vía la API de Resend.',
                'fields' => [
                    ['key' => 'api_key', 'label' => 'API key', 'type' => 'password'],
                ],
            ],
            'mailgun' => [
                'label' => 'Mailgun',
                'description' => 'Envío vía la API de Mailgun.',
                'fields' => [
                    ['key' => 'domain', 'label' => 'Dominio', 'type' => 'text', 'placeholder' => 'mg.tudominio.com'],
                    ['key' => 'secret', 'label' => 'API key', 'type' => 'password'],
                    ['key' => 'endpoint', 'label' => 'Endpoint', 'type' => 'text', 'placeholder' => 'api.mailgun.net'],
                ],
            ],
            'sendmail' => [
                'label' => 'Sendmail',
                'description' => 'Usa el binario sendmail del servidor. No requiere credenciales.',
                'fields' => [],
            ],
            'log' => [
                'label' => 'Log (solo pruebas)',
                'description' => 'No envía nada real; escribe el correo en el log de la aplicación.',
                'fields' => [],
            ],
        ];
    }

    public function fieldsFor(string $mailer): array
    {
        return $this->all()[$mailer]['fields'] ?? [];
    }

    public function exists(string $mailer): bool
    {
        return isset($this->all()[$mailer]);
    }
}
