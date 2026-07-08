Here's the complete picture — the `useFetch` hook, the server actions (data model), and the component:

### 1. `hooks/use-fetch.js`

```javascript
"use client";

import { useState } from "react";

// A generic hook to call any async function (like a server action)
// and track its loading/data/error state.
const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args); // call the server action
      setData(response);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn };
};

export default useFetch;
```

### 2. `actions/settings.js` (server actions — the "data model")

```javascript
"use server";

// Pretend this is your database (in real life, use Prisma/etc.)
let db = {
  value: "Hello World",
};

export async function getData() {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 500));

  return {
    success: true,
    data: { value: db.value },
  };
}

export async function saveData(newValue) {
  await new Promise((r) => setTimeout(r, 500));

  // Simulate a save
  db.value = newValue;

  return {
    success: true,
    data: { value: db.value },
  };
}
```

### 3. `components/SimpleForm.jsx`

```jsx
"use client";

import { useState, useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import { getData, saveData } from "@/actions/settings";
import { toast } from "sonner";

export default function SimpleForm() {
  const [value, setValue] = useState("");

  const { fn: fetchData, data: fetchResult, loading: fetching } = useFetch(getData);
  const { fn: saveValue, data: saveResult, loading: saving } = useFetch(saveData);

  // Load data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Sync fetched data into local state
  useEffect(() => {
    if (fetchResult?.success) {
      setValue(fetchResult.data.value);
    }
  }, [fetchResult]);

  // After save success -> toast + refetch
  useEffect(() => {
    if (saveResult?.success) {
      toast.success("Saved successfully!");
      fetchData();
    }
  }, [saveResult]);

  const handleSave = async () => {
    await saveValue(value);
  };

  if (fetching && !fetchResult) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ border: "1px solid gray", padding: 8, marginRight: 8 }}
      />
      <button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
```

### How it all connects:

```
Component calls useFetch(getData) / useFetch(saveData)
        ↓
useFetch wraps the server action with loading/data/error state
        ↓
fn() is called (e.g. fetchData() or saveValue())
        ↓
cb(...args) runs the actual server action (getData / saveData)
        ↓
Server action talks to DB, returns { success, data }
        ↓
useFetch stores that in `data`
        ↓
Component's useEffect watches `data` and reacts (update state / toast / refetch)
```

**Key idea:** `useFetch` is just a reusable wrapper so you don't repeat `try/catch` + loading state for every server call. Your real `SettingsForm` just uses this pattern **4 times** (once per action: get info, save hours, get users, update role) — same shape, just more fields.