Below is a basic modular implementation using:

* Next.js
* Prisma
* Supabase
* Google Gemini
* JavaScript + Tailwind CSS

---

# 1. Install Packages

```bash
npm install @supabase/supabase-js @google/genai
npm install prisma @prisma/client
```

---

# 2. Environment Variables

## `.env`

```env
DATABASE_URL="your_postgres_url"

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GEMINI_API_KEY=your_gemini_api_key
```

---

# 3. Prisma Schema

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Car {
  id        String   @id @default(uuid())

  imageUrl  String

  brand     String?
  model     String?
  color     String?
  type      String?

  createdAt DateTime @default(now())
}
```

Run:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

---

# 4. Prisma Client

## `lib/prisma.js`

```js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

---

# 5. Supabase Client

## `lib/supabase.js`

```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

---

# 6. Gemini Helper

## `lib/gemini.js`

````js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function extractCarDetails(file) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const base64 = buffer.toString("base64");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        text: `
Analyze this car image.

Return ONLY valid JSON.

{
  "brand":"",
  "model":"",
  "color":"",
  "type":""
}
        `,
      },
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ],
  });

  const text = response.text;

  try {
    return JSON.parse(text);
  } catch {
    const cleanedText = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleanedText);
  }
}
````

---

# 7. Server Action

## `app/actions/uploadCar.js`

```js
"use server";

import { supabase } from "@/lib/supabase";
import { extractCarDetails } from "@/lib/gemini";
import { db } from "@/lib/prisma";

export async function uploadCar(formData) {
  try {
    const file = formData.get("image");

    if (!file || file.size === 0) {
      throw new Error("No file selected");
    }

    // Upload to Supabase

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("cars")
      .upload(fileName, file);

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("cars")
      .getPublicUrl(fileName);

    // Gemini extraction

    const details = await extractCarDetails(file);

    // Save in database

    const car = await db.car.create({
      data: {
        imageUrl: publicUrl,
        brand: details.brand,
        model: details.model,
        color: details.color,
        type: details.type,
      },
    });

    return {
      success: true,
      car,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

# 8. Upload Component

## `components/CarUploadForm.jsx`

```jsx
"use client";

import { useState } from "react";
import { uploadCar } from "@/app/actions/uploadCar";

export default function CarUploadForm() {
  const [loading, setLoading] = useState(false);
  const [car, setCar] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData(e.target);

    const result = await uploadCar(formData);

    if (result.success) {
      setCar(result.car);
    } else {
      alert(result.error);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="file"
          name="image"
          accept="image/*"
          required
          className="border p-2 w-full rounded"
        />

        <button
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Upload Car"}
        </button>
      </form>

      {car && (
        <div className="mt-8 border p-4 rounded">
          <img
            src={car.imageUrl}
            alt=""
            className="w-full h-64 object-cover rounded"
          />

          <div className="mt-4 space-y-2">
            <p>
              <strong>Brand:</strong> {car.brand}
            </p>

            <p>
              <strong>Model:</strong> {car.model}
            </p>

            <p>
              <strong>Color:</strong> {car.color}
            </p>

            <p>
              <strong>Type:</strong> {car.type}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

# 9. Home Page

## `app/page.js`

```jsx
import CarUploadForm from "@/components/CarUploadForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <CarUploadForm />
    </main>
  );
}
```

---

# 10. Create Supabase Storage Bucket

Go to Supabase Dashboard:

```text
Storage
   ↓
Create Bucket
   ↓
Name: cars
   ↓
Public Bucket: ON
```

---

# Final Flow

```text
User Uploads Image
        ↓
Server Action
        ↓
Upload to Supabase Storage
        ↓
Gemini extracts details
        ↓
Save image URL + details in Prisma
        ↓
Return saved car data
        ↓
Display on frontend
```

This is the simplest production-style modular structure.
