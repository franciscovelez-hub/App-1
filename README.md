# Delta Tasks

Vista de solo lectura sobre las tareas de proyecto que Delta Consulting Partners
gestiona en Notion. Tres vistas —tabla, kanban y calendario— sobre los mismos
datos, con filtros compartibles por URL.

**La aplicación nunca escribe en Notion.** No hay un solo `create` ni `update`
en el código. Notion sigue siendo la fuente de verdad; esto es una lente.

---

## Puesta en marcha rápida

```bash
npm install
npm run dev
```

Sin configurar nada, la aplicación arranca en **modo demo** con 15 tareas de
ejemplo y lo anuncia con un banner. Sirve para ver la interfaz antes de tocar
Notion. Abre <http://localhost:3000/tasks> (si el puerto 3000 está ocupado,
Next elige el siguiente libre y lo indica en la consola).

Para leer datos reales, sigue los dos pasos siguientes.

---

## 1. Crear el token de Notion

1. Entra en <https://www.notion.so/profile/integrations> y pulsa
   **New integration**.
2. Ponle un nombre (por ejemplo `Delta Tasks — solo lectura`) y asóciala al
   workspace de Delta.
3. En **Capabilities**, deja marcado solo lo que hace falta:
   - **Read content** — imprescindible.
   - **Read user information including email addresses** — opcional pero
     recomendable: sin esto Notion no devuelve el nombre ni el avatar de los
     responsables, y la interfaz muestra iniciales genéricas.
   - **Insert content** y **Update content** pueden quedar desmarcadas. La
     aplicación no las usa.
4. Copia el **Internal Integration Secret** (empieza por `ntn_`).

Luego:

```bash
cp .env.local.example .env.local
```

y pega el token en `NOTION_TOKEN`. Los cuatro ids de base ya vienen rellenos en
el ejemplo; se aceptan con guiones o sin ellos.

`.env.local` está en `.gitignore`. El token no se commitea nunca.

## 2. Compartir las cuatro bases con la integración

Este es el paso que más se olvida: **crear la integración no le da acceso a
nada**. Hay que invitarla a cada base, una por una.

Para cada una de las cuatro bases (TASKS, CRM, ACTAS, PEOPLE):

1. Abre la base en Notion como página completa.
2. Menú `···` (arriba a la derecha) → **Connections** (o *Conexiones*).
3. Busca la integración por su nombre y añádela.

Si falta una, la aplicación cae a modo demo y muestra el mensaje de error que
devolvió Notion, normalmente un `object_not_found` con el id de la base que no
está compartida.

Comprueba que funciona recargando `/tasks`: si el banner de modo demo
desaparece, está leyendo Notion.

---

## Cómo está organizado

```
app/
  layout.tsx              Inter + JetBrains Mono, tema claro/oscuro
  page.tsx                redirige a /tasks
  tasks/page.tsx          Server Component: lee, filtra, ordena y reparte
  tasks/loading.tsx       esqueletos
components/
  tasks/                  kpi-bar, filters, las tres vistas, sheet de detalle
  ui/                     componentes de shadcn/ui (solo los que se usan)
lib/
  notion/client.ts        instancia del cliente y normalización de ids
  notion/types.ts         tipos de dominio: Task, Company, Meeting, Person
  notion/mappers.ts       página de Notion → tipo de dominio (funciones puras)
  notion/queries.ts       getTasks, getCompaniesById, getMeetingsById
  notion/mock.ts          datos de ejemplo para el modo demo
  utils/dates.ts          isOverdue, isThisWeek, relativeDue, rejilla mensual
  utils/tasks.ts          filtros, orden, KPIs y serialización a query string
```

Tres decisiones que conviene conocer antes de tocar el código:

- **Los tipos crudos de Notion no salen de `lib/notion/`.** Fuera de esa carpeta
  solo existen `Task`, `Company`, `Meeting` y `Person`. Si algún día se cambia
  de fuente de datos, se reescriben los mappers y nada más.
- **Toda la lectura ocurre en Server Components.** Los componentes de cliente
  reciben objetos planos ya filtrados; ninguno habla con Notion. Por eso las
  fechas viajan como cadenas ISO y no como `Date`.
- **El estado de la vista vive en la URL.** Pestaña activa, filtros, búsqueda,
  orden y mes del calendario son search params, así que cualquier vista se
  comparte pegando el enlace.

### Sobre la API de Notion

Desde la versión `2025-09-03` de la API, `databases.query` ya no existe: se
consulta una **data source**, y una base puede tener varias. Las variables de
entorno guardan ids de *base* —que es lo que se ve en la URL de Notion—, así
que `queries.ts` los traduce a data source en tiempo de ejecución con
`databases.retrieve`. Es transparente, pero explica por qué hay una llamada
extra por base.

El límite de Notion es de unas 3 peticiones por segundo. Para no acercarse:

- las relaciones se resuelven **en lote**: una consulta a CRM y una a ACTAS para
  todas las tareas, nunca una por tarea;
- todo se pagina con `start_cursor` hasta agotar `has_more`;
- el resultado completo se cachea 5 minutos con `unstable_cache`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | build de producción (comprueba también los tipos) |
| `npm run start` | sirve el build |
| `npm run lint` | ESLint |

## Diseño

Paleta cerrada de Delta: Navy `#04132E`, Lime `#B8E83C`, Carbon `#262626` y
Paper `#F7F5F0`. No hay gris, azul ni verde genéricos, tampoco rojo: una tarea
vencida se marca con una barra sobria en el borde y una etiqueta `VENCIDA` en
mono, no con color de alarma. Los estados usan los mismos colores en las tres
vistas, y cada combinación cumple contraste AA en claro y en oscuro.
# App-1
