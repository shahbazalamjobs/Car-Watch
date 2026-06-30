Since you're learning Next.js with server actions, I'll explain CRUD using **Prisma + Next.js Server Actions**, which is the most common approach.

Let's assume we have a simple `Car` model.

```prisma
// prisma/schema.prisma

model Car {
  id        String   @id @default(uuid())
  name      String
  brand     String
  price     Int
  createdAt DateTime @default(now())
}
```

After creating the model:

```bash
npx prisma migrate dev --name init
```

---

# 1. Setup Prisma Client

Create `lib/prisma.js`

```javascript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

---

# 2. CREATE (Insert Data)

`actions/car.js`

```javascript
"use server";

import { db } from "@/lib/prisma";

export async function createCar(formData) {
  try {
    const car = await db.car.create({
      data: {
        name: formData.name,
        brand: formData.brand,
        price: Number(formData.price),
      },
    });

    return {
      success: true,
      data: car,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### SQL Equivalent

```sql
INSERT INTO Car (name, brand, price)
VALUES ('City', 'Honda', 1200000);
```

---

# 3. READ (Get Data)

## Get all cars

```javascript
"use server";

import { db } from "@/lib/prisma";

export async function getCars() {
  try {
    const cars = await db.car.findMany();

    return {
      success: true,
      data: cars,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

## Get one car by ID

```javascript
export async function getCar(id) {
  try {
    const car = await db.car.findUnique({
      where: {
        id,
      },
    });

    return {
      success: true,
      data: car,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### SQL Equivalent

```sql
SELECT * FROM Car;

SELECT * FROM Car WHERE id = '123';
```

---

# 4. UPDATE

```javascript
"use server";

import { db } from "@/lib/prisma";

export async function updateCar(id, formData) {
  try {
    const updatedCar = await db.car.update({
      where: {
        id,
      },
      data: {
        name: formData.name,
        brand: formData.brand,
        price: Number(formData.price),
      },
    });

    return {
      success: true,
      data: updatedCar,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### SQL Equivalent

```sql
UPDATE Car
SET name = 'Verna'
WHERE id = '123';
```

---

# 5. DELETE

```javascript
"use server";

import { db } from "@/lib/prisma";

export async function deleteCar(id) {
  try {
    await db.car.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### SQL Equivalent

```sql
DELETE FROM Car
WHERE id = '123';
```

---

# Most Common Prisma Methods

| Operation          | Prisma Method  |
| ------------------ | -------------- |
| Create one         | `create()`     |
| Create many        | `createMany()` |
| Get all            | `findMany()`   |
| Get one            | `findUnique()` |
| Get first matching | `findFirst()`  |
| Update one         | `update()`     |
| Update many        | `updateMany()` |
| Delete one         | `delete()`     |
| Delete many        | `deleteMany()` |
| Count rows         | `count()`      |

---

# Example Server Action Flow in Next.js

```text
User submits form
        ↓
Server Action called
        ↓
Prisma query runs
        ↓
Database updated
        ↓
Return success/error
        ↓
Frontend shows toast or refreshes list
```

Example:

```javascript
const result = await createCar({
  name: "City",
  brand: "Honda",
  price: 1200000,
});

if (result.success) {
  toast.success("Car added");
}
```

---

## Relationship Example

Suppose:

```prisma
model User {
  id    String @id @default(uuid())
  name  String
  cars  Car[]
}

model Car {
  id      String @id @default(uuid())
  model   String

  userId  String
  user    User @relation(fields: [userId], references: [id])
}
```

Create a car for a user:

```javascript
await db.car.create({
  data: {
    model: "BMW",

    user: {
      connect: {
        id: userId,
      },
    },
  },
});
```

Fetch user with cars:

```javascript
await db.user.findUnique({
  where: { id: userId },

  include: {
    cars: true,
  },
});
```

As you're building projects in Next.js, the methods you'll use 80% of the time are:

- `create()`
- `findMany()`
- `findUnique()`
- `update()`
- `delete()`
- `include`
- `connect`
- `where`
- `orderBy`
