"use server";

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializeCarData } from "@/lib/helper";

// Function to convert File to base64
async function fileToBase64(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString("base64");
}

export async function processCarImageWithAi(file) {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    // Initialize Gemini API
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Convert image file to base64
    const base64Image = await fileToBase64(file);

    // Create image part for the model
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    // Define the prompt for car detail extraction
    const prompt = `
        Analyze this car image and extract the following information:
        1. Make (manufacturer)
        2. Model
        3. Year (approximately)
        4. Color
        5. Body type (SUV, Sedan, Hatchback, etc.)
        6. Mileage
        7. Fuel type (your best guess)
        8. Transmission type (your best guess)
        9. Price (your best guess)
        10. Short Description as to be added to a car listing

        Format your response as a clean JSON object with these fields:
        {
            "make": "",
            "model": "",
            "year": 0000,
            "color": "",
            "price": "",
            "mileage": "",
            "bodyType": "",
            "fuelType": "",
            "transmission": "",
            "description": "",
            "confidence": 0.0
        }

        For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
        Only respond with the JSON object, nothing else.
    `;

    // Get response from Gemini
    const result = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [imagePart, { text: prompt }],
        },
      ],
    });

    const text = result.text;
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const carDetails = JSON.parse(cleanedText);

      // Validate the response format
      const requiredFields = [
        "make",
        "model",
        "year",
        "color",
        "bodyType",
        "price",
        "mileage",
        "fuelType",
        "transmission",
        "description",
        "confidence",
      ];

      const missingFields = requiredFields.filter(
        (field) => !(field in carDetails),
      );

      if (missingFields.length > 0) {
        throw new Error(
          `AI response missing required fields: ${missingFields.join(", ")}`,
        );
      }

      // Return success response with data
      return {
        success: true,
        data: carDetails,
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", text);
      return {
        success: false,
        error: "Failed to parse AI response",
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Gemini API error: " + error.message);
  }
}

export async function addCar({ carData, images }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const carId = uuidv4();
    const folderPath = `cars/${carId}`;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const imageUrls = [];

    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i];

      // Skip if image data is not valid
      if (!base64Data || !base64Data.startsWith("data:image/")) {
        console.warn("Skipping invalid image data");
        continue;
      }

      // Extract the base64 part (remove the data:image/xyz;base64, prefix)
      const base64 = base64Data.split(",")[1];
      const imageBuffer = Buffer.from(base64, "base64");

      // Determine file extension from the data URL
      const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
      const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

      // Create filename
      const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload the file buffer directly
      const { data, error } = await supabase.storage
        .from("car-images")
        .upload(filePath, imageBuffer, {
          contentType: `image/${fileExtension}`,
        });

      if (error) {
        console.error("Error uploading image:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL for the uploaded file
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;

      imageUrls.push(publicUrl);
    }

    if (imageUrls.length === 0) {
      throw new Error("No valid images were uploaded");
    }

    // Add the car to the database
    const car = await db.car.create({
      data: {
        id: carId,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        color: carData.color,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        bodyType: carData.bodyType,
        seats: carData.seats,
        description: carData.description,
        status: carData.status,
        featured: carData.featured,
        images: imageUrls,
      },
    });

    // Revalidate the cars list page
    revalidatePath("/admin/cars");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error adding car:", error);
    throw new Error("Error adding car: " + error.message);
  }
}

// Fetch all cars with simple search
export async function getCars(search = "") {
  try {
    // Build where conditions
    let where = {};

    // Add search filter
    if (search) {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute main query
    const cars = await db.car.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const serializedCars = cars.map(serializeCarData);

    return {
      success: true,
      data: serializedCars,
    };
  } catch (error) {
    console.error("Error fetching cars:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteCar(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // First, fetch the car to get its images
    const car = await db.car.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Delete the car from the database
    await db.car.delete({
      where: { id },
    });

    // Delete the images from Supabase storage
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);

      const filePaths = car.images
        .map((imageUrl) => {
          const url = new URL(imageUrl);
          const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
          return pathMatch ? pathMatch[1] : null;
        })
        .filter(Boolean);

      if (filePaths.length > 0) {
        const { error } = await supabase.storage
          .from("car-images")
          .remove(filePaths);

        if (error) {
          console.error("Error deleting images:", error);
          // We continue even if image deletion fails
        }
      }
    } catch (storageError) {
      console.error("Error with storage operations:", storageError);
      // Continue with the function even if storage operations fail
    }

    revalidatePath("/admin/cars");

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

export async function updateCarStatus(id, { status, featured }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const updateData = {};

    if(status !== undefined) {
      updateData.status = status;
    }

    if(featured !== undefined) {
      updateData.featured = featured;
    }

    // Update the car
    await db.car.update({
      where: {id},
      data: updateData,
    });

    return {
      success: true,
    }
  } catch (error) {
      console.error("Error deleting car:", error);
      return {
        success: false,
        error: error.message,
      }
  }
}
