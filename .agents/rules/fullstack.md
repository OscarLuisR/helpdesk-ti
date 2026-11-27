# Entorno Full-Stack Obligatorio (Frontend + Backend + PostgreSQL)

Aunque este workspace esté anclado en el frontend (`./`), el proyecto completo se compone de dos repositorios hermanos que deben mantenerse siempre sincronizados:

- **Frontend (Vue 3 / Quasar):** `./` (carpeta actual)
- **Backend (Node.js / Express / PostgreSQL):** `../helpdesk-ti-backend`

## Regla de ejecución

Antes de dar por finalizada cualquier tarea que involucre estados de tickets, validaciones (`express-validator`), endpoints, roles, catálogos o reglas de negocio:

1. Inspecciona y actualiza el código del **Backend** en `../helpdesk-ti-backend`.
2. Actualiza o genera los scripts SQL / funciones almacenadas de **PostgreSQL** correspondientes.
3. Aplica los cambios en el **Frontend** (`./`).

Nunca implementes un cambio solo en el frontend si requiere soporte en la API o en la base de datos.
