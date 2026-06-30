Let's build a very simple frontend in Next.js that uses the server actions we created.

We'll create a page where users can:

1. Add a car
2. View all cars
3. Delete a car

## Folder Structure

```text
app/
├── actions/
│   └── car.js
├── page.js
└── components/
    └── CarForm.js
```

---

## 1. Server Actions (`app/actions/car.js`)

```javascript
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCar(formData) {
  await db.car.create({
    data: {
      name: formData.get("name"),
      brand: formData.get("brand"),
      price: Number(formData.get("price")),
    },
  });

  revalidatePath("/");
}

export async function getCars() {
  return await db.car.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function deleteCar(id) {
  await db.car.delete({
    where: { id },
  });

  revalidatePath("/");
}
```

---

## 2. Frontend Page (`app/page.js`)

This is a **Server Component** by default.

```javascript
import { createCar, getCars, deleteCar } from "./actions/car";

export default async function HomePage() {
  const cars = await getCars();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Car CRUD App</h1>

      {/* Create Form */}
      <form action={createCar}>
        <input type="text" name="name" placeholder="Car Name" required />

        <input type="text" name="brand" placeholder="Brand" required />

        <input type="number" name="price" placeholder="Price" required />

        <button type="submit">Add Car</button>
      </form>

      <hr />

      {/* Read */}
      <h2>Cars List</h2>

      {cars.map((car) => (
        <div
          key={car.id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>{car.name}</h3>
          <p>Brand: {car.brand}</p>
          <p>Price: ₹{car.price}</p>

          {/* Delete */}
          <form action={deleteCar.bind(null, car.id)}>
            <button type="submit">Delete</button>
          </form>
        </div>
      ))}
    </div>
  );
}
```

---

# How it works

## Create

```jsx
<form action={createCar}>
```

When the form is submitted:

```text
User clicks Add
       ↓
Next.js sends FormData
       ↓
createCar() server action runs
       ↓
Data saved in database
       ↓
revalidatePath("/")
       ↓
Page refreshes with new data
```

---

## Read

```javascript
const cars = await getCars();
```

Since `page.js` is a Server Component:

```text
Page loads
    ↓
getCars() runs on server
    ↓
Data fetched from database
    ↓
HTML sent to browser
```

---

## Delete

```jsx
<form action={deleteCar.bind(null, car.id)}>
```

`bind` creates a new function:

```javascript
() => deleteCar(car.id);
```

So when the button is clicked:

```text
Delete button clicked
       ↓
deleteCar(car.id)
       ↓
Row deleted
       ↓
revalidatePath("/")
       ↓
Updated list shown
```

---

# Client Component Version (using `useState`)

If you want a more interactive UI (without full page refresh), you can create a Client Component:

```javascript
"use client";

import { useState } from "react";
import { createCar } from "@/app/actions/car";

export default function CarForm() {
  const [name, setName] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("brand", "Honda");
    formData.append("price", 1000000);

    await createCar(formData);

    setName("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <button>Add Car</button>
    </form>
  );
}
```

For beginners learning Next.js Server Actions, start with:

```jsx
<form action={serverAction}>
```

because it is the simplest and most idiomatic approach in the App Router.
