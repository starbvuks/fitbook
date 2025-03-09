```md
# Dynamic APIs are Asynchronous in Next.js

This document explains why you might encounter a warning related to accessing certain APIs synchronously in Next.js and provides solutions to address it.

## Why This Warning Occurred

The warning arises when you use an API in your code that has been updated to opt into dynamic rendering. These Dynamic APIs include:

*   The `params` and `searchParams` props provided to pages, layouts, metadata APIs, and route handlers.
*   `cookies()`, `draftMode()`, and `headers()` from `next/headers`.

In Next.js 15, these APIs have been made asynchronous. Directly accessing their properties without awaiting them will trigger a warning. Future versions of Next.js will enforce asynchronous access, making direct synchronous access impossible.

**Example (Incorrect - triggers a warning):**

```
// app/[id]/page.js
function Page({ params }) {
  // direct access of `params.id`.
  return ID: {params.id};
}
```

This also includes enumerating (e.g., `{...params}`, or `Object.keys(params)`) or iterating over the return value of these APIs (e.g., `[...headers()]` or `for (const cookie of cookies())`, or explicitly with `cookies()[Symbol.iterator]()`).

## Possible Ways to Fix It

### Automatic Fix with Codemod

The `@next/codemod` tool can automatically fix many of these cases:

```
npx @next/codemod@canary next-async-request-api .
```

However, the codemod might not cover all scenarios, requiring manual adjustments.

### Manual Fixes

**1. Server Components and Route Handlers:**

If the warning originates from a Server Component or a Route Handler, you must `await` the dynamic API before accessing its properties:

```
async function Page({ params }) {
  // asynchronous access of `params.id`.
  const { id } = await params;
  return ID: {id};
}
```

**2. Client Components:**

If the warning occurs within a synchronous Client Component, use `React.use()` to unwrap the Promise:

```
'use client'
import * as React from 'react'

function Page({ params }) {
  // asynchronous access of `params.id`.
  const { id } = React.use(params);
  return ID: {id};
}
```

### Unmigratable Cases

If the Next.js codemod encounters code it cannot automatically migrate, it will insert a comment with the `@next-codemod-error` prefix.  You must address these manually.

For example:

```
export function MyCookiesComponent() {
  const c =
    /* @next-codemod-error Manually await this call and refactor the function to be async */
    cookies();
  return c.get('name');
}
```

In such cases, you'll typically need to:

1.  Change the function to `async`.
2.  `await` the call to the Dynamic API (e.g., `cookies()`).
3.  Refactor the usages of the function to properly `await` the result.

### Enforced Migration with Linter

Next.js enforces addressing `@next-codemod-error` comments.  If you don't resolve them, your application will error in both development and production builds.

**Options:**

*   **Fix the Issue:**  Make the necessary code changes and remove the `@next-codemod-error` comment.
*   **Ignore the Issue (Use with Caution):** If there's no action to be taken or you intentionally want to bypass the check, replace `@next-codemod-error` with `@next-codemod-ignore`.

```
- /* @next-codemod-error  */
+ /* @next-codemod-ignore */
```

### Optimization Tip

Delay unwrapping the Promise (using `await` or `React.use()`) until the point where you actually need the value. This can enable Next.js to statically render more of your page.
```

Citations:
[1] https://nextjs.org/docs/messages/sync-dynamic-apis