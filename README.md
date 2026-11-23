# Proyecto Base — Parcial Práctico Backend (NestJS + MongoDB)

API REST en NestJS y Mongoose para la gestión de **Usuarios (`/users`)** y **Tareas (`/tasks`)**.

---

## Requisitos Previos

- **Node.js** 18+ y **npm**
- **Docker Desktop** (o instancia local de MongoDB en el puerto `27017`)

---

## Instalación y Puesta en Marcha

1. **Levantar la base de datos MongoDB:**
   ```bash
   docker compose up -d
   ```
   *(Si utilizas una instancia local o MongoDB Atlas diferente a `mongodb://localhost:27017/nest-parcial`, configura la variable `MONGODB_URI` en un archivo `.env` tomando como base `.env.example`.)*

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Iniciar la aplicación en modo desarrollo:**
   ```bash
   npm run start:dev
   ```
   El servidor quedará disponible en `http://localhost:3000`.

---

## Pruebas y Validación

- **Ejecutar pruebas unitarias:**
  ```bash
  npm test
  ```
- **Ejecutar pruebas end-to-end:**
  ```bash
  npm run test:e2e
  ```
- **Verificar compilación y linter:**
  ```bash
  npm run build
  npm run lint
  ```

## Evidencia de Funcionamiento de los Cuatro Casos

En esta parte se resumen las correcciones realizadas y la forma de comprobar que el sistema quedó funcionando. Para hacer las pruebas manuales se debe tener MongoDB encendido y la aplicación ejecutándose en `http://localhost:3000`.

### Caso 1: Validación de los datos de una tarea

Se creó el DTO `CreateTaskDto`. Este DTO solo permite recibir `title`, `description`, `completed` y `userId`. También se configuró un `ValidationPipe` global para rechazar propiedades adicionales. Por último, el esquema de Mongoose de tareas quedó con `strict: true`, para que MongoDB tampoco guarde campos que no pertenezcan al modelo.

Para comprobarlo, se puede enviar esta petición:

```http
POST http://localhost:3000/tasks
Authorization: admin-secret-token
Content-Type: application/json

{
  "title": "Tarea con datos adicionales",
  "userId": "ID_DE_UN_USUARIO_VALIDO",
  "isAdmin": true,
  "role": "superuser",
  "internalFlag": "DATO_NO_PERMITIDO"
}
```

El resultado esperado es `400 Bad Request`. La tarea no debe crearse. Si se envía una tarea usando únicamente los campos permitidos, el resultado esperado es `201 Created` y los campos adicionales no aparecen en el documento guardado.

### Caso 2: Uso de `UsersService` entre módulos

Se cambió la organización de los módulos para que `UsersService` sea el punto de contacto con la información de usuarios. `UsersModule` exporta este servicio y `TasksModule` importa `UsersModule`. El módulo de tareas ya no registra directamente `UserSchema` ni usa `UserModel`.

Para comprobar el comportamiento, primero se crea un usuario y se copia su `_id`. Después se envía una tarea válida:

```http
POST http://localhost:3000/tasks
Authorization: admin-secret-token
Content-Type: application/json

{
  "title": "Tarea para usuario existente",
  "userId": "ID_DE_UN_USUARIO_VALIDO"
}
```

El resultado esperado es `201 Created`. También se puede probar con un usuario que no exista:

```http
POST http://localhost:3000/tasks
Authorization: admin-secret-token
Content-Type: application/json

{
  "title": "Tarea sin usuario",
  "userId": "600000000000000000000000"
}
```

En este segundo caso el resultado esperado es `404 Not Found`. Esto demuestra que antes de guardar la tarea se consulta el usuario mediante `UsersService`.

### Caso 3: Autorización solamente para crear tareas

Se eliminó el middleware que bloqueaba todas las rutas de tareas. En su lugar se creó `AuthGuard`, que revisa la cabecera `Authorization` y lanza `ForbiddenException` cuando el token no es `admin-secret-token`. El guard se aplica únicamente a `POST /tasks`.

La consulta de tareas debe funcionar sin autorización:

```http
GET http://localhost:3000/tasks
Accept: application/json
```

El resultado esperado es `200 OK`.

En cambio, crear una tarea sin autorización debe fallar:

```http
POST http://localhost:3000/tasks
Content-Type: application/json

{
  "title": "Tarea sin autorización",
  "userId": "ID_DE_UN_USUARIO_VALIDO"
}
```

El resultado esperado es `403 Forbidden`. El mismo resultado debe ocurrir si se envía un token diferente a `admin-secret-token`. Con el token correcto y un usuario existente, el resultado esperado es `201 Created`.

### Caso 4: Controlador dependiente solamente de `TasksService`

Se eliminaron del controlador las inyecciones de `TaskModel`, `UserModel` y `UsersService`. Ahora `TasksController` solamente recibe `TasksService`. La validación del usuario y la creación de la tarea se realizan dentro de `TasksService.create()`.

La comprobación principal de este caso es una prueba unitaria del controlador usando únicamente un mock de `TasksService`. El controlador debe poder construirse sin registrar modelos de Mongoose. Además, al ejecutar `controller.create(dto)`, se debe comprobar que se llama a:

```ts
expect(tasksService.create).toHaveBeenCalledWith(dto);
```

También se debe comprobar en la prueba del servicio que `UsersService.findById()` se ejecuta antes de `TaskModel.create()`. De esta manera, la lógica de creación queda cubierta en el servicio y el controlador solo se encarga de recibir el DTO y delegar la operación.

### Resultados de las validaciones realizadas

Después de aplicar los cambios se ejecutaron las siguientes validaciones:

```bash
npm run build
npm run lint
npm test -- --runInBand
```

- La compilación terminó correctamente.
- El linter terminó correctamente.
- Las pruebas unitarias existentes terminaron correctamente.
- Una comprobación aislada confirmó que los campos adicionales producen un error `400` y que el esquema de tareas está en modo estricto.
- Otra comprobación confirmó que `AuthGuard` rechaza un token incorrecto, acepta `admin-secret-token` y solo protege `POST /tasks`.
- Una comprobación con mocks confirmó que el controlador usa solamente `TasksService` y que el servicio valida al usuario antes de guardar la tarea.
---

## Endpoints del Sistema

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Público | Verificación básica del servidor |
| `POST` | `/users` | Público | Crear usuario (`name`, `email`) |
| `GET` | `/users` | Público | Listar usuarios registrados |
| `GET` | `/users/:id` | Público | Consultar usuario por ID |
| `GET` | `/tasks` | Público | Listar tareas registradas |
| `GET` | `/tasks/:id` | Público | Consultar tarea por ID |
| `POST` | `/tasks` | Restringido (`Authorization: admin-secret-token`) | Crear una tarea asociada a un usuario |

También puedes importar `nest-parcial.postman_collection.json` en Postman o utilizar `requests.http` con la extensión REST Client de VS Code para probar manualmente los endpoints.
