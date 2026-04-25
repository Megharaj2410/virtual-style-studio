import whiteTshirt from "@/assets/garments/white-tshirt.jpg";
import blackJacket from "@/assets/garments/black-jacket.jpg";
import grayHoodie from "@/assets/garments/gray-hoodie.jpg";
import denimJacket from "@/assets/garments/denim-jacket.jpg";
import stripedShirt from "@/assets/garments/striped-shirt.jpg";
import beigeSweater from "@/assets/garments/beige-sweater.jpg";

export type GarmentCategory = "upper_body" | "lower_body" | "dresses";

export interface Garment {
  id: string;
  name: string;
  description: string;
  category: GarmentCategory;
  thumbnail: string; // local import for grid
  // Public URL of the garment that the model can fetch.
  // We use the same image hosted via the deployed app's /garments route so Replicate can fetch it.
  publicUrl: string;
  tag: string;
}

// At runtime, we serve garment images from the app origin. Vite import URLs are absolute
// in production builds, so we can pass them straight through.
const url = (asset: string) => new URL(asset, window.location.origin).href;

export const GARMENTS: Garment[] = [
  {
    id: "white-tshirt",
    name: "Classic White Tee",
    description: "a plain white crew-neck cotton t-shirt",
    category: "upper_body",
    thumbnail: whiteTshirt,
    publicUrl: url(whiteTshirt),
    tag: "Essential",
  },
  {
    id: "striped-shirt",
    name: "Navy Striped Long Sleeve",
    description: "a navy and white striped long-sleeve shirt",
    category: "upper_body",
    thumbnail: stripedShirt,
    publicUrl: url(stripedShirt),
    tag: "Casual",
  },
  {
    id: "gray-hoodie",
    name: "Gray Pullover Hoodie",
    description: "a gray pullover hoodie",
    category: "upper_body",
    thumbnail: grayHoodie,
    publicUrl: url(grayHoodie),
    tag: "Streetwear",
  },
  {
    id: "beige-sweater",
    name: "Beige Knit Sweater",
    description: "a beige knit crew-neck sweater",
    category: "upper_body",
    thumbnail: beigeSweater,
    publicUrl: url(beigeSweater),
    tag: "Cozy",
  },
  {
    id: "denim-jacket",
    name: "Blue Denim Jacket",
    description: "a blue denim jacket",
    category: "upper_body",
    thumbnail: denimJacket,
    publicUrl: url(denimJacket),
    tag: "Layer",
  },
  {
    id: "black-jacket",
    name: "Black Leather Jacket",
    description: "a black leather biker jacket",
    category: "upper_body",
    thumbnail: blackJacket,
    publicUrl: url(blackJacket),
    tag: "Edgy",
  },
];
