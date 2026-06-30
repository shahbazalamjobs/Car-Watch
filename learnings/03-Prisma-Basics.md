Since you like learning with the Pareto Principle, here's the **20% of Prisma that gives you 80% of the results**.

# The 20% of Prisma ORM You Must Learn

Learn these **5 things**, and you'll be able to build most CRUD applications.

---

## 1. Prisma Schema (Database Blueprint)

Everything starts in `schema.prisma`.

```prisma
model Car {
  id        String   @id @default(uuid())
  name      String
  price     Int
  createdAt DateTime @default(now())
}
```

### Remember:

- `model` = table
- field = column
- `@id` = primary key
- `@default()` = default value

Think:

```text
Model → Table
Field → Column
Record → Row
```

---

## 2. Generate Prisma Client

After changing the schema:

```bash
npx prisma generate
```

This creates:

```javascript
const prisma = new PrismaClient();
```

which gives you:

```javascript
prisma.car;
prisma.user;
prisma.order;
```

for each model.

---

## 3. CRUD Operations (Most Important)

## Create

```javascript
await prisma.car.create({
  data: {
    name: "BMW",
    price: 50000,
  },
});
```

### Rule

```text
create → data
```

---

## Read

### Find one

```javascript
await prisma.car.findUnique({
  where: {
    id: "123",
  },
});
```

### Find many

```javascript
await prisma.car.findMany();
```

### Filter

```javascript
await prisma.car.findMany({
  where: {
    price: {
      gt: 30000,
    },
  },
});
```

### Rule

```text
Read → where
```

---

## Update

```javascript
await prisma.car.update({
  where: {
    id: "123",
  },
  data: {
    price: 60000,
  },
});
```

### Rule

```text
update → where + data
```

---

## Delete

```javascript
await prisma.car.delete({
  where: {
    id: "123",
  },
});
```

### Rule

```text
delete → where
```

---

# 4. Filtering and Sorting

You'll use these constantly.

## Filter

```javascript
await prisma.car.findMany({
  where: {
    name: "BMW",
  },
});
```

## Greater than

```javascript
where: {
  price: {
    gt: 50000;
  }
}
```

## Contains

```javascript
where: {
  name: {
    contains: "bm",
    mode: "insensitive",
  },
}
```

## Order

```javascript
await prisma.car.findMany({
  orderBy: {
    createdAt: "desc",
  },
});
```

---

# 5. Relations

Example:

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

Fetch related data:

```javascript
await prisma.user.findUnique({
  where: {
    id: "1",
  },
  include: {
    cars: true,
  },
});
```

Remember:

```text
include = fetch related records
```

---

# Mental Model

```text
Schema
   ↓
Generate Client
   ↓
CRUD
   ↓
Filter/Sort
   ↓
Relations
```

# Cheat Sheet

| Task          | Prisma Method  |
| ------------- | -------------- |
| Create        | `create()`     |
| Get one       | `findUnique()` |
| Get many      | `findMany()`   |
| Update        | `update()`     |
| Delete        | `delete()`     |
| Count rows    | `count()`      |
| Related data  | `include`      |
| Select fields | `select`       |

# 80/20 Learning Order

1. Schema
2. `create`
3. `findMany`
4. `findUnique`
5. `update`
6. `delete`
7. `where`
8. `select`
9. `include`
10. Relations

Master these, and you'll be able to build most real-world apps using Prisma.
