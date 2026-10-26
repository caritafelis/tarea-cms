import { Button } from '@/components/ui/button';

export default function SessionsSection() {
    return (
        <section className="rounded-xl border p-6">
            <div className="space-y-2">
                <h3 className="font-medium">
                    Sesiones activas
                </h3>

                <p className="text-sm text-muted-foreground">
                    Revisa todos los dispositivos conectados a tu cuenta.
                </p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
                <div>
                    <p className="font-medium">
                        Dispositivo actual
                    </p>

                    <p className="text-sm text-muted-foreground">
                        MacOS • Chrome
                    </p>
                </div>

                <Button variant="outline">
                    Cerrar todas las sesiones
                </Button>
            </div>
        </section>
    );
}